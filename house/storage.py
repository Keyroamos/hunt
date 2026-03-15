import os
from io import BytesIO
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from django.conf import settings
from supabase import create_client, Client

@deconstructible
class SupabaseStorage(Storage):
    def __init__(self, bucket_name=None, **kwargs):
        self.url = os.environ.get('SUPABASE_URL')
        self.key = os.environ.get('SUPABASE_KEY')
        self.bucket_name = bucket_name or os.environ.get('SUPABASE_STORAGE_BUCKET', 'media')
        
        if not self.url or not self.key:
            # Fallback to settings if env vars not set (though env is preferred)
            self.url = getattr(settings, 'SUPABASE_URL', None)
            self.key = getattr(settings, 'SUPABASE_KEY', None)

        if not self.url or not self.key:
            raise ValueError("Supabase URL and Key must be provided.")
            
        self.supabase: Client = create_client(self.url, self.key)

    def _save(self, name, content):
        # Convert content to bytes if it's not
        if hasattr(content, 'read'):
            file_data = content.read()
        else:
            file_data = content

        # Upload to Supabase Storage
        path = name.replace('\\', '/')
        self.supabase.storage.from_(self.bucket_name).upload(path, file_data, {"upsert": "true"})
        return name

    def url(self, name):
        # Return the public URL for the file
        path = name.replace('\\', '/')
        res = self.supabase.storage.from_(self.bucket_name).get_public_url(path)
        return res

    def exists(self, name):
        # Check if file exists (optional, could be slow if many files)
        # For simplicity return False to always allow upload or True if you want to skip
        return False

    def delete(self, name):
        path = name.replace('\\', '/')
        self.supabase.storage.from_(self.bucket_name).remove([path])

    def size(self, name):
        # Not easily available without another API call
        return 0
