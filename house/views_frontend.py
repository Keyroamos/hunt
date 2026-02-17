import os
from django.conf import settings
from django.http import HttpResponse
from house.models import Property

def serve_spa(request, path=''):
    """
    Serves the React Single Page Application (SPA).
    For specific routes like /property/<id>, it injects dynamic Open Graph meta tags
    so that social media crawlers (WhatsApp, Facebook, Twitter) can display a preview card.
    """
    
    # Path to the build index.html file
    # We check fallback locations just in case
    index_path = settings.BASE_DIR / 'frontend' / 'dist' / 'index.html'
    if not index_path.exists():
        # Fallback to local dev path if dist doesn't exist (though strictly for prod)
        return HttpResponse(
            "Frontend build not found. Please run 'npm run build' in frontend directory.",
            status=500
        )

    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception as e:
        return HttpResponse(f"Error reading frontend: {str(e)}", status=500)

    # Dynamic Injection Logic
    # We only inject if the path matches a property detail page
    if path.startswith('property/'):
        try:
            # Expected format: property/123 or property/123-title-slug
            # We split by '/' and take the second part (the ID/Slug)
            parts = path.split('/')
            if len(parts) >= 2:
                prop_identifier = parts[1]
                # If there's a dash (slug), take the first part as ID
                prop_id = prop_identifier.split('-')[0]
                
                if prop_id.isdigit():
                    property_obj = Property.objects.get(id=prop_id)
                    
                    # Prepare Data
                    title = f"{property_obj.title} | House Hunt Kenya"
                    
                    # Create a nice description with price and location
                    # Use the correct model field name: rent_per_month
                    price = getattr(property_obj, 'rent_per_month', 0)
                    price_formatted = f"KES {price:,.0f}"
                    desc = f"{property_obj.property_type.replace('_', ' ').title()} in {property_obj.location} for {price_formatted}/month. {property_obj.description[:150]}..."
                    
                    # Image Logic
                    production_domain = "https://househunt.co.ke"
                    image_url = f"{production_domain}/icon-512.png"
                    
                    # Check for primary image first, then any image
                    prop_image = property_obj.images.filter(is_primary=True).first() or property_obj.images.first()
                    
                    if prop_image:
                        # Ensure absolute URL
                        if prop_image.image.url.startswith('http'):
                            image_url = prop_image.image.url
                        else:
                            image_url = f"{production_domain}{prop_image.image.url}"

                    # Perform Replacements
                    default_title = "House Hunt Kenya - Find Your Perfect Home"
                    default_desc = "Find and list rental properties in Kenya. Connect with landlords and tenants seamlessly."
                    default_image = "https://househunt.co.ke/icon-512.png"
                    default_url = "https://househunt.co.ke/"
                    current_url = f"https://househunt.co.ke/{path}"

                    # Replace OG Tags
                    html = html.replace(f'content="{default_title}"', f'content="{title}"')
                    html = html.replace(f'content="{default_desc}"', f'content="{desc}"')
                    html = html.replace(f'content="{default_image}"', f'content="{image_url}"')
                    html = html.replace(f'content="{default_url}"', f'content="{current_url}"')
                    
                    # Replace standard Title tag as well
                    html = html.replace(f'<title>{default_title}</title>', f'<title>{title}</title>')
                    
        except (Property.DoesNotExist, ValueError, IndexError) as e:
            # If property not found or bad ID, just serve default HTML
            pass
        except Exception as e:
            # Log the error but don't crash
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error injecting meta tags: {e}")
            pass

    return HttpResponse(html)
