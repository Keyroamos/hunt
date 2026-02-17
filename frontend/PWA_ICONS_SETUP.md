# PWA Icons Setup

You need to add the following icon files to the `frontend/public` directory:

## Required Icons:

1. **icon-192.png** (192x192 pixels)
   - Square icon with your House Hunt logo
   - Orange/Rose gradient background recommended
   - Should be clear and recognizable

2. **icon-512.png** (512x512 pixels)
   - Same design as 192x192 but higher resolution
   - Used for splash screens and high-DPI displays

3. **logo.png** (any size, recommended 256x256)
   - Your main app logo
   - Used in notifications

## Optional (for better experience):

4. **screenshot-mobile.png** (540x720 pixels)
   - Screenshot of the app on mobile
   - Shows in app store listings

5. **screenshot-desktop.png** (1280x720 pixels)
   - Screenshot of the app on desktop
   - Shows in app store listings

6. **offline.html**
   - Simple page shown when offline
   - Can be a basic "You're offline" message

## Quick Icon Generation:

You can use these tools to generate icons:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- Or create them in Figma/Photoshop

## Design Recommendations:

- Use your brand colors (Orange #f97316, Rose #fb7185)
- Keep the design simple and recognizable
- Ensure good contrast for visibility
- Test on both light and dark backgrounds

Once you add these files to `/frontend/public/`, the PWA will be fully functional!
