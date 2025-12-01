# Asset Generation & Packaging Setup

## Prerequisites

- Node.js 14+ installed
- npm (comes with Node.js)

## Installation

1. Navigate to the extension directory:
```bash
cd "c:\Users\jomar\Extesnions\MicroFocus Zones"
```

2. Install dependencies:
```bash
npm install
```

This will install:
- **archiver** - For creating ZIP files
- **canvas** - For drawing assets programmatically
- **sharp** - For additional image processing

## Usage

### Generate Assets & Create ZIP

Run the asset generator script:

```bash
npm run generate-assets
```

Or directly with Node:

```bash
node generate-assets.js
```

### What Gets Generated

The script creates all required Chrome Web Store assets:

#### Icons
- `assets/icon-16.png` (16×16 px)
- `assets/icon-32.png` (32×32 px)
- `assets/icon-48.png` (48×48 px)
- `assets/icon-128.png` (128×128 px)

#### Screenshots
- `assets/screenshot-1280x800.png` (1280×800 px)
- `assets/screenshot-640x400.png` (640×400 px)

#### Promo Tiles
- `assets/promo-small-440x280.png` (440×280 px)
- `assets/promo-marquee-1400x560.png` (1400×560 px)

#### Extension Package
- `microfocus-zones.zip` - Ready to upload to Chrome Web Store

## Output

After running, you'll see:
- ✅ All images generated in `assets/` folder
- ✅ `microfocus-zones.zip` file created in the extension root

The ZIP includes:
- All extension source files (JS, CSS, HTML)
- All generated assets
- Ready for Chrome Web Store submission

## Customizing Assets

Edit the asset generation functions in `generate-assets.js`:

- `generateIcon()` - Modify colors, shapes, layers
- `generateScreenshot()` - Change layout, content, stats
- `generatePromoSmall()` - Adjust text, styling
- `generatePromoMarquee()` - Modify features list, layout

### Example: Change icon gradient

```javascript
gradient.addColorStop(0, '#YOUR_COLOR_1');
gradient.addColorStop(1, '#YOUR_COLOR_2');
```

## Troubleshooting

### Canvas module fails on Windows

If you get canvas build errors:
```bash
npm install --build-from-source
```

Or use pre-built binaries:
```bash
npm install --save-optional
```

### Permission denied on macOS/Linux

Make the script executable:
```bash
chmod +x generate-assets.js
```

Then run:
```bash
./generate-assets.js
```

## Chrome Web Store Submission Checklist

- [ ] Assets generated and verified
- [ ] ZIP file created successfully
- [ ] Run script and check `assets/` folder visually
- [ ] manifest.json is valid
- [ ] All source files included in ZIP
- [ ] Upload ZIP to Chrome Web Store Developer Dashboard

## File Structure

```
MicroFocus Zones/
├── generate-assets.js       (This script)
├── package.json             (Dependencies)
├── manifest.json
├── background.js
├── sidepanel.html
├── sidepanel.js
├── sidepanel.css
├── content.js
├── content.css
├── tutorial.html
├── tutorial.js
├── assets/                  (Generated)
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-128.png
│   ├── screenshot-1280x800.png
│   ├── screenshot-640x400.png
│   ├── promo-small-440x280.png
│   └── promo-marquee-1400x560.png
└── microfocus-zones.zip     (Generated)
```

## License

MIT
