from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse
from .views import (
    UserViewSet, PropertyViewSet, PaymentViewSet,
    VerificationDocumentViewSet, FavoriteViewSet, InquiryViewSet, MessageViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'verification', VerificationDocumentViewSet, basename='verification')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'inquiries', InquiryViewSet, basename='inquiry')
router.register(r'messages', MessageViewSet, basename='message')

def api_root(request):
    """API root endpoint"""
    return JsonResponse({
        'message': 'House Hunt Kenya API',
        'version': '1.0.0',
        'endpoints': {
            'users': '/api/users/',
            'properties': '/api/properties/',
            'payments': '/api/payments/',
            'verification': '/api/verification/',
            'favorites': '/api/favorites/',
            'inquiries': '/api/inquiries/',
            'token': '/api/token/',
            'token_refresh': '/api/token/refresh/',
        }
    })

urlpatterns = [
    path('details/', api_root, name='api-root'),
    path('api/', include(router.urls)),
]
