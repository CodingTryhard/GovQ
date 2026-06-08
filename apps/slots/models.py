from django.db import models
from apps.services.models import Service

class Slot(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    hour = models.PositiveSmallIntegerField()         # 0–23
    total_capacity = models.PositiveIntegerField(default=10)
    walkin_buffer = models.PositiveIntegerField(default=3)  # reserved for walk-ins
    is_blocked = models.BooleanField(default=False)  # admin can block (holiday, etc.)

    class Meta:
        unique_together = ('service', 'date', 'hour')

    @property
    def prebooking_capacity(self):
        return self.total_capacity - self.walkin_buffer

    @property
    def booked_count(self):
        return self.tokens.filter(is_walkin=False).exclude(status='cancelled').count()

    @property
    def is_full(self):
        return self.booked_count >= self.prebooking_capacity
