import os
from celery import shared_task
from django.template.loader import render_to_string
from django.utils import timezone
from django.core.mail import EmailMessage
from django.conf import settings

import qrcode
import io

@shared_task
def release_locked_slot(slot_id):
    from apps.slots.models import Slot
    from apps.tokens.models import Token
    slot = Slot.objects.get(id=slot_id)
    if slot.status == Slot.Status.LOCKED:
        # Check if there is a pending token for this slot that hasn't been paid
        pending_token = Token.objects.filter(slot=slot, status=Token.Status.PENDING).first()
        if pending_token:
            pending_token.delete()
        slot.status = Slot.Status.AVAILABLE
        slot.locked_at = None
        slot.save()

@shared_task
def send_booking_confirmation(token_id):
    """Fires immediately when a citizen completes payment for a slot."""
    from apps.tokens.models import Token
    token = Token.objects.select_related('slot__service').get(id=token_id)

    subject = f"Your token #{token.token_number} is confirmed — {token.slot.service.name}"
    body = render_to_string('emails/booking_confirmation.txt', {
        'name': token.citizen_name,
        'service': token.slot.service.name,
        'date': token.slot.date.strftime('%d %b %Y'),
        'start_time': token.slot.start_time.strftime('%I:%M %p'),
        'end_time': token.slot.end_time.strftime('%I:%M %p'),
        'token_number': token.token_number,
    })
    
    from django.core.mail import EmailMultiAlternatives
    from email.mime.image import MIMEImage

    html_body = render_to_string('emails/booking_confirmation.html', {
        'name': token.citizen_name,
        'service': token.slot.service.name,
        'date': token.slot.date.strftime('%d %b %Y'),
        'start_time': token.slot.start_time.strftime('%I:%M %p'),
        'end_time': token.slot.end_time.strftime('%I:%M %p'),
        'token_number': token.token_number,
    })
    
    # Generate QR Code pointing to the public digital ticket page
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5174')
    qr_text = f"{frontend_url}/ticket/{token.unique_hash}"
    
    qr = qrcode.QRCode(version=1, box_size=5, border=4)
    qr.add_data(qr_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_bytes = buffer.getvalue()
    
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[token.citizen_email]
        )
        msg.attach_alternative(html_body, "text/html")
        
        # Attach QR code as inline image for the HTML ticket
        img_attachment = MIMEImage(qr_bytes)
        img_attachment.add_header('Content-ID', '<qrcode_image>')
        img_attachment.add_header('Content-Disposition', 'inline', filename='qrcode.png')
        msg.attach(img_attachment)
        
        msg.send(fail_silently=False)
    except Exception as e:
        print(f"Failed to send email via SMTP: {str(e)}")


@shared_task
def send_reminder_email(token_id):
    """
    Fires when the token 3 positions ahead of this one gets called.
    Triggered from the counter dashboard's call_next action.
    """
    from apps.tokens.models import Token
    token = Token.objects.select_related('slot__service').get(id=token_id)

    if token.reminder_sent or token.status in ('served', 'no_show', 'skipped', 'cancelled'):
        return  # guard against double send

    subject = f"You're next! Token #{token.token_number} — please proceed to the counter"
    body = render_to_string('emails/reminder.txt', {
        'name': token.citizen_name,
        'token_number': token.token_number,
        'counter': token.counter_number,
        'service': token.slot.service.name,
    })
    
    try:
        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[token.citizen_email]
        )
        msg.send(fail_silently=False)
    except Exception as e:
        print(f"Failed to send email via SMTP: {str(e)}")

    token.reminder_sent = True
    token.save(update_fields=['reminder_sent'])


@shared_task
def send_completion_email(token_id):
    """Fires when counter staff marks a token as Served."""
    from apps.tokens.models import Token
    token = Token.objects.select_related('slot__service').get(id=token_id)

    subject = f"Service complete — Token #{token.token_number}"
    body = render_to_string('emails/completion.txt', {
        'name': token.citizen_name,
        'service': token.slot.service.name,
        'served_at': token.served_at.strftime('%I:%M %p'),
    })
    
    try:
        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[token.citizen_email]
        )
        msg.send(fail_silently=False)
    except Exception as e:
        print(f"Failed to send email via SMTP: {str(e)}")

    token.completion_sent = True
    token.save(update_fields=['completion_sent'])


@shared_task
def handle_no_show_timeout(token_id):
    """
    Scheduled with a 5-minute countdown the moment a token is called.
    If the token is still in 'called' state after 5 minutes, mark it no_show.
    Re-schedules itself up to 2 times (max 2 re-calls).
    """
    from apps.tokens.models import Token
    token = Token.objects.get(id=token_id)

    if token.status != 'called':
        return  # already served or admin-handled

    token.call_attempts += 1

    if token.call_attempts < 3:
        # Re-call: keep status as 'called', notify via WebSocket
        token.save(update_fields=['call_attempts'])
        from apps.tokens.consumers import broadcast_token_update
        broadcast_token_update(token)
        # schedule another timeout check in 5 minutes
        if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            print("Skipping timeout countdown due to EAGER mode.")
        else:
            handle_no_show_timeout.apply_async((token_id,), countdown=300)
    else:
        token.status = 'no_show'
        token.save(update_fields=['status', 'call_attempts'])
