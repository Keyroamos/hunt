"""
URL configuration for househunt project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache
from django.views.static import serve

from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('house.urls')),
    
    # Explicitly serve frontend assets
    re_path(r'^assets/(?P<path>.*)$', serve, {
        'document_root': settings.BASE_DIR / 'frontend' / 'dist' / 'assets',
    }),
    re_path(r'^manifest.json$', serve, {
        'document_root': settings.BASE_DIR / 'frontend' / 'dist',
        'path': 'manifest.json',
    }),
    re_path(r'^service-worker.js$', serve, {
        'document_root': settings.BASE_DIR / 'frontend' / 'dist',
        'path': 'service-worker.js',
    }),
    re_path(r'^robots.txt$', serve, {
        'document_root': settings.BASE_DIR / 'frontend' / 'dist',
        'path': 'robots.txt',
    }),
    re_path(r'^favicon.ico$', serve, {
        'document_root': settings.BASE_DIR / 'frontend' / 'dist',
        'path': 'favicon.ico',
    }),
    re_path(r'^(?P<path>.*\.png)$', serve, {
        'document_root': settings.BASE_DIR / 'frontend' / 'dist',
    }),
]

# Explicitly serve media files (even in production if not handled by server)
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all for React Router - Must be last!
from house.views_frontend import serve_spa
urlpatterns += [
    re_path(r'^(?P<path>.*)$', serve_spa),
]
