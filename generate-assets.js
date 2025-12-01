#!/usr/bin/env node

/**
 * MicroFocus Zones - Asset Generator & Packager
 * Generates Chrome extension assets using Playwright-rendered HTML and
 * bundles the extension into a ZIP.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const archiver = require('archiver');

const EXTENSION_DIR = __dirname;
const ASSETS_DIR = path.join(EXTENSION_DIR, 'assets');
const OUTPUT_ZIP = path.join(EXTENSION_DIR, 'microfocus-zones.zip');

const ASSETS = [
  { filename: 'icon-16.png', width: 16, height: 16, type: 'icon', label: 'Icon 16x16' },
  { filename: 'icon-32.png', width: 32, height: 32, type: 'icon', label: 'Icon 32x32' },
  { filename: 'icon-48.png', width: 48, height: 48, type: 'icon', label: 'Icon 48x48' },
  { filename: 'icon-128.png', width: 128, height: 128, type: 'icon', label: 'Icon 128x128' },
  { filename: 'screenshot-1280x800.png', width: 1280, height: 800, type: 'screenshot', label: 'Screenshot 1280x800' },
  { filename: 'screenshot-640x400.png', width: 640, height: 400, type: 'screenshot', label: 'Screenshot 640x400' },
  { filename: 'promo-small-440x280.png', width: 440, height: 280, type: 'promo-small', label: 'Promo tile small' },
  { filename: 'promo-marquee-1400x560.png', width: 1400, height: 560, type: 'promo-marquee', label: 'Promo tile marquee' }
];

function ensureAssetsDir() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    console.log('Created assets directory');
  }
}

function iconHTML(size) {
  return `
    <!doctype html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #7c5cff 0%, #6dd6ff 100%);
            font-family: "Inter", "Segoe UI", system-ui, sans-serif;
            position: relative;
            overflow: hidden;
          }
          .glow {
            position: absolute;
            width: 140%;
            height: 140%;
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), transparent 55%),
                        radial-gradient(circle at 70% 70%, rgba(0,0,0,0.15), transparent 60%);
            transform: rotate(8deg);
          }
          .mark {
            position: relative;
            z-index: 2;
            width: 70%;
            height: 70%;
            border-radius: 24%;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.28);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: ${Math.max(10, Math.floor(size / 3))}px;
            letter-spacing: 0.5px;
            text-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .dot {
            position: absolute;
            inset: 22%;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            filter: blur(0.5px);
          }
        </style>
      </head>
      <body>
        <div class="glow"></div>
        <div class="dot"></div>
        <div class="mark">Z</div>
      </body>
    </html>
  `;
}

function screenshotHTML(width, height) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          :root {
            --bg: #050712;
            --panel: rgba(12,16,34,0.9);
            --muted: #8ba2c6;
            --text: #e6edff;
            --accent: #6dd6ff;
            --border: rgba(255,255,255,0.08);
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            width: ${width}px;
            height: ${height}px;
            background:
              radial-gradient(circle at 20% 20%, rgba(109, 214, 255, 0.12), transparent 32%),
              radial-gradient(circle at 80% 70%, rgba(124, 92, 255, 0.10), transparent 30%),
              var(--bg);
            font-family: "Inter", "Segoe UI", system-ui, sans-serif;
            color: var(--text);
            overflow: hidden;
          }
          header {
            padding: 18px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(7, 10, 24, 0.85);
            border-bottom: 1px solid var(--border);
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.3px;
          }
          .subtitle {
            color: var(--muted);
            font-size: 12px;
            margin-top: 4px;
          }
          .chips {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          .chip {
            padding: 6px 10px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(124, 92, 255, 0.14);
            font-size: 11px;
            color: #ffffff;
          }
          main {
            padding: 18px 24px;
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 16px;
            height: ${height - 80}px;
          }
          .card {
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 16px;
            box-shadow: 0 10px 35px rgba(0,0,0,0.35);
          }
          .card h3 {
            margin: 0 0 10px 0;
            font-size: 13px;
            letter-spacing: 0.2px;
          }
          .list {
            display: grid;
            gap: 10px;
          }
          .list-item {
            background: rgba(10, 14, 30, 0.8);
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 10px;
            padding: 10px 12px;
            display: grid;
            gap: 4px;
          }
          .list-item .row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .row .muted { color: var(--muted); }
          .pill {
            padding: 2px 8px;
            border-radius: 999px;
            background: rgba(109, 214, 255, 0.12);
            color: var(--accent);
            font-size: 10px;
            border: 1px solid rgba(109, 214, 255, 0.4);
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 8px;
          }
          .metric {
            padding: 12px;
            border-radius: 12px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.06);
          }
          .metric .label { color: var(--muted); font-size: 11px; }
          .metric .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
          .timeline {
            margin-top: 14px;
            display: grid;
            gap: 10px;
          }
          .timeline-item {
            border-radius: 10px;
            padding: 10px;
            border: 1px solid rgba(255,255,255,0.04);
            background: linear-gradient(90deg, rgba(124,92,255,0.09), rgba(109,214,255,0.05));
          }
          .code {
            margin-top: 12px;
            background: rgba(5, 8, 20, 0.9);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 12px;
            font-family: "Cascadia Code", Menlo, Consolas, monospace;
            font-size: 10px;
            color: #e1e7ff;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <header>
          <div>
            <div class="title">MicroFocus Zones</div>
            <div class="subtitle">Task-scoped focus with semantic gates</div>
          </div>
          <div class="chips">
            <span class="chip">Recording focus</span>
            <span class="chip">Tabs locked</span>
          </div>
        </header>
        <main>
          <section class="card">
            <h3>Active Zones</h3>
            <div class="list">
              <div class="list-item">
                <div class="row">
                  <span>Deep Work</span>
                  <span class="pill">25m</span>
                </div>
                <div class="row">
                  <span class="muted">Distractions blocked</span>
                  <span class="muted">Streak 7 days</span>
                </div>
              </div>
              <div class="list-item">
                <div class="row">
                  <span>Research Capsule</span>
                  <span class="pill">15m</span>
                </div>
                <div class="row">
                  <span class="muted">Semantic gate: docs, notes</span>
                  <span class="muted">Tabs restoring</span>
                </div>
              </div>
            </div>
          </section>
          <section class="card">
            <h3>Focus Overview</h3>
            <div class="grid">
              <div class="metric">
                <div class="label">Total focus</div>
                <div class="value">1,080 m</div>
              </div>
              <div class="metric">
                <div class="label">Sessions</div>
                <div class="value">24</div>
              </div>
              <div class="metric">
                <div class="label">Current gate</div>
                <div class="value">Work only</div>
              </div>
              <div class="metric">
                <div class="label">Break timer</div>
                <div class="value">05:00</div>
              </div>
            </div>
            <div class="timeline">
              <div class="timeline-item">
                <div class="row"><span>08:45</span><span class="pill">Locked</span></div>
                <div class="row"><span class="muted">Tabs restored: docs, sprint board</span><span class="muted">Noise blocked</span></div>
              </div>
              <div class="timeline-item">
                <div class="row"><span>08:15</span><span class="pill">Break</span></div>
                <div class="row"><span class="muted">Short pause with reminder</span><span class="muted">Focus resuming</span></div>
              </div>
            </div>
            <div class="code">
Focus log:
- Zone: Deep Work
- Policy: semantic gate (work)
- Distractions: social, video, games blocked
            </div>
          </section>
        </main>
      </body>
    </html>
  `;
}

function promoHTML(width, height, isMarquee) {
  const featureLine = isMarquee
    ? `
        <div class="features">
          <span>Semantic gates</span>
          <span class="dot">•</span>
          <span>Tab capsules</span>
          <span class="dot">•</span>
          <span>Focus analytics</span>
        </div>
      `
    : `
        <div class="features">
          <span>Block distractions</span>
          <span class="dot">•</span>
          <span>Restore tabs</span>
        </div>
      `;

  return `
    <!doctype html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            width: ${width}px;
            height: ${height}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: "Inter", "Segoe UI", system-ui, sans-serif;
            background: radial-gradient(circle at 20% 30%, rgba(124,92,255,0.25), transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(109,214,255,0.22), transparent 42%),
              linear-gradient(135deg, #0a0e1c 0%, #10172b 100%);
            position: relative;
            overflow: hidden;
            color: #e8eeff;
          }
          .glow {
            position: absolute;
            width: 150%;
            height: 150%;
            background: linear-gradient(135deg, rgba(124, 92, 255, 0.16), rgba(109, 214, 255, 0.12));
            filter: blur(80px);
            transform: rotate(-10deg);
          }
          .card {
            position: relative;
            z-index: 2;
            text-align: center;
            padding: ${isMarquee ? '36px' : '28px'};
            border-radius: 18px;
            background: rgba(9, 12, 24, 0.75);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 10px 40px rgba(0,0,0,0.45);
            width: 88%;
          }
          .icon {
            width: ${isMarquee ? 96 : 72}px;
            height: ${isMarquee ? 96 : 72}px;
            border-radius: 26%;
            margin: 0 auto 18px;
            background: linear-gradient(135deg, #7c5cff, #6dd6ff);
            display: grid;
            place-items: center;
            color: #fff;
            font-weight: 800;
            font-size: ${isMarquee ? 44 : 32}px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.25);
          }
          h1 {
            margin: 0 0 10px 0;
            font-size: ${isMarquee ? 48 : 30}px;
            letter-spacing: 0.3px;
          }
          .tagline {
            margin: 0;
            font-size: ${isMarquee ? 20 : 16}px;
            color: #9fb3d8;
          }
          .features {
            margin-top: 16px;
            color: #b9c7e6;
            font-size: ${isMarquee ? 16 : 14}px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .dot { color: #6dd6ff; }
        </style>
      </head>
      <body>
        <div class="glow"></div>
        <div class="card">
          <div class="icon">Z</div>
          <h1>MicroFocus Zones</h1>
          <p class="tagline">Stay in the right zone, block the noise.</p>
          ${featureLine}
        </div>
      </body>
    </html>
  `;
}

async function renderAsset(browser, asset) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: asset.width, height: asset.height });

  let html = '';
  switch (asset.type) {
    case 'icon':
      html = iconHTML(asset.width);
      break;
    case 'screenshot':
      html = screenshotHTML(asset.width, asset.height);
      break;
    case 'promo-small':
      html = promoHTML(asset.width, asset.height, false);
      break;
    case 'promo-marquee':
      html = promoHTML(asset.width, asset.height, true);
      break;
    default:
      throw new Error(`Unknown asset type: ${asset.type}`);
  }

  await page.setContent(html);
  await page.waitForTimeout(400);

  const outputPath = path.join(ASSETS_DIR, asset.filename);
  await page.screenshot({ path: outputPath, fullPage: false });
  await page.close();

  console.log(`- ${asset.label} -> ${asset.filename}`);
}

async function generateAllAssets() {
  console.log('\nGenerating extension assets with Playwright...\n');
  ensureAssetsDir();

  const browser = await chromium.launch({ headless: true });

  try {
    for (const asset of ASSETS) {
      await renderAsset(browser, asset);
    }
    console.log('\nAll assets generated successfully.\n');
    return true;
  } catch (error) {
    console.error('Asset generation failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

async function createExtensionZip() {
  return new Promise((resolve, reject) => {
    console.log('Packaging extension into ZIP...\n');

    const output = fs.createWriteStream(OUTPUT_ZIP);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`ZIP ready: ${OUTPUT_ZIP} (${sizeInMB} MB)\n`);
      resolve();
    });

    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    const filesToInclude = [
      'manifest.json',
      'background.js',
      'sidepanel.html',
      'sidepanel.js',
      'sidepanel.css',
      'content.js',
      'content.css',
      'tutorial.html',
      'tutorial.js',
      'dev.md'
    ];

    filesToInclude.forEach((file) => {
      const filePath = path.join(EXTENSION_DIR, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    if (fs.existsSync(ASSETS_DIR)) {
      archive.directory(ASSETS_DIR, 'assets');
    }

    archive.finalize();
  });
}

async function main() {
  console.log('MicroFocus Zones - Asset Generator & Packager\n');

  const assetsGenerated = await generateAllAssets();
  if (!assetsGenerated) {
    process.exit(1);
  }

  await createExtensionZip();
  console.log('All tasks completed successfully.\n');
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
