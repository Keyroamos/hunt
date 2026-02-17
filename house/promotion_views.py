from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from django.utils import timezone
import requests
from .models import Property, Payment


def promote_property_action(self, request, pk=None):
    """Initiate payment to promote a property"""
    property = self.get_object()
    
    if property.owner != request.user:
        return Response({'error': 'Only the property owner can promote this property'}, status=status.HTTP_403_FORBIDDEN)
    
    phone = request.data.get('phone')
    duration_days = request.data.get('duration_days', 30)
    
    # Pricing
    pricing = {1: 99, 7: 499, 30: 1499}
    amount = pricing.get(duration_days, 1499)
    
    email = request.user.email or f"user{request.user.id}@example.com"
    secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', 'sk_test_placeholder')
    
    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json",
    }
    
    if phone:
        data = {
            "email": email,
            "amount": amount * 100,
            "currency": "KES",
            "mobile_money": {
                "phone": phone,
                "provider": "mpesa"
            },
            "metadata": {
                "user_id": request.user.id,
                "property_id": property.id,
                "type": "promotion",
                "duration_days": duration_days
            }
        }
        url = 'https://api.paystack.co/charge'
    else:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        callback_url = f"{frontend_url}/owner/dashboard?promote=callback&property_id={property.id}"
        data = {
            "email": email,
            "amount": amount * 100,
            "callback_url": callback_url,
            "metadata": {
                "user_id": request.user.id,
                "property_id": property.id,
                "type": "promotion",
                "duration_days": duration_days
            }
        }
        url = 'https://api.paystack.co/transaction/initialize'
    
    try:
        response = requests.post(url, json=data, headers=headers)
        res_data = response.json()
        if response.status_code == 200 and res_data.get('status'):
            return Response(res_data['data'])
        return Response({'error': 'Payment initialization failed', 'details': res_data}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


def verify_promotion_action(self, request):
    """Verify promotion payment and activate premium listing"""
    reference = request.data.get('reference')
    if not reference:
        return Response({'error': 'No reference provided'}, status=400)
    
    secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', 'sk_test_placeholder')
    headers = {"Authorization": f"Bearer {secret_key}"}
    
    try:
        response = requests.get(f'https://api.paystack.co/transaction/verify/{reference}', headers=headers)
        res_data = response.json()
        
        if response.status_code == 200 and res_data.get('status'):
            data = res_data.get('data', {})
            if data.get('status') == 'success':
                metadata = data.get('metadata', {})
                property_id = metadata.get('property_id')
                duration_days = metadata.get('duration_days', 30)
                
                if property_id:
                    try:
                        property = Property.objects.get(id=property_id, owner=request.user)
                        property.is_promoted = True
                        property.promoted_until = timezone.now() + timezone.timedelta(days=duration_days)
                        property.save()
                        
                        if not Payment.objects.filter(payment_reference=reference).exists():
                            Payment.objects.create(
                                user=request.user,
                                property=property,
                                amount=data.get('amount', 0) / 100,
                                payment_reference=reference,
                                status='completed',
                                payment_method='paystack',
                                payment_type='promotion'
                            )
                        
                        return Response({
                            'status': 'promoted',
                            'promoted_until': property.promoted_until
                        })
                    except Property.DoesNotExist:
                        return Response({'error': 'Property not found'}, status=404)
        
        return Response({'error': 'Payment verification failed', 'details': res_data}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
