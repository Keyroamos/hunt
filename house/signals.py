from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        print(f"DEBUG: New user created: {instance.username}")
        if instance.email:
            try:
                print(f"DEBUG: Attempting to send welcome email to {instance.email}...")
                subject = 'Welcome to House Hunt Kenya!'
                from_email = settings.DEFAULT_FROM_EMAIL
                to = instance.email
                
                # Context for the template
                context = {
                    'user': instance,
                    'site_url': settings.FRONTEND_URL,
                }
                
                # Render HTML content
                html_content = render_to_string('emails/welcome_email.html', context)
                # Create text content for email clients that don't support HTML
                text_content = strip_tags(html_content)
                
                # Create the email
                msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
                msg.attach_alternative(html_content, "text/html")
                
                # Send the email
                msg.send()
                print(f"DEBUG: Welcome email successfully sent to {to}")
                
            except Exception as e:
                print(f"DEBUG ERROR: Failed to send welcome email to {instance.email}: {str(e)}")
        else:
            print(f"DEBUG: No email address found for user {instance.username}, skipping email.")
