from rest_framework import serializers
from .models import Service

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'code', 'description', 'start_time', 'end_time', 'number_of_slots', 'is_active']
