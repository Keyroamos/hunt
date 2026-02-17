import os
import sys
import django
from django.core.mail import send_mail, get_connection
from django.conf import settings

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'househunt.settings')
django.setup()

# Target email
RECIPIENT_EMAIL = "amosorupia24@gmail.com"

print("--- Testing SMTP to Gmail ---")
print(f"To: {RECIPIENT_EMAIL}")
print("Backend: Enforcing SMTP (ignoring settings.py default)")

# Force SMTP connection
connection = get_connection(
    backend='django.core.mail.backends.smtp.EmailBackend',
    fail_silently=False,
)

try:
    send_mail(
        subject='House Hunt SMTP Test',
        message='This is a test email from your local House Hunt development environment. If you see this, SMTP is working!',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[RECIPIENT_EMAIL],
        connection=connection, # Use the forced SMTP connection
    )
    print("✅ Email sent successfully to Gmail!")
except Exception as e:
    print("❌ Failed to send email.")
    print(f"Error: {e}")
