from django.db import models
from apps.services.models import Service

class Slot(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        LOCKED    = 'locked',    'Locked'
        BOOKED    = 'booked',    'Booked'

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('service', 'date', 'start_time')
        ordering = ['date', 'start_time']

    @property
    def is_full(self):
        return self.status == self.Status.BOOKED

    def __str__(self):
        return f"{self.service.name} - {self.date} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"
