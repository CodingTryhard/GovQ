import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'govt_token.settings')
django.setup()

from apps.services.models import Service
from apps.slots.models import Slot

# Create Services
s1, _ = Service.objects.get_or_create(id=1, defaults={'name': 'Driving Licence Renewal', 'code': 'dl-renewal', 'avg_duration_minutes': 15})
s2, _ = Service.objects.get_or_create(id=2, defaults={'name': 'Passport Verification', 'code': 'passport', 'avg_duration_minutes': 20})
s3, _ = Service.objects.get_or_create(id=3, defaults={'name': 'Property Registration', 'code': 'property', 'avg_duration_minutes': 45})

# Create Slots for today
today = date.today()
Slot.objects.get_or_create(id=1, defaults={'service': s1, 'date': today, 'hour': 9, 'total_capacity': 10, 'walkin_buffer': 2})
Slot.objects.get_or_create(id=2, defaults={'service': s1, 'date': today, 'hour': 10, 'total_capacity': 10, 'walkin_buffer': 2})
Slot.objects.get_or_create(id=3, defaults={'service': s1, 'date': today, 'hour': 11, 'total_capacity': 10, 'walkin_buffer': 2})
Slot.objects.get_or_create(id=4, defaults={'service': s1, 'date': today, 'hour': 14, 'total_capacity': 10, 'walkin_buffer': 2})

print("Database seeded with mock services and slots!")
