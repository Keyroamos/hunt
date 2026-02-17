from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Property, PropertyImage, Payment, VerificationDocument, Favorite, Inquiry


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'user_type', 'is_verified', 'date_joined']
    list_filter = ['user_type', 'is_verified', 'is_staff', 'is_superuser']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'phone', 'is_verified', 'verification_date')}),
    )


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'property_type', 'location', 'rent_per_month', 'status', 'is_promoted', 'created_at']
    list_filter = ['property_type', 'status', 'is_promoted', 'created_at']
    search_fields = ['title', 'location', 'owner__username']
    readonly_fields = ['views', 'created_at', 'updated_at']


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ['property', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'payment_type', 'amount', 'status', 'property', 'created_at']
    list_filter = ['payment_type', 'status', 'payment_method', 'created_at']
    search_fields = ['user__username', 'payment_reference']
    readonly_fields = ['created_at', 'completed_at']


@admin.register(VerificationDocument)
class VerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'uploaded_at', 'reviewed_at']
    list_filter = ['status', 'uploaded_at']
    search_fields = ['user__username']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'property', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'property__title']


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ['property', 'user', 'contact_phone', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'property__title', 'contact_phone']
