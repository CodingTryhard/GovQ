from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Slot
from .serializers import SlotSerializer
from datetime import date

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def list_or_create_slots(request):
    if request.method == 'GET':
        service_id = request.query_params.get('service_id')
        date_param = request.query_params.get('date')
        
        slots = Slot.objects.all()
        if service_id:
            slots = slots.filter(service_id=service_id)
        if date_param:
            slots = slots.filter(date=date_param)
            
        slots = slots.order_by('date', 'hour')
        serializer = SlotSerializer(slots, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        # Need to extract service_id separately since serializer expects an instance for ForeignKeys by default unless configured
        # But ModelSerializer handles it if passed 'service' in data.
        serializer = SlotSerializer(data=request.data)
        # However, because we defined `service = ServiceSerializer(read_only=True)` in SlotSerializer, it won't accept a write for `service`.
        # So we have to handle it manually.
        
        service_id = request.data.get('service_id')
        try:
            from apps.services.models import Service
            service = Service.objects.get(id=service_id)
        except:
            return Response({'error': 'Valid service_id is required'}, status=400)
            
        # Create the slot directly
        try:
            slot = Slot.objects.create(
                service=service,
                date=request.data.get('date'),
                hour=request.data.get('hour'),
                total_capacity=request.data.get('total_capacity', 10),
                walkin_buffer=request.data.get('walkin_buffer', 3),
                is_blocked=request.data.get('is_blocked', False)
            )
            return Response(SlotSerializer(slot).data, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def slot_detail(request, slot_id):
    try:
        slot = Slot.objects.get(id=slot_id)
    except Slot.DoesNotExist:
        return Response(status=404)

    if request.method == 'PUT':
        # Admin updating slot (e.g. blocking it)
        if 'is_blocked' in request.data:
            slot.is_blocked = request.data['is_blocked']
        if 'total_capacity' in request.data:
            slot.total_capacity = request.data['total_capacity']
        slot.save()
        return Response(SlotSerializer(slot).data)

    elif request.method == 'DELETE':
        slot.delete()
        return Response(status=204)
