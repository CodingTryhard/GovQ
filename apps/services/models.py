from django.db import models
import datetime

class Service(models.Model):
    name = models.CharField(max_length=100)          # e.g. "Licence Renewal"
    code = models.SlugField(unique=True)             # e.g. "licence-renewal"
    description = models.TextField(blank=True)
    
    start_time = models.TimeField(default=datetime.time(9, 0))
    end_time = models.TimeField(default=datetime.time(17, 0))
    number_of_slots = models.PositiveIntegerField(default=20)
    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
