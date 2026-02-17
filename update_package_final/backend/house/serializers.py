from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Property, PropertyImage, Payment, VerificationDocument, Favorite, Inquiry
import re

User = get_user_model()

def extract_coords_from_embed(embed_code):
    if not embed_code:
        return None, None
    # Extract lat/lng from standard Google Maps embed code (pb string)
    # !3d is Latitude, !2d is Longitude in Maps embed URLs
    lat_match = re.search(r'!3d([-0-9.]+)', embed_code)
    lng_match = re.search(r'!2d([-0-9.]+)', embed_code)
    
    if lat_match and lng_match:
        return lat_match.group(1), lng_match.group(1)
    return None, None


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    full_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'user_type', 'is_verified', 'date_joined', 'password', 'full_name']
        read_only_fields = ['id', 'date_joined', 'is_verified']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': True},
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['full_name'] = f"{instance.first_name} {instance.last_name}".strip()
        return ret

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        full_name = validated_data.pop('full_name', '')

        # Default username to email if not provided
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email')

        user = User(**validated_data)

        if full_name:
            parts = full_name.strip().split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        full_name = validated_data.pop('full_name', None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if full_name is not None:
            parts = full_name.strip().split(' ', 1)
            instance.first_name = parts[0]
            instance.last_name = parts[1] if len(parts) > 1 else ''

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_primary']


class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    owner_verified = serializers.BooleanField(source='owner.is_verified', read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(source='owner', read_only=True)
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'slug', 'description', 'property_type', 'bedrooms', 'bathrooms',
            'rent_per_month', 'deposit', 'location', 'contact_phone', 'latitude', 'longitude', 'amenities', 'map_embed',
            'status', 'is_published', 'is_promoted', 'views', 'images', 'owner_name', 'owner_verified', 'owner_id', 'has_access',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'views', 'created_at', 'updated_at']

    def validate(self, attrs):
        # Auto-extract coordinates if embed is provided but lat/lng are missing
        map_embed = attrs.get('map_embed')
        has_coords = attrs.get('latitude') and attrs.get('longitude')
        
        if map_embed and not has_coords:
             lat, lng = extract_coords_from_embed(map_embed)
             if lat and lng:
                 attrs['latitude'] = lat
                 attrs['longitude'] = lng
        
        return attrs


    contact_phone = serializers.SerializerMethodField()
    has_access = serializers.SerializerMethodField()

    def get_contact_phone(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated:
            return None
        if user == obj.owner:
            return obj.contact_phone
        # Check if paid (Global Access)
        if Payment.objects.filter(user=user, payment_type='contact_access', status='completed').exists():
            return obj.contact_phone
        return None 

    def get_has_access(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated:
            return False
        if user == obj.owner:
            return True
        # Global Access Check
        return Payment.objects.filter(user=user, payment_type='contact_access', status='completed').exists()


class PropertyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'property_type', 'bedrooms', 'bathrooms',
            'rent_per_month', 'deposit', 'location', 'contact_phone', 'latitude', 'longitude', 'amenities', 'map_embed'
        ]

    def validate(self, attrs):
        map_embed = attrs.get('map_embed')
        has_coords = attrs.get('latitude') and attrs.get('longitude')
        
        if map_embed and not has_coords:
             lat, lng = extract_coords_from_embed(map_embed)
             if lat and lng:
                 attrs['latitude'] = lat
                 attrs['longitude'] = lng
        
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    property_title = serializers.CharField(source='property.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_name', 'payment_type', 'amount', 'status',
            'property', 'property_title', 'payment_reference', 'payment_method',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class VerificationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationDocument
        fields = ['id', 'id_document', 'status', 'rejection_reason', 'uploaded_at', 'reviewed_at']
        read_only_fields = ['id', 'status', 'rejection_reason', 'uploaded_at', 'reviewed_at']


class FavoriteSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'property', 'created_at']
        read_only_fields = ['id', 'created_at']


from .models import Property, PropertyImage, Payment, VerificationDocument, Favorite, Inquiry, Message

# ... existing code ...

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_id = serializers.PrimaryKeyRelatedField(read_only=True, source='sender')

    class Meta:
        model = Message
        fields = ['id', 'inquiry', 'sender', 'sender_id', 'sender_name', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at', 'sender', 'inquiry']


class InquirySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_details = PropertySerializer(source='property', read_only=True)
    property_id = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(), source='property', write_only=True
    )
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Inquiry
        fields = [
            'id', 'property', 'property_id', 'property_title', 'property_details',
            'user', 'user_name', 'message', 'contact_phone', 'created_at', 'messages'
        ]
        read_only_fields = ['id', 'created_at', 'property', 'user']

