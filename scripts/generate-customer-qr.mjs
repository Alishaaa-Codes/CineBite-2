import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { generateQRMatrix } from '../src/lib/qrCode.js';

// The universal customer dining website URL (works on any phone connected to the Wi-Fi)
const TARGET_URL = 'http://192.168.29.91:5173/';

console.log(`Generating universal customer QR code for: ${TARGET_URL}`);

const { matrix, count } = generateQRMatrix(TARGET_URL, 'M');

// Calculate cell geometry
const qrBoxSize = 560; // Size of white square
const marginModules = 4;
const totalCells = count + marginModules * 2;
const cellSize = qrBoxSize / totalCells;

let qrRects = '';
for (let r = 0; r < count; r++) {
  for (let c = 0; c < count; c++) {
    if (matrix[r][c]) {
      const x = (c + marginModules) * cellSize;
      const y = (r + marginModules) * cellSize;
      qrRects += `      <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#000000" />\n`;
    }
  }
}

// Complete Cinema Standee SVG (800 x 1060 px)
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1060" width="800" height="1060">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07080C" />
      <stop offset="50%" stop-color="#10121A" />
      <stop offset="100%" stop-color="#040507" />
    </linearGradient>

    <radialGradient id="redGlow" cx="50%" cy="15%" r="60%">
      <stop offset="0%" stop-color="#E50914" stop-opacity="0.32" />
      <stop offset="100%" stop-color="#E50914" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="goldGlow" cx="50%" cy="85%" r="50%">
      <stop offset="0%" stop-color="#FF9F1C" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#FF9F1C" stop-opacity="0" />
    </radialGradient>

    <!-- Card Gradient -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141722" />
      <stop offset="100%" stop-color="#0B0D14" />
    </linearGradient>

    <!-- Red Ribbon Gradient -->
    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E50914" />
      <stop offset="50%" stop-color="#FF3B30" />
      <stop offset="100%" stop-color="#E50914" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.8" />
    </filter>

    <filter id="qrShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Base Canvas Background -->
  <rect width="800" height="1060" fill="url(#bgGrad)" />
  <rect width="800" height="1060" fill="url(#redGlow)" />
  <rect width="800" height="1060" fill="url(#goldGlow)" />

  <!-- Outer Cinema Border Accent -->
  <rect x="24" y="24" width="752" height="1012" rx="24" fill="none" stroke="#E50914" stroke-width="2" stroke-opacity="0.4" />
  <rect x="30" y="30" width="740" height="1000" rx="20" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.08" />

  <!-- Main Acrylic Cinema Card -->
  <g filter="url(#cardShadow)">
    <rect x="50" y="50" width="700" height="960" rx="20" fill="url(#cardGrad)" stroke="#E50914" stroke-width="2.5" />
  </g>

  <!-- Top Cinema Header -->
  <g transform="translate(400, 115)">
    <!-- Popcorn Icon Graphic -->
    <circle cx="0" cy="-28" r="30" fill="#E50914" stroke="#FFFFFF" stroke-width="2" />
    <text x="0" y="-18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" text-anchor="middle" fill="#FFFFFF">🍿</text>

    <!-- Brand Logo (White CINE + Red BITE + Gold TM) -->
    <g transform="translate(0, 32)">
      <text x="-3" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Impact', Arial, sans-serif" font-size="46" font-weight="900" text-anchor="end" fill="#FFFFFF">CINE</text>
      <text x="1" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Impact', Arial, sans-serif" font-size="46" font-weight="900" text-anchor="start" fill="#E50914">BITE</text>
      <text x="106" y="-16" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="18" font-weight="800" fill="#FF9F1C">™</text>
    </g>

    <!-- Tagline -->
    <text x="0" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" letter-spacing="3" fill="#FF9F1C" text-anchor="middle">
      IN-SEAT CINEMA DINING
    </text>
  </g>

  <!-- The White QR Box (Centered) -->
  <g transform="translate(120, 235)" filter="url(#qrShadow)">
    <!-- White Card Background (Clean 4-module quiet zone) -->
    <rect width="${qrBoxSize}" height="${qrBoxSize}" rx="16" fill="#FFFFFF" />

    <!-- Pure Black QR Matrix -->
${qrRects}
  </g>

  <!-- Instructions Section -->
  <g transform="translate(400, 840)">
    <!-- Primary CTA Ribbon -->
    <rect x="-240" y="0" width="480" height="44" rx="22" fill="url(#ribbonGrad)" />
    <text x="0" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="900" letter-spacing="1" fill="#FFFFFF" text-anchor="middle">
      SCAN TO ORDER FROM YOUR PHONE
    </text>

    <!-- Sub-instructions -->
    <text x="0" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#E2E8F0" text-anchor="middle">
      Point any Phone Camera (iPhone / Android) at this QR Code
    </text>

    <text x="0" y="96" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#A0A5B5" text-anchor="middle">
      No app required • Opens directly in Safari / Chrome • Delivered to your seat
    </text>

    <!-- Wi-Fi URL Badge -->
    <g transform="translate(0, 122)">
      <rect x="-190" y="0" width="380" height="28" rx="6" fill="#1A1E29" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.15" />
      <text x="0" y="18" font-family="monospace" font-size="12" font-weight="700" fill="#FF9F1C" text-anchor="middle">
        Wi-Fi Link: ${TARGET_URL}
      </text>
    </g>
  </g>
</svg>
`.trim();

// Target Paths
const artifactDir = '/Users/alishaanjum/.gemini/antigravity/brain/802f035e-186c-49f2-996d-3ac6f7bd75c8';
const publicDir = '/Users/alishaanjum/Desktop/Nischay/CineBite/public/images';
const workspaceDir = '/Users/alishaanjum/Desktop/Nischay/CineBite';

const svgArtifactPath = path.join(artifactDir, 'cinebite_customer_dining_qr.svg');
const pngArtifactPath = path.join(artifactDir, 'cinebite_customer_dining_qr.png');

const svgPublicPath = path.join(publicDir, 'cinebite_customer_dining_qr.svg');
const pngPublicPath = path.join(publicDir, 'cinebite_customer_dining_qr.png');

const pngWorkspacePath = path.join(workspaceDir, 'cinebite_customer_dining_qr.png');

// 1. Write SVGs
fs.writeFileSync(svgArtifactPath, svg, 'utf8');
fs.writeFileSync(svgPublicPath, svg, 'utf8');
console.log(`Saved SVG to ${svgArtifactPath}`);

// 2. Convert to high-resolution PNG using macOS native sips
try {
  execSync(`sips -s format png "${svgArtifactPath}" --out "${pngArtifactPath}"`);
  fs.copyFileSync(pngArtifactPath, pngPublicPath);
  fs.copyFileSync(pngArtifactPath, pngWorkspacePath);
  console.log(`Successfully generated Standee PNG at: ${pngArtifactPath}`);

  // 3. Also generate pure, standalone square QR code (600x600 px)
  const { generateQRSvg } = await import('../src/lib/qrCode.js');
  const pureSvg = generateQRSvg(TARGET_URL, { size: 600, margin: 4 });
  const pureSvgPath = path.join(artifactDir, 'cinebite_pure_qr.svg');
  const purePngPath = path.join(artifactDir, 'cinebite_pure_qr.png');
  fs.writeFileSync(pureSvgPath, pureSvg, 'utf8');
  execSync(`sips -s format png "${pureSvgPath}" --out "${purePngPath}"`);
  fs.copyFileSync(purePngPath, path.join(publicDir, 'cinebite_pure_qr.png'));
  fs.copyFileSync(purePngPath, path.join(workspaceDir, 'cinebite_pure_qr.png'));
  console.log(`Successfully generated Pure QR at: ${purePngPath}`);
} catch (err) {
  console.error('sips conversion error:', err);
}
