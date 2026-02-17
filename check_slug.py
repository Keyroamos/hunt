import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'househunt.settings')
django.setup()

from house.models import Property

slug = 'smart-hut-apartments'
try:
    p = Property.objects.get(slug=slug)
    print(f"Found property: {p.title} (ID: {p.id}, Slug: {p.slug})")
except Property.DoesNotExist:
    print(f"Property with slug '{slug}' NOT FOUND.")
    # List all slugs
    print("Available slugs:")
    for prop in Property.objects.all():
        print(f"- {prop.slug} (ID: {prop.id})")
