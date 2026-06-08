from rest_framework import serializers
from .models import Token
from apps.slots.serializers import SlotSerializer

class TokenSerializer(serializers.ModelSerializer):
    slot = SlotSerializer(read_only=True)

    class Meta:
        model = Token
        fields = ['id', 'slot', 'unique_hash', 'token_number', 'citizen_name', 'status', 'counter_number', 'payment_status', 'razorpay_order_id', 'expires_at']
