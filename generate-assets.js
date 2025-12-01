#!/usr/bin/env node

/**
 * MicroFocus Zones - Asset Generator & Packager
 * Generates all required Chrome extension assets and creates a ZIP file
 * 
 * Requirements: node, npm packages: puppeteer, archiver, sharp
 * Usage: node generate-assets.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const archiver = require('archiver');
const sharp = require('sharp');

const EXTENSION_DIR = __dirname;
const ASSETS_DIR = path.join(EXTENSION_DIR, 'assets');
const OUTPUT_ZIP = path.join(EXTENSION_DIR, 'microfocus-zones.zip');

// Asset specifications
const ASSETS = {
  'icon-16.png': { size: 16, type: 'icon' },
  'icon-32.png': { size: 32, type: 'icon' },
  'icon-48.png': { size: 48, type: 'icon' },
  'icon-128.png': { size: 128, type: 'icon' },
  'screenshot-1280x800.png': { width: 1280, height: 800, type: 'screenshot' },
  'screenshot-640x400.png': { width: 640, height: 400, type: 'screenshot' },
  'promo-small-440x280.png': { width: 440, height: 280, type: 'promo-small' },
  'promo-marquee-1400x560.png': { width: 1400, height: 560, type: 'promo-marquee' }
};

/**
 * Create assets directory if it doesn't exist
 */
function ensureAssetsDir() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    console.log('✓ Created assets directory');
  }
}

/**
 * Generate icon image
 */
async function generateIcon(filename, size) {
  return new Promise((resolve, reject) => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#7c5cff');
    gradient.addColorStop(1, '#6dd6ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Draw circle with zone theme
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Write to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer);
    resolve(filename);
  });
}

/**
 * Generate screenshot image
 */
async function generateScreenshot(filename, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#050712');
    gradient.addColorStop(1, '#0c1022');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add decorative elements
    ctx.fillStyle = 'rgba(109, 214, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.2, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(124, 92, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.8, 250, 0, Math.PI * 2);
    ctx.fill();

    // Header area
    ctx.fillStyle = 'rgba(12, 16, 34, 0.8)';
    ctx.fillRect(40, 40, width - 80, 100);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, width - 80, 100);

    // Title
    ctx.fillStyle = '#e5e9ff';
    ctx.font = `${Math.floor(width / 16)}px Inter, sans-serif`;
    ctx.fillText('MicroFocus Zones', 60, 90);

    // Subtitle
    ctx.fillStyle = '#96a3c7';
    ctx.font = `${Math.floor(width / 32)}px Inter, sans-serif`;
    ctx.fillText('Task-scoped focus with semantic gates', 60, 125);

    // Content cards
    const cardY = 160;
    const cardHeight = 140;
    const cardMargin = 30;

    for (let i = 0; i < 2; i++) {
      const cardX = 40 + i * (width / 2.2);
      ctx.fillStyle = 'rgba(14, 19, 36, 0.9)';
      ctx.fillRect(cardX, cardY, width / 2.3 - cardMargin, cardHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX, cardY, width / 2.3 - cardMargin, cardHeight);

      // Card label
      ctx.fillStyle = '#6dd6ff';
      ctx.font = `bold ${Math.floor(width / 64)}px Inter, sans-serif`;
      ctx.fillText(`Zone ${i + 1}`, cardX + 20, cardY + 30);

      // Stats
      ctx.fillStyle = '#e5e9ff';
      ctx.font = `${Math.floor(width / 48)}px Inter, sans-serif`;
      ctx.fillText(`Status: Active`, cardX + 20, cardY + 70);
      ctx.fillText(`Duration: ${25 * (i + 1)}m`, cardX + 20, cardY + 105);
    }

    // Footer stats
    const statsY = height - 100;
    ctx.fillStyle = 'rgba(12, 16, 34, 0.8)';
    ctx.fillRect(40, statsY, width - 80, 70);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, statsY, width - 80, 70);

    ctx.fillStyle = '#96a3c7';
    ctx.font = `${Math.floor(width / 48)}px Inter, sans-serif`;
    ctx.fillText('Total Sessions: 24', 60, statsY + 25);
    ctx.fillText('Total Focus: 1,080 min | Streak: 7 days', 60, statsY + 50);

    // Convert to PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer);
    resolve(filename);
  });
}

/**
 * Generate promo small tile (440x280)
 */
async function generatePromoSmall(filename) {
  return new Promise((resolve, reject) => {
    const width = 440;
    const height = 280;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#7c5cff');
    gradient.addColorStop(1, '#6dd6ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Overlay
    ctx.fillStyle = 'rgba(5, 8, 20, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // Main text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MicroFocus', width / 2, 80);
    ctx.fillText('Zones', width / 2, 140);

    // Subtitle
    ctx.font = '20px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Task-scoped focus zones', width / 2, 190);
    ctx.fillText('Block distractions smart', width / 2, 220);

    // Accent circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(width - 60, 40, 50, 0, Math.PI * 2);
    ctx.fill();

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer);
    resolve(filename);
  });
}

/**
 * Generate marquee promo tile (1400x560)
 */
async function generatePromoMarquee(filename) {
  return new Promise((resolve, reject) => {
    const width = 1400;
    const height = 560;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#050712');
    gradient.addColorStop(0.5, '#0c1022');
    gradient.addColorStop(1, '#050712');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative circles
    ctx.fillStyle = 'rgba(109, 214, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(width * 0.15, height * 0.3, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(124, 92, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.7, 350, 0, Math.PI * 2);
    ctx.fill();

    // Main heading
    ctx.fillStyle = '#e5e9ff';
    ctx.font = 'bold 72px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MicroFocus Zones', 60, 120);

    // Subheading
    ctx.fillStyle = '#96a3c7';
    ctx.font = '32px Inter, sans-serif';
    ctx.fillText('Task-scoped focus capsules & semantic gates', 60, 180);

    // Feature list
    ctx.fillStyle = '#6dd6ff';
    ctx.font = 'bold 20px Inter, sans-serif';
    const features = [
      '✓ Task capsules with tab restoration',
      '✓ Smart distraction gates',
      '✓ Focus timers & break reminders',
      '✓ Productivity analytics'
    ];

    features.forEach((feature, i) => {
      ctx.fillText(feature, 60, 260 + i * 50);
    });

    // Right side accent box
    ctx.fillStyle = 'rgba(14, 19, 36, 0.6)';
    ctx.fillRect(width - 380, 40, 340, 480);
    ctx.strokeStyle = 'rgba(109, 214, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 380, 40, 340, 480);

    // Stats on right
    ctx.fillStyle = '#e5e9ff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Focus Stats', width - 210, 100);

    ctx.fillStyle = '#6dd6ff';
    ctx.font = '44px Inter, sans-serif';
    ctx.fillText('1,080m', width - 210, 180);
    ctx.fillStyle = '#96a3c7';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Total Focus Time', width - 210, 210);

    ctx.fillStyle = '#6dd6ff';
    ctx.font = '44px Inter, sans-serif';
    ctx.fillText('24', width - 210, 310);
    ctx.fillStyle = '#96a3c7';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Sessions Completed', width - 210, 340);

    ctx.fillStyle = '#6dd6ff';
    ctx.font = '44px Inter, sans-serif';
    ctx.fillText('7', width - 210, 440);
    ctx.fillStyle = '#96a3c7';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Day Streak', width - 210, 470);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer);
    resolve(filename);
  });
}

/**
 * Generate all assets
 */
async function generateAllAssets() {
  console.log('\n🎨 Generating extension assets...\n');

  ensureAssetsDir();

  try {
    // Generate icons
    console.log('Generating icons...');
    await generateIcon('icon-16.png', 16);
    console.log('  ✓ icon-16.png (16x16)');
    
    await generateIcon('icon-32.png', 32);
    console.log('  ✓ icon-32.png (32x32)');
    
    await generateIcon('icon-48.png', 48);
    console.log('  ✓ icon-48.png (48x48)');
    
    await generateIcon('icon-128.png', 128);
    console.log('  ✓ icon-128.png (128x128)');

    // Generate screenshots
    console.log('\nGenerating screenshots...');
    await generateScreenshot('screenshot-1280x800.png', 1280, 800);
    console.log('  ✓ screenshot-1280x800.png (1280x800)');
    
    await generateScreenshot('screenshot-640x400.png', 640, 400);
    console.log('  ✓ screenshot-640x400.png (640x400)');

    // Generate promo tiles
    console.log('\nGenerating promo tiles...');
    await generatePromoSmall('promo-small-440x280.png');
    console.log('  ✓ promo-small-440x280.png (440x280)');
    
    await generatePromoMarquee('promo-marquee-1400x560.png');
    console.log('  ✓ promo-marquee-1400x560.png (1400x560)');

    console.log('\n✅ All assets generated successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Asset generation failed:', error.message);
    return false;
  }
}

/**
 * Create ZIP file with extension
 */
async function createExtensionZip() {
  return new Promise((resolve, reject) => {
    console.log('📦 Creating extension ZIP file...\n');

    const output = fs.createWriteStream(OUTPUT_ZIP);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Extension packaged successfully!`);
      console.log(`   File: ${OUTPUT_ZIP}`);
      console.log(`   Size: ${sizeInMB} MB\n`);
      resolve();
    });

    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    // Files to include in ZIP
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

    // Add files from root
    filesToInclude.forEach((file) => {
      const filePath = path.join(EXTENSION_DIR, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    // Add all assets
    if (fs.existsSync(ASSETS_DIR)) {
      archive.directory(ASSETS_DIR, 'assets');
    }

    archive.finalize();
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   MicroFocus Zones - Asset Generator & Packager');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Generate all assets
    const assetsGenerated = await generateAllAssets();
    if (!assetsGenerated) {
      process.exit(1);
    }

    // Create ZIP file
    await createExtensionZip();

    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ All tasks completed successfully!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run
main();
