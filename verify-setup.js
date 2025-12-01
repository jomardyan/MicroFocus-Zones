#!/usr/bin/env node

/**
 * Verification script - Check if environment is ready for asset generation
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 MicroFocus Zones - Setup Verification\n');
console.log('═'.repeat(50));

let passed = 0;
let failed = 0;

// Check 1: Node.js version
console.log('\n✓ Checking Node.js...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 14) {
  console.log(`  ✅ Node.js ${nodeVersion} (Required: 14+)`);
  passed++;
} else {
  console.log(`  ❌ Node.js ${nodeVersion} (Required: 14+)`);
  failed++;
}

// Check 2: npm
console.log('\n✓ Checking npm...');
const { execSync } = require('child_process');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  console.log(`  ✅ npm ${npmVersion} installed`);
  passed++;
} catch (e) {
  console.log('  ❌ npm not found');
  failed++;
}

// Check 3: Required files
console.log('\n✓ Checking required files...');
const requiredFiles = [
  'generate-assets.js',
  'package.json',
  'manifest.json',
  'background.js',
  'sidepanel.html',
  'sidepanel.js'
];

requiredFiles.forEach((file) => {
  const exists = fs.existsSync(path.join(__dirname, file));
  if (exists) {
    console.log(`  ✅ ${file}`);
    passed++;
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    failed++;
  }
});

// Check 4: node_modules (optional)
console.log('\n✓ Checking dependencies...');
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
if (nodeModulesExists) {
  const hasArchiver = fs.existsSync(path.join(__dirname, 'node_modules/archiver'));
  const hasCanvas = fs.existsSync(path.join(__dirname, 'node_modules/canvas'));
  
  if (hasArchiver && hasCanvas) {
    console.log('  ✅ Dependencies installed (archiver, canvas)');
    passed++;
  } else {
    console.log('  ⚠️  node_modules exists but missing packages');
    console.log('     Run: npm install');
  }
} else {
  console.log('  ⚠️  Dependencies not installed yet');
  console.log('     Run: npm install');
}

// Check 5: assets folder
console.log('\n✓ Checking assets folder...');
const assetsDir = path.join(__dirname, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  console.log(`  ℹ️  assets/ exists with ${files.length} files`);
} else {
  console.log('  ℹ️  assets/ not created yet (normal before first run)');
}

// Summary
console.log('\n' + '═'.repeat(50));
console.log(`\n📊 Summary: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ Environment is ready!\n');
  console.log('Next steps:');
  
  if (!nodeModulesExists) {
    console.log('1. npm install');
    console.log('2. npm run generate-assets\n');
  } else {
    console.log('1. npm run generate-assets\n');
  }
  
  process.exit(0);
} else {
  console.log('❌ Setup incomplete. Fix errors above and try again.\n');
  process.exit(1);
}
