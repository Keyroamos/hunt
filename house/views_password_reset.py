from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Request a password reset email.
    Expects: { "email": "user@example.com" }
    """
    email = request.data.get('email', '').strip()
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'No account found with this email address.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generate password reset token
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Build reset link
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
    
    # Prepare email context
    context = {
        'user': user,
        'reset_link': reset_link,
        'site_name': 'House Hunt',
        'support_email': getattr(settings, 'SUPPORT_EMAIL', 'info@househunt.co.ke'),
    }
    
    # Render HTML email
    html_message = render_to_string('emails/password_reset.html', context)
    plain_message = strip_tags(html_message)
    
    try:
        # Send email
        send_mail(
            subject='Password Reset Request - House Hunt',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Password reset email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
        return Response(
            {'error': 'Failed to send email. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response(
        {'message': 'If an account with that email exists, a password reset link has been sent.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    """
    Confirm password reset with token.
    Expects: { "uid": "...", "token": "...", "new_password": "..." }
    """
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not all([uid, token, new_password]):
        return Response(
            {'error': 'UID, token, and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password strength
    if len(new_password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Decode user ID
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {'error': 'Invalid reset link'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if token is valid
    if not default_token_generator.check_token(user, token):
        return Response(
            {'error': 'Invalid or expired reset link'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    logger.info(f"Password reset successful for user {user.email}")
    
    # Send confirmation email
    try:
        support_email = getattr(settings, 'SUPPORT_EMAIL', 'info@househunt.co.ke')
        send_mail(
            subject='Password Reset Successful - House Hunt',
            message=f'Hello {user.first_name or user.email},\n\nYour password has been successfully reset.\n\nIf you did not make this change, please contact us immediately at {support_email}.\n\nBest regards,\nHouse Hunt Team',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
    
    return Response(
        {'message': 'Password has been reset successfully. You can now login with your new password.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def validate_reset_token(request, uid, token):
    """
    Validate if a password reset token is valid.
    Used to check token validity before showing the reset form.
    """
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {'valid': False, 'error': 'Invalid reset link'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if default_token_generator.check_token(user, token):
        return Response(
            {'valid': True, 'email': user.email},
            status=status.HTTP_200_OK
        )
    else:
        return Response(
            {'valid': False, 'error': 'Invalid or expired reset link'},
            status=status.HTTP_400_BAD_REQUEST
        )
