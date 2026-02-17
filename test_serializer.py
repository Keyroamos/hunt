import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'househunt.settings')
django.setup()

from house.models import Property
from house.serializers import PropertySerializer
from rest_framework.request import Request
from django.test import RequestFactory

factory = RequestFactory()
request = factory.get('/api/properties/')
# Simulate an anonymous user
from django.contrib.auth.models import AnonymousUser
request.user = AnonymousUser()

# Wrap in DRF Request
drf_request = Request(request)

queryset = Property.objects.all()
if queryset.exists():
    prop = queryset.first()
    serializer = PropertySerializer(prop, context={'request': drf_request})
    try:
        data = serializer.data
        print("Serialization successful")
        # print(data)
    except Exception as e:
        print(f"Serialization failed: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No properties found in database")
