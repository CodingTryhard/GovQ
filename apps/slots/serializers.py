from rest_framework import serializers
from .models import Slot
from apps.services.serializers import ServiceSerializer

class SlotSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = Slot
        fields = ['id', 'service', 'date', 'start_time', 'end_time', 'status', 'is_full']
