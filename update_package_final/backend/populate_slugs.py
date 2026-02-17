import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'househunt.settings')
django.setup()

from house.models import Property

print("Populating slugs for existing properties...")
properties = Property.objects.all()
count = 0
for p in properties:
    if not p.slug:
        p.save()
        count += 1
print(f"Updated slugs for {count} properties.")
