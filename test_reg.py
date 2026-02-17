import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'househunt.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from house.views import UserViewSet
from house.models import User

def test_registration():
    factory = APIRequestFactory()
    data = {
        "email": "testuser_new@example.com",
        "username": "testuser_new@example.com",
        "password": "password123",
        "user_type": "hunter",
        "full_name": "Test User",
        "phone": "0712345678"
    }
    
    # Delete if exists
    User.objects.filter(email=data["email"]).delete()
    User.objects.filter(username=data["username"]).delete()
    
    request = factory.post('/api/users/', data, format='json')
    view = UserViewSet.as_view({'post': 'create'})
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Data: {response.data}")

if __name__ == "__main__":
    test_registration()
