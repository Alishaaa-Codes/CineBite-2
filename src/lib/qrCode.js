// High-performance, 100% ISO/IEC 18004 compliant QR Code generator
// Built on Project Nayuki QR Code library - rock solid & verified

import { QrCode } from './qrcodegen.js';

export { QrCode };

/**
 * Returns matrix of modules (boolean[][])
 * @param {string} text - text or URL to encode
 * @param {'L'|'M'|'Q'|'H'} errorCorrectionLevel
 */
export function generateQRMatrix(text, errorCorrectionLevel = 'M') {
  let ecl = QrCode.Ecc.MEDIUM;
  if (errorCorrectionLevel === 'L') ecl = QrCode.Ecc.LOW;
  if (errorCorrectionLevel === 'Q') ecl = QrCode.Ecc.QUARTILE;
  if (errorCorrectionLevel === 'H') ecl = QrCode.Ecc.HIGH;

  // encode with boostEcl: true so error correction is maximized without increasing version size
  const qr = QrCode.encodeText(text, ecl);
  const count = qr.size;
  const matrix = [];

  for (let r = 0; r < count; r++) {
    const row = [];
    for (let c = 0; c < count; c++) {
      row.push(qr.getModule(c, r)); // c is x (col), r is y (row)
    }
    matrix.push(row);
  }

  return { matrix, count, qr };
}

/**
 * Returns raw SVG string
 */
export function generateQRSvg(text, options = {}) {
  const {
    size = 280,
    margin = 4,
    darkColor = '#000000',
    lightColor = '#FFFFFF',
    ecl = 'M'
  } = options;

  const { matrix, count } = generateQRMatrix(text, ecl);
  const totalCells = count + margin * 2;
  const cellSize = size / totalCells;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${darkColor}" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="${lightColor}" rx="12" />
      ${rects}
    </svg>
  `.trim();
}
