from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum, Count
from django.utils import timezone
from .models import User, Property, Payment, VerificationDocument, Inquiry
from .serializers import UserSerializer, PropertySerializer, PaymentSerializer, VerificationDocumentSerializer

class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_users = User.objects.count()
        landlords = User.objects.filter(user_type='landlord').count()
        hunters = User.objects.filter(user_type='hunter').count()
        total_properties = Property.objects.count()
        published_properties = Property.objects.filter(is_published=True).count()
        
        # Revenue from successful payments
        now = timezone.now()
        total_revenue = Payment.objects.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
        revenue_this_month = Payment.objects.filter(
            status='completed', 
            created_at__year=now.year,
            created_at__month=now.month
        ).aggregate(total=Sum('amount'))['total'] or 0

        pending_verifications = VerificationDocument.objects.filter(status='pending').count()

        return Response({
            'users': {
                'total': total_users,
                'landlords': landlords,
                'hunters': hunters,
            },
            'properties': {
                'total': total_properties,
                'published': published_properties,
            },
            'revenue': {
                'total': float(total_revenue),
                'month': float(revenue_this_month),
            },
            'verifications': {
                'pending': pending_verifications,
            }
        })

    @action(detail=False, methods=['get'])
    def recent_activities(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        recent_users = User.objects.order_by('-date_joined')[:5]
        recent_properties = Property.objects.order_by('-created_at')[:5]
        recent_payments = Payment.objects.order_by('-created_at')[:5]

        return Response({
            'users': [{
                'id': u.id,
                'username': u.username,
                'full_name': u.get_full_name(),
                'type': u.user_type,
                'created_at': u.date_joined
            } for u in recent_users],
            'properties': [{
                'id': p.id,
                'title': p.title,
                'owner': p.owner.username,
                'owner_name': p.owner.get_full_name(),
                'created_at': p.created_at
            } for p in recent_properties],
            'payments': [{
                'id': pay.id,
                'user': pay.user.username,
                'user_name': pay.user.get_full_name(),
                'amount': float(pay.amount),
                'type': pay.payment_type,
                'status': pay.status,
                'created_at': pay.created_at
            } for pay in recent_payments]
        })

    @action(detail=False, methods=['get'])
    def all_users(self, request):
        users = User.objects.all().order_by('-date_joined')
        return Response(UserSerializer(users, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def toggle_user_status(self, request, pk=None):
        user = User.objects.get(pk=pk)
        user.is_active = not user.is_active
        user.save()
        return Response({'status': 'updated', 'is_active': user.is_active})

    @action(detail=True, methods=['post'])
    def verify_user(self, request, pk=None):
        user = User.objects.get(pk=pk)
        user.is_verified = True
        user.verification_date = timezone.now()
        user.save()
        return Response({'status': 'verified'})

    @action(detail=True, methods=['post'])
    def review_verification(self, request, pk=None):
        # pk here is VerificationDocument ID
        doc = VerificationDocument.objects.get(pk=pk)
        status = request.data.get('status') # approved or rejected
        reason = request.data.get('reason', '')

        if status not in ['approved', 'rejected']:
            return Response({'error': 'Invalid status'}, status=400)

        doc.status = status
        doc.rejection_reason = reason
        doc.reviewed_at = timezone.now()
        doc.save()

        if status == 'approved':
            doc.user.is_verified = True
            doc.user.verification_date = timezone.now()
            doc.user.save()
            
        return Response({'status': 'updated'})

    @action(detail=False, methods=['post'])
    def create_user(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Update protected fields since they are read-only in the serializer
            is_verified = request.data.get('is_verified', False)
            is_staff = request.data.get('is_staff', False)
            
            if is_verified:
                user.is_verified = True
                user.verification_date = timezone.now()
            
            if is_staff:
                user.is_staff = True
            
            user.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def all_properties(self, request):
        properties = Property.objects.all().order_by('-created_at')
        return Response(PropertySerializer(properties, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def toggle_property_status(self, request, pk=None):
        prop = Property.objects.get(pk=pk)
        prop.is_published = not prop.is_published
        prop.save()
        return Response({'status': 'updated', 'is_published': prop.is_published})

    @action(detail=True, methods=['delete'])
    def delete_property(self, request, pk=None):
        prop = Property.objects.get(pk=pk)
        prop.delete()
        return Response({'status': 'deleted'})

    @action(detail=True, methods=['get'])
    def property_admin_details(self, request, pk=None):
        prop = Property.objects.get(pk=pk)
        data = PropertySerializer(prop, context={'request': request}).data
        
        # Add extra info for admin
        data['total_inquiries'] = prop.inquiries.count()
        data['recent_inquiries'] = [{
            'id': i.id,
            'user': i.user.username,
            'message': i.message,
            'created_at': i.created_at
        } for i in prop.inquiries.all().order_by('-created_at')[:5]]
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def revenue_report(self, request):
        from django.db.models.functions import TruncDate, TruncMonth
        from datetime import timedelta
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Total Stats
        all_payments = Payment.objects.filter(status='completed')
        total_revenue = all_payments.aggregate(total=Sum('amount'))['total'] or 0
        
        # Monthly Growth
        current_month_revenue = all_payments.filter(created_at__month=now.month, created_at__year=now.year).aggregate(total=Sum('amount'))['total'] or 0
        last_month_date = now.replace(day=1) - timedelta(days=1)
        last_month_revenue = all_payments.filter(created_at__month=last_month_date.month, created_at__year=last_month_date.year).aggregate(total=Sum('amount'))['total'] or 0
        
        growth_rate = 0
        if last_month_revenue > 0:
            growth_rate = ((current_month_revenue - last_month_revenue) / last_month_revenue) * 100

        # Revenue by Type
        distribution = all_payments.values('payment_type').annotate(total=Sum('amount')).order_by('-total')
        
        # Daily Trends (Last 30 Days)
        trends = all_payments.filter(created_at__gte=thirty_days_ago) \
            .annotate(date=TruncDate('created_at')) \
            .values('date') \
            .annotate(total=Sum('amount')) \
            .order_by('date')

        # Recent Significant Transactions
        recent_ledger = all_payments.order_by('-created_at')[:10]

        return Response({
            'overview': {
                'total_gross': float(total_revenue),
                'monthly_gross': float(current_month_revenue),
                'growth_rate': round(growth_rate, 2),
                'transaction_count': all_payments.count(),
                'avg_value': float(total_revenue / all_payments.count()) if all_payments.count() > 0 else 0
            },
            'distribution': [{
                'type': d['payment_type'],
                'total': float(d['total']),
                'count': all_payments.filter(payment_type=d['payment_type']).count()
            } for d in distribution],
            'trends': [{
                'date': t['date'].strftime('%Y-%m-%d'),
                'amount': float(t['total'])
            } for t in trends],
            'recent': [{
                'id': p.id,
                'ref': p.payment_reference,
                'user': p.user.get_full_name() or p.user.username,
                'email': p.user.email,
                'amount': float(p.amount),
                'type': p.payment_type,
                'created_at': p.created_at
            } for p in recent_ledger]
        })

    @action(detail=True, methods=['get'])
    def user_details(self, request, pk=None):
        user = User.objects.get(pk=pk)
        data = UserSerializer(user, context={'request': request}).data
        
        # Add extra info for admin
        data['properties_count'] = user.properties.count()
        data['payments_count'] = user.payments.count()
        data['inquiries_count'] = user.inquiries.count()
        
        # Add recent activities
        data['recent_properties'] = [{
            'id': p.id,
            'title': p.title,
            'status': p.status,
            'created_at': p.created_at
        } for p in user.properties.all().order_by('-created_at')[:5]]
        
        data['recent_payments'] = [{
            'id': pay.id,
            'amount': float(pay.amount),
            'type': pay.payment_type,
            'status': pay.status,
            'created_at': pay.created_at
        } for pay in user.payments.all().order_by('-created_at')[:5]]

        # Add KYC Details
        try:
            if hasattr(user, 'verification_document'):
                data['kyc_details'] = VerificationDocumentSerializer(user.verification_document).data
            else:
                data['kyc_details'] = None
        except:
            data['kyc_details'] = None

        return Response(data)
