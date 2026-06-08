from django.db import models

class Service(models.Model):
    name = models.CharField(max_length=100)          # e.g. "Licence Renewal"
    code = models.SlugField(unique=True)             # e.g. "licence-renewal"
    description = models.TextField(blank=True)
    avg_duration_minutes = models.PositiveIntegerField(default=15)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
