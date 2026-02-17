import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'househunt.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.request import Request
from django.contrib.auth.models import AnonymousUser
from house.views import PropertyViewSet

factory = RequestFactory()
request = factory.get('/api/properties/')
request.user = AnonymousUser()

view = PropertyViewSet.as_view({'get': 'list'})
try:
    response = view(request)
    # The response needs to be rendered to trigger serialization
    response.render()
    print(f"Status Code: {response.status_code}")
    if response.status_code == 500:
        print(response.content.decode())
    else:
        print("Success")
except Exception as e:
    print(f"Crash: {e}")
    import traceback
    traceback.print_exc()
