from django.core.management.base import BaseCommand
from house.models import Property
import re

def extract_coords(embed_code):
    if not embed_code:
        return None, None
    lat_match = re.search(r'!3d([-0-9.]+)', embed_code)
    lng_match = re.search(r'!2d([-0-9.]+)', embed_code)
    if lat_match and lng_match:
        return lat_match.group(1), lng_match.group(1)
    return None, None

class Command(BaseCommand):
    help = 'Populates latitude and longitude from map_embed for existing properties'

    def handle(self, *args, **kwargs):
        # Check all properties that might have embed but no coords
        properties = Property.objects.exclude(map_embed='')
        count = 0
        updated = 0
        
        self.stdout.write('Scanning properties...')
        
        for prop in properties:
            # Even if lat exists, we might want to overwrite if it looks default/wrong?
            # For now, only update if missing to avoid overwriting manual edits.
            if not prop.latitude or not prop.longitude:
                lat, lng = extract_coords(prop.map_embed)
                if lat and lng:
                    prop.latitude = lat
                    prop.longitude = lng
                    prop.save()
                    updated += 1
                    self.stdout.write(f'Updated: {prop.title}')
                else:
                    self.stdout.write(f'Skipped (No coords found in embed): {prop.title}')
            else:
                 count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Finished. Updated {updated} properties. {count} already had coords.'))
