from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.utils import timezone

# Create your models here.

class User(AbstractUser):
    """Custom User model with user type"""
    USER_TYPE_CHOICES = [
        ('hunter', 'House Hunter'),
        ('landlord', 'Landlord'),
    ]
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='hunter')
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


class Property(models.Model):
    """Property/Listing model"""
    PROPERTY_TYPE_CHOICES = [
        ('bedsitter', 'Bedsitter'),
        ('1br', '1 Bedroom'),
        ('2br', '2 Bedroom'),
        ('3br', '3 Bedroom'),
        ('studio', 'Studio'),
        ('apartment', 'Apartment'),
        ('maisonette', 'Maisonette'),
        ('bungalow', 'Bungalow'),
        ('villa', 'Villa'),
        ('cottage', 'Cottage'),
        ('semi_detached', 'Semi-Detached'),
        ('duplex', 'Duplex'),
        ('townhouse', 'Townhouse'),
        ('terraced', 'Terraced'),
        ('penthouse', 'Penthouse'),
        ('boma', 'Boma'),
        ('hut', 'Hut'),
        ('manyatta', 'Manyatta'),
        ('tent', 'Tent'),
        ('mobile_home', 'Mobile Home'),
        ('container', 'Container'),
        ('smart_house', 'Smart House'),
        ('eco_house', 'Eco House'),
        ('floating', 'Floating House'),
        ('tree_house', 'Tree House'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('rented', 'Rented'),
        ('inactive', 'Inactive'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True, null=True, help_text='Auto-generated from title for SEO-friendly URLs')
    description = models.TextField()
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    bedrooms = models.IntegerField(validators=[MinValueValidator(0)])
    bathrooms = models.IntegerField(validators=[MinValueValidator(0)])
    rent_per_month = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    deposit = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    location = models.CharField(max_length=200)
    contact_phone = models.CharField(max_length=20, blank=True, help_text="Contact number for potential tenants")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    amenities = models.JSONField(default=list, blank=True)
    map_embed = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_published = models.BooleanField(default=True, help_text='Whether this property is visible to tenants in search results')
    is_promoted = models.BooleanField(default=False)
    promoted_until = models.DateTimeField(null=True, blank=True)
    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Properties'

    def __str__(self):
        return f"{self.title} - {self.location}"


class PropertyImage(models.Model):
    """Property images"""
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='property_images/')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.property.title}"


class Payment(models.Model):
    """Payment model for verification, property uploads, and promotions"""
    PAYMENT_TYPE_CHOICES = [
        ('verification', 'Verification Fee'),
        ('property_upload', 'Property Upload'),
        ('promotion', 'Promoted Listing'),
        ('contact_access', 'Contact Access Fee'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    payment_reference = models.CharField(max_length=100, unique=True, null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)  # mpesa, paystack, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_payment_type_display()} - KES {self.amount}"


class VerificationDocument(models.Model):
    """ID documents for verification"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_document')
    id_document = models.ImageField(upload_to='verification_docs/')
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )
    rejection_reason = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Verification for {self.user.username}"


class Favorite(models.Model):
    """Saved properties for house hunters"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'property']

    def __str__(self):
        return f"{self.user.username} favorited {self.property.title}"


class Inquiry(models.Model):
    """Property inquiries from house hunters"""
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='inquiries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inquiries')
    message = models.TextField()
    contact_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inquiry from {self.user.username} for {self.property.title}"


class Message(models.Model):
    """Messages related to an inquiry"""
    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at}"
