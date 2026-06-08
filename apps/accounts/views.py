from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from apps.tokens.models import Token
from datetime import timedelta
import datetime

@api_view(['GET'])
@permission_classes([AllowAny])
def get_analytics(request):
    today = timezone.now().date()
    
    # Get all tokens for today
    today_tokens = Token.objects.filter(booked_at__date=today)
    
    total_booked = today_tokens.count()
    total_served = today_tokens.filter(status='served').count()
    total_no_shows = today_tokens.filter(status='no_show').count()
    
    # Calculate avg wait time for served tokens today
    served_tokens = today_tokens.filter(status='served', called_at__isnull=False)
    total_wait_time = timedelta(0)
    for token in served_tokens:
        total_wait_time += (token.called_at - token.booked_at)
        
    avg_wait_minutes = 0
    if served_tokens.count() > 0:
        avg_wait_minutes = int((total_wait_time / served_tokens.count()).total_seconds() / 60)
        
    return Response({
        'total_booked': total_booked,
        'total_served': total_served,
        'total_no_shows': total_no_shows,
        'avg_wait_minutes': avg_wait_minutes
    })
