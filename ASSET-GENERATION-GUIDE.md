# 🎨 MicroFocus Zones - Asset Generation Guide

## Quick Start

### Windows Users
Double-click `generate-assets.bat` and follow the prompts.

### macOS/Linux Users
```bash
chmod +x generate-assets.sh
./generate-assets.sh
```

### All Platforms (Manual)
```bash
npm install
npm run generate-assets
```

---

## What This Script Does

### 1. Generates All Chrome Web Store Assets

The script automatically creates professional images according to Chrome Web Store requirements:

#### **Icons** (Required)
| Size | Usage | File |
|------|-------|------|
| 16×16px | Browser toolbar | `icon-16.png` |
| 32×32px | Browser toolbar (2x) | `icon-32.png` |
| 48×48px | Extension management page | `icon-48.png` |
| 128×128px | Chrome Web Store | `icon-128.png` |

#### **Screenshots** (Required - At least 1)
| Size | Usage | File |
|------|-------|------|
| 1280×800px | Large screenshot | `screenshot-1280x800.png` |
| 640×400px | Small preview | `screenshot-640x400.png` |

#### **Promo Tiles** (Optional but recommended)
| Size | Usage | File |
|------|-------|------|
| 440×280px | Chrome Web Store tile | `promo-small-440x280.png` |
| 1400×560px | Store banner | `promo-marquee-1400x560.png` |

### 2. Creates Extension ZIP File

After asset generation, the script automatically packages everything into `microfocus-zones.zip`:

```
microfocus-zones.zip
├── manifest.json
├── background.js
├── sidepanel.html
├── sidepanel.js
├── sidepanel.css
├── content.js
├── content.css
├── tutorial.html
├── tutorial.js
├── dev.md
└── assets/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    ├── icon-128.png
    ├── screenshot-1280x800.png
    ├── screenshot-640x400.png
    ├── promo-small-440x280.png
    └── promo-marquee-1400x560.png
```

---

## Installation

### Prerequisites
- **Node.js** 14+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)

### Steps

1. **Navigate to extension folder:**
```bash
cd "c:\Users\jomar\Extesnions\MicroFocus Zones"
```

2. **Install dependencies** (one-time):
```bash
npm install
```

3. **Generate assets and ZIP:**
```bash
npm run generate-assets
```

---

## Dependencies

The script uses these npm packages:

### `archiver` (6.0.0+)
- Creates ZIP files with compression
- Packages the entire extension

### `canvas` (2.11.2+)
- Node.js native bindings to Cairo for drawing
- Generates all PNG images programmatically
- Supports gradients, shapes, text rendering

### `sharp` (0.33.0+)
- Fast image processing
- Available for future optimization

**Total size:** ~50-100 MB (mostly native bindings)

---

## Generated Asset Specifications

### Icon Design
- **Colors:** Gradient from purple (#7c5cff) to cyan (#6dd6ff)
- **Theme:** Concentric circles representing focus zones
- **Format:** PNG with transparency

### Screenshot Design
- **Background:** Dark gradient matching extension theme
- **Content:** 
  - Extension title and subtitle
  - 2 example task cards with stats
  - Footer with productivity metrics
- **Format:** PNG
- **Resolutions:** 1280×800 and 640×400

### Promo Tile (Small 440×280)
- **Purpose:** Chrome Web Store thumbnail
- **Content:** Branded with extension name and value proposition
- **Format:** PNG

### Promo Tile (Marquee 1400×560)
- **Purpose:** Chrome Web Store banner/header
- **Content:** 
  - Main branding
  - 4 feature bullets
  - Stats display (focus time, sessions, streak)
- **Format:** PNG

---

## Customization

### Editing Asset Generation

Open `generate-assets.js` and modify the functions:

#### Change Icon Colors
```javascript
// In generateIcon() function
gradient.addColorStop(0, '#YOUR_HEX_COLOR');
gradient.addColorStop(1, '#YOUR_HEX_COLOR');
```

#### Modify Screenshot Content
```javascript
// In generateScreenshot() function
ctx.fillText('Your Custom Text', x, y);
```

#### Update Promo Tiles
```javascript
// In generatePromoSmall() or generatePromoMarquee()
// Change text, colors, layout as needed
```

### Example: Dark Mode Icons
```javascript
// Change gradient in generateIcon()
gradient.addColorStop(0, '#1a1a2e');
gradient.addColorStop(1, '#16213e');
```

---

## Output & Verification

After running the script, verify:

1. **Assets folder created:**
   ```
   assets/
   ├── icon-16.png ✓
   ├── icon-32.png ✓
   ├── icon-48.png ✓
   ├── icon-128.png ✓
   ├── screenshot-1280x800.png ✓
   ├── screenshot-640x400.png ✓
   ├── promo-small-440x280.png ✓
   └── promo-marquee-1400x560.png ✓
   ```

2. **ZIP file created:**
   ```
   microfocus-zones.zip (created successfully) ✓
   ```

3. **Check file sizes:**
   - Icons: 5-50 KB each
   - Screenshots: 100-300 KB each
   - Promo tiles: 150-400 KB each
   - ZIP: 200-500 KB

---

## Uploading to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

2. Create new item or edit existing

3. **Upload files:**
   - Upload `microfocus-zones.zip`

4. **Add images to store listing:**
   - Icon (128×128): `assets/icon-128.png`
   - Screenshots (1280×800): `assets/screenshot-1280x800.png`
   - Small tile (440×280): `assets/promo-small-440x280.png`
   - Marquee (1400×560): `assets/promo-marquee-1400x560.png`

5. **Fill store details:**
   - Description
   - Changelog
   - Privacy policy
   - Permissions justification

6. **Submit for review**

---

## Troubleshooting

### "Node.js is not installed"
- Download from [nodejs.org](https://nodejs.org/)
- Make sure to add Node to PATH during installation
- Restart terminal/CMD after installing

### "npm command not found"
- npm comes with Node.js
- Verify Node installation: `node --version`
- Reinstall Node.js if needed

### Canvas build errors on Windows
```bash
# Try pre-built binaries
npm install --save-optional

# Or rebuild from source
npm install --build-from-source
```

### "Permission denied" on macOS/Linux
```bash
chmod +x generate-assets.sh
./generate-assets.sh
```

### ZIP file not created
- Check disk space
- Verify write permissions in folder
- Try running as administrator/with sudo
- Check console output for specific errors

### Images look wrong
- Edit `generate-assets.js` functions
- Check canvas context methods (fillText, fillRect, etc.)
- Verify colors are valid hex codes
- Re-run script: `npm run generate-assets`

---

## Advanced: Batch Processing

Generate multiple versions:

```bash
# Edit colors in script
# Run for each color scheme
node generate-assets.js

# Copy assets to versioned folders
cp -r assets/ assets-v1/
```

---

## Performance Notes

- **Generation time:** 5-15 seconds
- **Assets size:** ~1.5 MB total
- **ZIP size:** ~500 KB compressed
- **Memory usage:** <100 MB

---

## Support

For issues with:
- **Canvas:** https://github.com/Automattic/node-canvas
- **Archiver:** https://github.com/archiverjs/node-archiver
- **Sharp:** https://sharp.pixelplumbing.com/

---

## License

MIT - Feel free to modify and distribute
