import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'govt_token.settings')

app = Celery('govt_token')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
