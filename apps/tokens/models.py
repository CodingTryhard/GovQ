import uuid
from django.db import models
from apps.slots.models import Slot

class Token(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending Payment'
        BOOKED    = 'booked',    'Booked'
        CALLED    = 'called',    'Called'
        SERVED    = 'served',    'Served'
        NO_SHOW   = 'no_show',   'No Show'
        SKIPPED   = 'skipped',   'Skipped'
        CANCELLED = 'cancelled', 'Cancelled'

    slot            = models.ForeignKey(Slot, on_delete=models.CASCADE, related_name='tokens')
    unique_hash     = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    token_number    = models.PositiveIntegerField()
    citizen_name    = models.CharField(max_length=150)
    citizen_email   = models.EmailField()
    citizen_phone   = models.CharField(max_length=15, blank=True)
    is_walkin       = models.BooleanField(default=False)
    status          = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    counter_number  = models.PositiveSmallIntegerField(null=True, blank=True)
    
    booked_at       = models.DateTimeField(auto_now_add=True)
    expires_at      = models.DateTimeField(null=True, blank=True)
    called_at       = models.DateTimeField(null=True, blank=True)
    served_at       = models.DateTimeField(null=True, blank=True)
    
    # Payment Tracking
    payment_status  = models.CharField(max_length=20, default='pending') # pending, paid
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)

    # for no-show re-call tracking
    call_attempts   = models.PositiveSmallIntegerField(default=0)

    # email notification tracking
    reminder_sent   = models.BooleanField(default=False)
    completion_sent = models.BooleanField(default=False)

    class Meta:
        unique_together = ('slot', 'token_number')
        ordering = ['token_number']

    def __str__(self):
        return f"Token {self.token_number} — {self.slot}"
