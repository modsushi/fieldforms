# App Icons

## Current Status

The icon files referenced in `manifest.json` need to be created. Currently, SVG placeholders have been generated.

## Required Icons

The PWA manifest requires the following icon sizes:
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px (Apple touch icon)
- 192x192px (Android)
- 384x384px
- 512x512px (Android splash screen)

## How to Generate Icons

### Option 1: Using Online Tools (Recommended)

1. **PWA Builder Image Generator**
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload a 512x512px source image
   - Download all generated icon sizes
   - Replace the files in this directory

2. **Real Favicon Generator**
   - Visit: https://realfavicongenerator.net/
   - Upload your logo/icon
   - Configure for all platforms
   - Download and extract to this directory

### Option 2: Using Design Tools

Create icons in:
- Figma
- Adobe Illustrator
- Sketch
- Canva

Export each size as PNG with transparent background.

### Option 3: Using ImageMagick (CLI)

If you have a source image (`source.png`):

```bash
for size in 72 96 128 144 152 192 384 512; do
  convert source.png -resize ${size}x${size} icon-${size}x${size}.png
done
```

## Design Guidelines

### Brand Colors (from manifest.json)
- Primary: `#3b82f6` (Blue 500)
- Background: `#ffffff` (White)

### Recommendations
- Use a simple, recognizable symbol
- Ensure the icon works at small sizes (72x72)
- Use high contrast for visibility
- Consider both light and dark backgrounds
- Make it "maskable" (safe zone: center 80%)

### Maskable Icons
Icons should have important content within the center 80% safe zone.
Outer 20% may be cropped on some devices.

## Current Placeholder

The `.png.svg` files are SVG placeholders showing a clipboard with checkmark.
These are NOT actual PNG files and need to be replaced for the PWA to work properly.

## Testing Icons

After adding real icons:
1. Build the app: `npm run build`
2. Serve locally: `npm start`
3. Open DevTools > Application > Manifest
4. Verify all icons load correctly
5. Test "Add to Home Screen" on mobile device
