# Save ARC Button Image

You need to save the uploaded neon concentric arcs image to these locations:

1. Save the image you uploaded as:
   - `portfolio-site/public/arc-button-256.png` (256x256 pixels)
   - `portfolio-site/public/arc-button-512.png` (512x512 pixels) 
   - `portfolio-site/public/arc-button-768.png` (768x768 pixels)

2. If you have the original image, you can use these commands to create the different sizes:

```bash
# If you have ImageMagick installed:
convert arc-original.png -resize 256x256 portfolio-site/public/arc-button-256.png
convert arc-original.png -resize 512x512 portfolio-site/public/arc-button-512.png
convert arc-original.png -resize 768x768 portfolio-site/public/arc-button-768.png

# Or if you have sips (macOS):
sips -Z 256 arc-original.png --out portfolio-site/public/arc-button-256.png
sips -Z 512 arc-original.png --out portfolio-site/public/arc-button-512.png
sips -Z 768 arc-original.png --out portfolio-site/public/arc-button-768.png
```

3. The image should be the exact neon concentric arcs with:
   - Purple-heavy outer ring
   - Blue inner ring  
   - Diagonal inner arc
   - Dark/transparent background
   - Square aspect ratio (will be displayed as circle via CSS)

Once you save these files, the chatbot button will display your exact image with the neon glow effects!