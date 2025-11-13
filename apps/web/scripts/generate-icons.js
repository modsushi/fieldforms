#!/usr/bin/env node

/**
 * Simple icon generator for PWA
 *
 * This creates simple placeholder icons with the app name.
 * Replace these with professionally designed icons for production.
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate SVG icons for each size
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#3b82f6"/>

  <!-- Border -->
  <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.9}" height="${size * 0.9}"
        fill="none" stroke="#60a5fa" stroke-width="${size * 0.02}" rx="${size * 0.1}"/>

  <!-- Icon: Clipboard with checkmark -->
  <g transform="translate(${size * 0.3}, ${size * 0.2})">
    <!-- Clipboard -->
    <rect x="0" y="${size * 0.05}" width="${size * 0.4}" height="${size * 0.5}"
          fill="none" stroke="#ffffff" stroke-width="${size * 0.02}" rx="${size * 0.02}"/>

    <!-- Clip -->
    <rect x="${size * 0.12}" y="0" width="${size * 0.16}" height="${size * 0.08}"
          fill="#ffffff" stroke="#60a5fa" stroke-width="${size * 0.01}" rx="${size * 0.02}"/>

    <!-- Checkmark -->
    <path d="M ${size * 0.08} ${size * 0.25} L ${size * 0.16} ${size * 0.35} L ${size * 0.32} ${size * 0.18}"
          fill="none" stroke="#10b981" stroke-width="${size * 0.03}" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Lines (form fields) -->
    <line x1="${size * 0.06}" y1="${size * 0.42}" x2="${size * 0.34}" y2="${size * 0.42}"
          stroke="#60a5fa" stroke-width="${size * 0.015}" stroke-linecap="round"/>
    <line x1="${size * 0.06}" y1="${size * 0.48}" x2="${size * 0.28}" y2="${size * 0.48}"
          stroke="#60a5fa" stroke-width="${size * 0.015}" stroke-linecap="round"/>
  </g>

  <!-- Text -->
  <text x="${size / 2}" y="${size * 0.88}"
        font-family="Arial, sans-serif"
        font-size="${size * 0.12}"
        font-weight="bold"
        fill="#ffffff"
        text-anchor="middle">FF</text>
</svg>`;

  const filename = `icon-${size}x${size}.png.svg`;
  fs.writeFileSync(path.join(outputDir, filename), svg);
  console.log(`Generated ${filename}`);
});

console.log('\n✅ Icon placeholders generated!');
console.log('\n⚠️  NOTE: These are SVG placeholders named as .png.svg files.');
console.log('For production, you should:');
console.log('1. Design proper app icons (or use a design tool)');
console.log('2. Convert them to actual PNG files');
console.log('3. Replace these placeholder files\n');
console.log('Recommended tools:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://www.pwabuilder.com/imageGenerator\n');
