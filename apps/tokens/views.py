from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.slots.models import Slot
from apps.tokens.models import Token
from apps.tokens.serializers import TokenSerializer
from apps.notifications.tasks import (
    send_booking_confirmation,
    send_reminder_email,
    send_completion_email,
    handle_no_show_timeout,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def book_token(request):
    """Citizen books a slot. Returns token number."""
    slot_id      = request.data.get('slot_id')
    name         = request.data.get('citizen_name')
    email        = request.data.get('citizen_email')
    phone        = request.data.get('citizen_phone', '')

    with transaction.atomic():
        slot = Slot.objects.select_for_update().get(id=slot_id)

        if slot.is_blocked:
            return Response({'error': 'Slot is blocked.'}, status=400)

        if slot.is_full:
            return Response({'error': 'Slot is full.'}, status=400)

        # Atomic token number: count existing + 1
        token_number = slot.tokens.exclude(status='cancelled').count() + 1

        token = Token.objects.create(
            slot=slot,
            token_number=token_number,
            citizen_name=name,
            citizen_email=email,
            citizen_phone=phone,
        )

    # Fire confirmation email asynchronously via Celery
    send_booking_confirmation.delay(token.id)

    return Response({
        'token_id': token.id,
        'token_number': token.token_number,
        'service': slot.service.name,
        'date': slot.date,
        'hour': slot.hour,
    }, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def call_next(request):
    """
    Counter staff calls the next token.
    Triggers:
      - reminder email to the token 3 positions ahead (Celery)
      - no-show timeout task in 5 minutes (Celery)
    """
    slot_id        = request.data.get('slot_id')
    counter_number = request.data.get('counter_number', 1)

    next_token = (
        Token.objects
        .filter(slot_id=slot_id, status='booked')
        .order_by('token_number')
        .first()
    )

    if not next_token:
        return Response({'message': 'No more tokens in queue.'})

    next_token.status = 'called'
    next_token.called_at = timezone.now()
    next_token.counter_number = counter_number
    next_token.save()

    # Schedule no-show check after 5 minutes
    handle_no_show_timeout.apply_async((next_token.id,), countdown=300)

    # Send reminder to the token 3 positions ahead in queue
    upcoming = (
        Token.objects
        .filter(slot_id=slot_id, status='booked')
        .order_by('token_number')[2:3]  # 3rd in line
        .first()
    )
    if upcoming and not upcoming.reminder_sent:
        send_reminder_email.delay(upcoming.id)

    # Broadcast to WebSocket display board
    from apps.tokens.consumers import broadcast_token_update
    broadcast_token_update(next_token)

    return Response({'called_token': next_token.token_number, 'counter': counter_number})


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_served(request, token_id):
    """Counter staff marks a token as served."""
    token = Token.objects.get(id=token_id)
    token.status = 'served'
    token.served_at = timezone.now()
    token.save()

    send_completion_email.delay(token.id)

    return Response({'status': 'served'})


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_skipped(request, token_id):
    """Admin skips a token entirely."""
    token = Token.objects.get(id=token_id)
    token.status = 'skipped'
    token.save()
    return Response({'status': 'skipped'})


@api_view(['GET'])
@permission_classes([AllowAny])
def list_queue(request):
    """Returns tokens currently in queue (booked state) for a slot."""
    slot_id = request.query_params.get('slot_id')
    if not slot_id:
        return Response({'error': 'slot_id required'}, status=400)
    
    tokens = Token.objects.filter(slot_id=slot_id, status='booked').order_by('token_number')
    serializer = TokenSerializer(tokens, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_serving(request):
    """Returns tokens currently being served (called state) for a slot."""
    slot_id = request.query_params.get('slot_id')
    if not slot_id:
        return Response({'error': 'slot_id required'}, status=400)
    
    tokens = Token.objects.filter(slot_id=slot_id, status='called').order_by('token_number')
    serializer = TokenSerializer(tokens, many=True)
    return Response(serializer.data)


import razorpay
from django.conf import settings

@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment(request, token_id):
    try:
        token = Token.objects.get(id=token_id)
        if token.payment_status == 'paid':
            return Response({'error': 'Already paid'}, status=400)
            
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        # Flat 10 RS fee (1000 paise)
        amount = 1000 
        
        order_data = {
            'amount': amount,
            'currency': 'INR',
            'receipt': f'token_{token.id}',
            'notes': {'citizen_name': token.citizen_name}
        }
        
        order = client.order.create(data=order_data)
        
        token.razorpay_order_id = order['id']
        token.save()
        
        return Response({
            'order_id': order['id'],
            'amount': amount,
            'key_id': settings.RAZORPAY_KEY_ID,
            'citizen_name': token.citizen_name,
            'citizen_email': token.citizen_email,
            'citizen_phone': token.citizen_phone
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_payment(request, token_id):
    try:
        token = Token.objects.get(id=token_id)
        
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        # Verify signature
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        
        client.utility.verify_payment_signature(params_dict)
        
        # If no exception thrown, signature is valid
        token.payment_status = 'paid'
        token.razorpay_payment_id = razorpay_payment_id
        token.save()
        
        return Response({'status': 'Payment verified successfully'})
    except Exception as e:
        return Response({'error': 'Payment verification failed'}, status=400)

