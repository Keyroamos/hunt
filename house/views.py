from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
import requests
from .models import Property, PropertyImage, Payment, VerificationDocument, Favorite, Inquiry, Message
from .serializers import (
    UserSerializer, PropertySerializer, PropertyCreateSerializer,
    PaymentSerializer, VerificationDocumentSerializer, FavoriteSerializer,
    InquirySerializer, MessageSerializer
)

# --- NETWORK FIX: Force IPv4 ---
# This fixes connection timeouts on servers that try IPv6 and fail (Common on cPanel)
import socket
import urllib3.util.connection as urllib3_cn

def allowed_gai_family():
    return socket.AF_INET

urllib3_cn.allowed_gai_family = allowed_gai_family
# -------------------------------

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get', 'patch', 'put'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        # Handle update
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def set_password(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({'error': 'Both old_password and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if old password is correct
        if not request.user.check_password(old_password):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        request.user.set_password(new_password)
        request.user.save()
        
        return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyCreateSerializer
        return PropertySerializer

    def get_object(self):
        """Allow retrieving by either ID or slug"""
        # Determine lookup value from URL kwargs
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)
        
        # Try retrieving by ID if it's an integer
        try:
            int(lookup_value)
            self.lookup_field = 'pk'
        except ValueError:
            self.lookup_field = 'slug'
            self.lookup_url_kwarg = 'pk'  # The valid URL kwarg is still 'pk' from router
            
        return super().get_object()



    def get_queryset(self):
        queryset = Property.objects.all()
        user = self.request.user

        mode = self.request.query_params.get('mode')

        if mode == 'mine' and user.is_authenticated:
            # "My Properties" mode: Show all user's properties (published or not)
            queryset = queryset.filter(owner=user)
        else:
            # Explore mode: Show all PUBLISHED properties
            queryset = queryset.filter(is_published=True)

        # Bounding box filtering for map interactions
        lat_min = self.request.query_params.get('lat_min')
        lat_max = self.request.query_params.get('lat_max')
        lng_min = self.request.query_params.get('lng_min')
        lng_max = self.request.query_params.get('lng_max')

        if all([lat_min, lat_max, lng_min, lng_max]):
            try:
                queryset = queryset.filter(
                    latitude__gte=float(lat_min),
                    latitude__lte=float(lat_max),
                    longitude__gte=float(lng_min),
                    longitude__lte=float(lng_max),
                )
            except ValueError:
                pass

        # Filter by property type
        property_type = self.request.query_params.get('property_type')
        if property_type:
            queryset = queryset.filter(property_type=property_type)

        # Filter by location text search
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        try:
            if min_price:
                queryset = queryset.filter(rent_per_month__gte=float(min_price))
            if max_price:
                queryset = queryset.filter(rent_per_month__lte=float(max_price))
        except (ValueError, TypeError):
            pass

        # Filter by number of bedrooms
        min_bedrooms = self.request.query_params.get('bedrooms')
        try:
            if min_bedrooms:
                queryset = queryset.filter(bedrooms__gte=int(min_bedrooms))
        except (ValueError, TypeError):
            pass

        # Filter by verified owners only
        verified_only = self.request.query_params.get('verified_only')
        if verified_only in ('true', '1', 'True'):
            queryset = queryset.filter(owner__is_verified=True)

        # Filter promoted only
        promoted_only = self.request.query_params.get('promoted_only')
        if promoted_only in ('true', '1', 'True'):
            queryset = queryset.filter(is_promoted=True)

        # Filter by availability status (skip for "my properties" mode)
        if mode != 'mine':
            status_filter = self.request.query_params.get('status', 'active')
            if status_filter:
                queryset = queryset.filter(status=status_filter)

        # Newly listed filter (last 14 days)
        newly_listed = self.request.query_params.get('newly_listed')
        if newly_listed in ('true', '1', 'True'):
            two_weeks_ago = timezone.now() - timezone.timedelta(days=14)
            queryset = queryset.filter(created_at__gte=two_weeks_ago)

        # Optimization: prefetch images and select related owner to avoid N+1
        queryset = queryset.select_related('owner').prefetch_related('images')

        # Order: promoted first, newest listings next
        queryset = queryset.order_by('-is_promoted', '-created_at')

        return queryset

    @action(detail=False, methods=['get'])
    def map(self, request):
        """
        Returns a simplified list of all relevant properties for map display.
        """
        queryset = self.get_queryset()
        # Cap results to avoid performance issues, but high enough for map
        queryset = queryset[:500] 
        
        results = []
        for p in queryset:
            if p.latitude and p.longitude:
                img = None
                # Check for primary image first, then any image
                # We can't easily prefetch with slice, but loop is okay for <500 items usually
                img_obj = p.images.filter(is_primary=True).first() or p.images.first()
                if img_obj:
                    img = img_obj.image.url
                
                results.append({
                    'id': p.id,
                    'slug': p.slug,
                    'title': p.title,
                    'latitude': p.latitude,
                    'longitude': p.longitude,
                    'price': p.rent_per_month,
                    'thumbnail': img,
                    'property_type': p.property_type,
                    'location': p.location
                })
        
        return Response(results)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get accurate statistics for a property"""
        property = self.get_object()
        if property.owner != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        # Count favorites
        favorites_count = Favorite.objects.filter(property=property).count()
        
        # Inquiries stats
        inquiries = Inquiry.objects.filter(property=property)
        total_inquiries = inquiries.count()
        
        now = timezone.now()
        last_7_days = now - timezone.timedelta(days=7)
        last_30_days = now - timezone.timedelta(days=30)
        
        inquiries_7d = inquiries.filter(created_at__gte=last_7_days).count()
        inquiries_30d = inquiries.filter(created_at__gte=last_30_days).count()
        
        return Response({
            'views': property.views,
            'favorites': favorites_count,
            'inquiries': {
                'total': total_inquiries,
                'last_7_days': inquiries_7d,
                'last_30_days': inquiries_30d
            }
        })

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user, status='active')

    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        property = self.get_object()
        property.views += 1
        property.save()
        return Response({'views': property.views})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_publish(self, request, pk=None):
        """Toggle the is_published status of a property (owner only)"""
        property = self.get_object()
        
        # Only the owner can toggle publication status
        if property.owner != request.user:
            return Response(
                {'error': 'Only the property owner can change publication status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        property.is_published = not property.is_published
        property.save()
        
        return Response({
            'is_published': property.is_published,
            'message': f'Property {"published" if property.is_published else "unpublished"} successfully'
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def promote_property(self, request, pk=None):
        from .promotion_views import promote_property_action
        return promote_property_action(self, request, pk)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def verify_promotion(self, request):
        from .promotion_views import verify_promotion_action
        return verify_promotion_action(self, request)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticated])
    def upload_images(self, request, pk=None):
        """Upload images for a property"""
        property = self.get_object()
        
        if property.owner != request.user:
            return Response(
                {'error': 'Only the owner can upload images'},
                status=status.HTTP_403_FORBIDDEN
            )

        images = request.FILES.getlist('images')
        
        if not images:
            return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            for image in images:
                PropertyImage.objects.create(
                    property=property,
                    image=image
                )
        except Exception as e:
            print(f"Error uploading image: {e}")
            return Response({'error': f"Failed to save image: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(self.get_serializer(property).data)


    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def delete_image(self, request, pk=None):
        property = self.get_object()
        image_id = request.data.get('image_id')
        if property.owner != request.user:
             return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            image = PropertyImage.objects.get(id=image_id, property=property)
            image.delete()
            return Response({'status': 'deleted'})
        except PropertyImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def set_primary_image(self, request, pk=None):
        property = self.get_object()
        image_id = request.data.get('image_id')
        if property.owner != request.user:
             return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            target_image = PropertyImage.objects.get(id=image_id, property=property)
            property.images.all().update(is_primary=False)
            target_image.is_primary = True
            target_image.save()
            return Response({'status': 'updated'})
        except PropertyImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)





class VerificationDocumentViewSet(viewsets.ModelViewSet):
    queryset = VerificationDocument.objects.all()
    serializer_class = VerificationDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return VerificationDocument.objects.all()
        return VerificationDocument.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Handle one-to-one by updating if exists
        instance = VerificationDocument.objects.filter(user=request.user).first()
        if instance:
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Inquiry.objects.all()
        
        if user.is_staff:
            queryset = Inquiry.objects.all()
        else:
            # Users see inquiries where they are the creator OR the property owner
            queryset = Inquiry.objects.filter(
                Q(user=user) | Q(property__owner=user)
            )

        # Filter by property if provided
        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
            
        return queryset.select_related('property', 'user', 'property__owner').prefetch_related('messages')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        inquiry = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check permissions: only the inquiry user or the property owner can reply
        if request.user != inquiry.user and request.user != inquiry.property.owner:
             return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        from .models import Message
        from .serializers import MessageSerializer

        message = Message.objects.create(
            inquiry=inquiry,
            sender=request.user,
            content=content
        )
        
        return Response(MessageSerializer(message).data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        inquiry = self.get_object()
        # Mark all messages sent by the other party as read
        # If I am the user, mark messages from owner (or others) as read.
        # Logic: Mark messages where sender != request.user as read.
        inquiry.messages.exclude(sender=request.user).update(is_read=True)
        return Response({'status': 'marked as read'})


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def initiate(self, request):
        user = request.user
        
        # Debug logging
        print(f"\n=== PAYMENT INITIATE DEBUG ===")
        print(f"User: {user.username if user.is_authenticated else 'Anonymous'}")
        print(f"Request data: {request.data}")
        
        amount = request.data.get('amount')
        email = request.data.get('email', user.email)
        payment_type = request.data.get('type', 'general')
        property_id = request.data.get('property_id')
        phone = request.data.get('phone')
        
        print(f"Parsed - Amount: {amount}, Email: {email}, Type: {payment_type}, Property: {property_id}, Phone: {phone}")

        if not amount:
             return Response({'error': 'Amount is required'}, status=400)
        
        if not phone:
            return Response({'error': 'Phone number is required for M-Pesa payment'}, status=400)
             
        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', 'sk_test_placeholder')
        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
        }
        
        metadata = {
            "user_id": user.id,
            "type": payment_type
        }
        if property_id:
            metadata['property_id'] = property_id

        # Format phone number for Kenyan M-Pesa (must be in format: 254XXXXXXXXX - exactly 12 digits)
        formatted_phone = phone.strip().replace(' ', '').replace('-', '').replace('+', '')
        
        print(f"Phone after initial formatting: {formatted_phone} (length: {len(formatted_phone)})")
        
        # Remove leading zeros and country code variations
        if formatted_phone.startswith('0'):
            formatted_phone = '254' + formatted_phone[1:]
        elif formatted_phone.startswith('254'):
            pass  # Already in correct format
        elif formatted_phone.startswith('7') or formatted_phone.startswith('1'):
            # Starts with 7 or 1 (common Kenyan mobile prefixes)
            formatted_phone = '254' + formatted_phone
        else:
            print(f"ERROR: Invalid phone format - doesn't start with 0, 254, 7, or 1")
            return Response({
                'error': 'Invalid phone number. Please use format: 0712345678 or 254712345678'
            }, status=400)
        
        print(f"Phone after country code formatting: {formatted_phone} (length: {len(formatted_phone)})")
        
        # Validate phone number length (must be exactly 12 digits: 254 + 9 digits)
        if len(formatted_phone) != 12 or not formatted_phone.isdigit():
            print(f"ERROR: Phone validation failed - length: {len(formatted_phone)}, isdigit: {formatted_phone.isdigit()}")
            return Response({
                'error': f'Invalid phone number format. Expected 12 digits, got {len(formatted_phone)}. Use format: 0712345678'
            }, status=400)

        # Use Paystack Charge API for M-Pesa
        data = {
            "email": email,
            "amount": str(int(float(amount) * 100)),  # Amount in cents as string
            "currency": "KES",
            "mobile_money": {
                "phone": formatted_phone,
                "provider": "mpesa"
            },
            "metadata": metadata
        }
        url = 'https://api.paystack.co/charge'
        
        try:
            print(f"Sending M-Pesa charge request to {url}")
            print(f"Phone: {formatted_phone} (length: {len(formatted_phone)}), Amount: {amount} KES")
            print(f"Request data: {data}")
            
            response = requests.post(url, json=data, headers=headers)
            res_data = response.json()
            
            print(f"Paystack response status: {response.status_code}")
            print(f"Paystack response data: {res_data}")
            
            if response.status_code == 200 and res_data.get('status'):
                # Return the charge data including reference
                return Response({
                    'reference': res_data['data'].get('reference'),
                    'status': res_data['data'].get('status'),
                    'message': res_data.get('message', 'Payment initiated successfully')
                })
            else:
                error_message = res_data.get('message', 'Payment initiation failed')
                print(f"Paystack error: {error_message}")
                return Response({
                    'error': error_message,
                    'details': res_data
                }, status=400)
                
        except Exception as e:
            print(f"Exception during payment initiation: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def verify_account(self, request):
        user = request.user
        # Default verification fee
        amount = 999 
        phone = request.data.get('phone')
        email = user.email
        
        # Initialize Paystack
        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', 'sk_test_placeholder')
        
        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
        }
        
        if phone:
            # Trigger M-Pesa Charge directly (Stk Push)
            data = {
                "email": email,
                "amount": amount * 100,
                "currency": "KES",
                "mobile_money": {
                    "phone": phone,
                    "provider": "mpesa"
                },
                "metadata": {"user_id": user.id, "type": "verification"}
            }
            url = 'https://api.paystack.co/charge'
        else:
            # Callback to frontend dashboard with param
            callback_url = "http://localhost:5173/owner/dashboard?verify=callback" 
            
            data = {
                "email": email,
                "amount": amount * 100, # Kobo/Cents
                "callback_url": callback_url,
                "metadata": {"user_id": user.id, "type": "verification"}
            }
            url = 'https://api.paystack.co/transaction/initialize'
        
        try:
            response = requests.post(url, json=data, headers=headers)
            res_data = response.json()
            if response.status_code == 200 and res_data.get('status'):
                return Response(res_data['data']) # returns authorization_url OR reference/status
            return Response({'error': 'Paystack initialization failed', 'details': res_data}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def contact_access_payment(self, request):
        """Pay KES 1 to access property owner's contact information"""
        user = request.user
        phone = request.data.get('phone')
        property_id = request.data.get('property_id')
        
        if not phone:
            return Response({'error': 'Phone number is required'}, status=400)
        
        if not property_id:
            return Response({'error': 'Property ID is required'}, status=400)
        
        # Contact access fee
        amount = 499  # KES 499
        email = user.email or f"user-{user.id}@househunt.ke"
        
        # Initialize Paystack
        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', 'sk_test_placeholder')
        
        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
        }
        
        # Matches verify_account logic: send phone as received (frontend should handle it)
        # matches verify_account logic: send amount as integer (cents)
        data = {
            "email": email,
            "amount": amount * 100, 
            "currency": "KES",
            "mobile_money": {
                "phone": phone,
                "provider": "mpesa"
            },
            "metadata": {
                "user_id": user.id, 
                "type": "contact_access",
                "property_id": property_id
            }
        }
        url = 'https://api.paystack.co/charge'
        
        print(f"Initiating Paystack Request to {url}")
        print(f"Request data: {data}")

        try:
            response = requests.post(url, json=data, headers=headers)
            print(f"Paystack responded with status: {response.status_code}")
            
            res_data = response.json()
            if response.status_code == 200 and res_data.get('status'):
                return Response(res_data['data'])
            
            # Log failure
            print(f"Paystack Error: {res_data}")
            return Response({'error': 'Paystack initialization failed', 'details': res_data}, status=400)
        except Exception as e:
            print(f"Exception during payment initiation: {str(e)}")
            return Response({'error': str(e)}, status=500)
        except Exception as e:
            print(f"Exception during payment initiation: {str(e)}")
            # Return detailed error
            return Response({'error': f"Connection Error: {str(e)}", 'debug_info': 'Check server logs'}, status=500)


    @action(detail=False, methods=['post'])
    def verify_callback(self, request):
        reference = request.data.get('reference')
        if not reference:
             return Response({'error': 'No reference provided'}, status=400)
             
        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', 'sk_test_placeholder')
        headers = {
            "Authorization": f"Bearer {secret_key}",
        }
        try:
            response = requests.get(f'https://api.paystack.co/transaction/verify/{reference}', headers=headers)
            res_data = response.json()
            
            if response.status_code == 200 and res_data.get('status'):
                data = res_data.get('data', {})
                if data.get('status') == 'success':
                     user = request.user
                     metadata = data.get('metadata', {})
                     payment_type = metadata.get('type')
                     property_id = metadata.get('property_id')

                     # Handle specific callbacks
                     # Handle specific callbacks
                     if payment_type == 'verification':
                         # We no longer auto-verify here. 
                         # Verification happens after admin approves the ID documents.
                         pass
                     
                     # Handle contact access payment
                     if payment_type == 'contact_access' and property_id:
                         # Grant user access to this property's contact info
                         # This will be checked in the PropertySerializer
                         pass  # Access is granted by checking Payment records
                     
                     if not Payment.objects.filter(payment_reference=reference).exists():
                         Payment.objects.create(
                             user=user,
                             amount=data.get('amount', 0) / 100,
                             payment_reference=reference,
                             status='completed',
                             payment_method='paystack',
                             payment_type=payment_type,
                             property_id=property_id if property_id else None
                         )
                     return Response({'status': 'verified', 'payment_type': payment_type})
            return Response({'error': 'Verification failed', 'details': res_data}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class MessageViewSet(viewsets.ModelViewSet):
    """Messages for property inquiries"""
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter messages based on user's inquiries"""
        user = self.request.user
        inquiry_id = self.request.query_params.get('inquiry')
        
        if inquiry_id:
            # Get messages for a specific inquiry
            # User must be either the inquiry creator or the property owner
            inquiry = Inquiry.objects.filter(
                Q(id=inquiry_id) & (Q(user=user) | Q(property__owner=user))
            ).first()
            
            if inquiry:
                return Message.objects.filter(inquiry=inquiry)
            return Message.objects.none()
        
        # Get all messages for user's inquiries (as tenant or owner)
        return Message.objects.filter(
            Q(inquiry__user=user) | Q(inquiry__property__owner=user)
        )

    def perform_create(self, serializer):
        """Create a new message"""
        inquiry_id = self.request.data.get('inquiry')
        
        try:
            inquiry = Inquiry.objects.get(id=inquiry_id)
            
            # Verify user is part of this conversation
            if inquiry.user != self.request.user and inquiry.property.owner != self.request.user:
                raise PermissionDenied("You don't have permission to send messages in this conversation")
            
            serializer.save(sender=self.request.user, inquiry=inquiry)
        except Inquiry.DoesNotExist:
            raise PermissionDenied("Inquiry not found")
