from rest_framework import serializers
from .models import Slot
from apps.services.serializers import ServiceSerializer

class SlotSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    available_capacity = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        fields = ['id', 'service', 'date', 'hour', 'total_capacity', 'walkin_buffer', 'is_blocked', 'prebooking_capacity', 'booked_count', 'is_full', 'available_capacity']

    def get_available_capacity(self, obj):
        return max(0, obj.prebooking_capacity - obj.booked_count)
