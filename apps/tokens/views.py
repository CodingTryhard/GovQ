from django.db import transaction
from django.utils import timezone
from datetime import timedelta
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
    release_locked_slot,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def lock_slot(request):
    """Citizen selects a slot. Locks it immediately and creates a pending token (5 min expiry)."""
    slot_id = request.data.get('slot_id')

    with transaction.atomic():
        slot = Slot.objects.select_for_update().get(id=slot_id)

        if slot.status != Slot.Status.AVAILABLE:
            return Response({'error': 'Slot is no longer available.'}, status=400)

        # Lock the slot
        slot.status = Slot.Status.LOCKED
        slot.locked_at = timezone.now()
        slot.save()

        # Let's count valid tokens for this service on this date to assign token number
        today_valid_tokens = Token.objects.filter(
            slot__service=slot.service, 
            slot__date=slot.date
        ).exclude(status__in=['pending', 'cancelled']).count()
        
        token_number = today_valid_tokens + 1

        token = Token.objects.create(
            slot=slot,
            token_number=token_number,
            citizen_name='', # Blank for now
            citizen_email='',
            status=Token.Status.PENDING,
            expires_at=timezone.now() + timedelta(minutes=5)
        )

    return Response({
        'token_id': token.id,
        'token_number': token.token_number,
        'service': slot.service.name,
        'date': slot.date,
        'start_time': slot.start_time,
        'end_time': slot.end_time,
        'unique_hash': token.unique_hash,
        'expires_at': token.expires_at,
    }, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def book_token(request):
    """Citizen fills out details for their locked slot."""
    token_id     = request.data.get('token_id')
    name         = request.data.get('citizen_name')
    email        = request.data.get('citizen_email')
    phone        = request.data.get('citizen_phone', '')

    try:
        token = Token.objects.get(id=token_id, status=Token.Status.PENDING)
    except Token.DoesNotExist:
        return Response({'error': 'Token has expired or does not exist.'}, status=400)
        
    token.citizen_name = name
    token.citizen_email = email
    token.citizen_phone = phone
    token.save(update_fields=['citizen_name', 'citizen_email', 'citizen_phone'])

    return Response({'status': 'Details updated'}, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def call_next(request):
    service_id     = request.data.get('service_id')
    counter_number = request.data.get('counter_number', 1)

    next_token = (
        Token.objects
        .filter(slot__service_id=service_id, slot__date=timezone.now().date(), status='booked')
        .order_by('token_number')
        .first()
    )

    if not next_token:
        return Response({'message': 'No more tokens in queue.'})

    next_token.status = 'called'
    next_token.called_at = timezone.now()
    next_token.counter_number = counter_number
    next_token.save()

    handle_no_show_timeout.apply_async((next_token.id,), countdown=300)

    upcoming = (
        Token.objects
        .filter(slot__service_id=service_id, slot__date=timezone.now().date(), status='booked')
        .order_by('token_number')[2:3]
        .first()
    )
    if upcoming and not upcoming.reminder_sent:
        send_reminder_email(upcoming.id)

    from apps.tokens.consumers import broadcast_token_update
    broadcast_token_update(next_token)

    return Response({'called_token': next_token.token_number, 'counter': counter_number})


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_served(request, token_id):
    token = Token.objects.get(id=token_id)
    token.status = 'served'
    token.served_at = timezone.now()
    token.save()

    send_completion_email(token.id)
    from apps.tokens.consumers import broadcast_token_update
    broadcast_token_update(token)
    return Response({'status': 'served'})


@api_view(['GET'])
@permission_classes([AllowAny])
def ticket_detail(request, unique_hash):
    try:
        token = Token.objects.select_related('slot__service').get(unique_hash=unique_hash)
    except Token.DoesNotExist:
        return Response({'error': 'Ticket not found'}, status=404)
        
    return Response({
        'id': token.id,
        'token_number': token.token_number,
        'citizen_name': token.citizen_name,
        'service': token.slot.service.name,
        'date': token.slot.date,
        'start_time': token.slot.start_time,
        'end_time': token.slot.end_time,
        'status': token.status,
        'counter_number': token.counter_number,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_no_show(request, token_id):
    token = Token.objects.get(id=token_id)
    token.status = 'no_show'
    token.save()
    from apps.tokens.consumers import broadcast_token_update
    broadcast_token_update(token)
    return Response({'status': 'no_show'})


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_skipped(request, token_id):
    token = Token.objects.get(id=token_id)
    token.status = 'skipped'
    token.save()
    from apps.tokens.consumers import broadcast_token_update
    broadcast_token_update(token)
    return Response({'status': 'skipped'})


@api_view(['GET'])
@permission_classes([AllowAny])
def list_queue(request):
    service_id = request.query_params.get('service_id')
    if not service_id:
        return Response({'error': 'service_id required'}, status=400)
    
    tokens = Token.objects.filter(slot__service_id=service_id, slot__date=timezone.now().date(), status='booked').order_by('token_number')
    serializer = TokenSerializer(tokens, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_serving(request):
    service_id = request.query_params.get('service_id')
    if not service_id:
        return Response({'error': 'service_id required'}, status=400)
    
    tokens = Token.objects.filter(slot__service_id=service_id, slot__date=timezone.now().date(), status='called').order_by('token_number')
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
        
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        
        client.utility.verify_payment_signature(params_dict)
        
        # Mark paid
        token.payment_status = 'paid'
        token.razorpay_payment_id = razorpay_payment_id
        token.status = Token.Status.BOOKED
        token.save()

        # Update slot status
        slot = token.slot
        slot.status = Slot.Status.BOOKED
        slot.save()

        # Fire confirmation email synchronously after successful payment
        send_booking_confirmation(token.id)
        
        return Response({'status': 'Payment verified successfully'})
    except Exception as e:
        return Response({'error': 'Payment verification failed'}, status=400)
