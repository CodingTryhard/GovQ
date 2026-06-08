from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import date, datetime, timedelta
from .models import Slot
from .serializers import SlotSerializer
from apps.services.models import Service

def generate_slots_for_day(service, target_date):
    """Automatically generate evenly divided slots based on service operating hours and slot count."""
    # Convert TimeField to datetime for math
    start_dt = datetime.combine(target_date, service.start_time)
    end_dt = datetime.combine(target_date, service.end_time)
    
    total_duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
    slot_duration_minutes = total_duration_minutes // service.number_of_slots
    
    slots_to_create = []
    current_dt = start_dt
    
    for _ in range(service.number_of_slots):
        slot_end_dt = current_dt + timedelta(minutes=slot_duration_minutes)
        slots_to_create.append(Slot(
            service=service,
            date=target_date,
            start_time=current_dt.time(),
            end_time=slot_end_dt.time(),
            status=Slot.Status.AVAILABLE
        ))
        current_dt = slot_end_dt
        
    Slot.objects.bulk_create(slots_to_create)

@api_view(['GET'])
@permission_classes([AllowAny])
def list_or_create_slots(request):
    service_id = request.query_params.get('service_id')
    date_param = request.query_params.get('date')
    
    if not service_id or not date_param:
        from django.utils import timezone
        slots = Slot.objects.filter(date=timezone.now().date()).order_by('start_time')
        serializer = SlotSerializer(slots, many=True)
        return Response(serializer.data)
        
    try:
        service = Service.objects.get(id=service_id)
    except Service.DoesNotExist:
        return Response({'error': 'Service not found'}, status=404)
        
    try:
        target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

    # Check if slots exist for this service and date
    slots = Slot.objects.filter(service=service, date=target_date)
    
    if not slots.exists():
        generate_slots_for_day(service, target_date)
        slots = Slot.objects.filter(service=service, date=target_date)
        
    # Lazy Expiration: check and release any expired locks before returning
    from django.utils import timezone
    from apps.tokens.models import Token
    expired_slots = slots.filter(status=Slot.Status.LOCKED)
    for s in expired_slots:
        pending_token = Token.objects.filter(slot=s, status=Token.Status.PENDING).first()
        if pending_token and pending_token.expires_at and timezone.now() > pending_token.expires_at:
            pending_token.delete()
            s.status = Slot.Status.AVAILABLE
            s.locked_at = None
            s.save()
            
    slots = slots.order_by('start_time')
    serializer = SlotSerializer(slots, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([AllowAny])
def slot_detail(request, slot_id):
    try:
        slot = Slot.objects.get(id=slot_id)
    except Slot.DoesNotExist:
        return Response(status=404)

    # Admin updating slot status (e.g. blocking it manually)
    if 'status' in request.data:
        slot.status = request.data['status']
        slot.save()
        
    return Response(SlotSerializer(slot).data)
