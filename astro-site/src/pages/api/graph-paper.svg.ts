import type { APIRoute } from 'astro';

// Paper sizes in inches
const PAPER_SIZES = {
  letter: { width: 8.5, height: 11 },
  a4: { width: 210 / 25.4, height: 297 / 25.4 }, // A4 in inches
};

const MARGIN = 0.25; // inches
const FOOTER_BAND = 0.25; // inches

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  
  // Parse query parameters
  const stsParam = url.searchParams.get('sts') || '24';
  const rowsParam = url.searchParams.get('rows') || '32';
  const unit = url.searchParams.get('unit') || 'in';
  const paper = url.searchParams.get('paper') || 'letter';
  
  const stsInput = Math.round(parseFloat(stsParam)) || 24;
  const rowsInput = Math.round(parseFloat(rowsParam)) || 32;
  
  // Validate inputs
  if (stsInput <= 0 || rowsInput <= 0) {
    return new Response('Invalid gauge values', { status: 400 });
  }
  
  // Convert gauge inputs to per-inch values
  let stsPerIn: number;
  let rowsPerIn: number;
  
  if (unit === 'cm') {
    // Input is stitches/rows over 10 cm
    const stsPerCm = stsInput / 10;
    const rowsPerCm = rowsInput / 10;
    stsPerIn = stsPerCm * 2.54;
    rowsPerIn = rowsPerCm * 2.54;
  } else {
    // Input is stitches/rows over 4 inches
    stsPerIn = stsInput / 4;
    rowsPerIn = rowsInput / 4;
  }
  
  // Validate converted values
  if (stsPerIn <= 0 || rowsPerIn <= 0) {
    return new Response('Invalid gauge values', { status: 400 });
  }
  
  // Calculate cell dimensions in inches
  const cellW = 1 / stsPerIn;
  const cellH = 1 / rowsPerIn;
  
  // Full page mode: Letter/A4 with margins and footer (always portrait)
  const paperSize = PAPER_SIZES[paper as keyof typeof PAPER_SIZES] || PAPER_SIZES.letter;
  const pageWidth = paperSize.width;
  const pageHeight = paperSize.height;
  
  const drawableWidth = pageWidth - (2 * MARGIN);
  const drawableHeight = pageHeight - (2 * MARGIN) - FOOTER_BAND;
  
  // Snap to whole inches for clean major grid
  const gridInchesW = Math.floor(drawableWidth);
  const gridInchesH = Math.floor(drawableHeight);
  const gridW = gridInchesW;
  const gridH = gridInchesH;
  
  const gridX = MARGIN;
  const gridY = MARGIN;
  
  // Build lines
  const minorLines: string[] = [];
  const majorLines: string[] = [];
  
  // Calculate total cells
  const totalCellsX = Math.round(gridW * stsPerIn);
  const totalCellsY = Math.round(gridH * rowsPerIn);
  
  // Vertical lines (minor gauge lines)
  for (let i = 0; i <= totalCellsX; i++) {
    const x = gridX + (i * cellW);
    const isMajor = Math.abs(i * cellW - Math.round(i * cellW)) < 0.001;
    if (isMajor && i > 0 && i < totalCellsX) {
      majorLines.push(`<line x1="${x}" y1="${gridY}" x2="${x}" y2="${gridY + gridH}" stroke="#000000" stroke-width="0.025"/>`);
    } else if (!isMajor) {
      minorLines.push(`<line x1="${x}" y1="${gridY}" x2="${x}" y2="${gridY + gridH}" stroke="#000000" stroke-width="0.015"/>`);
    }
  }
  
  // Horizontal lines (minor gauge lines)
  for (let i = 0; i <= totalCellsY; i++) {
    const y = gridY + (i * cellH);
    const isMajor = Math.abs(i * cellH - Math.round(i * cellH)) < 0.001;
    if (isMajor && i > 0 && i < totalCellsY) {
      majorLines.push(`<line x1="${gridX}" y1="${y}" x2="${gridX + gridW}" y2="${y}" stroke="#000000" stroke-width="0.025"/>`);
    } else if (!isMajor) {
      minorLines.push(`<line x1="${gridX}" y1="${y}" x2="${gridX + gridW}" y2="${y}" stroke="#000000" stroke-width="0.015"/>`);
    }
  }
  
  // Border lines
  const borderLines = [
    `<line x1="${gridX}" y1="${gridY}" x2="${gridX + gridW}" y2="${gridY}" stroke="#303030" stroke-width="0.02"/>`,
    `<line x1="${gridX}" y1="${gridY + gridH}" x2="${gridX + gridW}" y2="${gridY + gridH}" stroke="#303030" stroke-width="0.02"/>`,
    `<line x1="${gridX}" y1="${gridY}" x2="${gridX}" y2="${gridY + gridH}" stroke="#303030" stroke-width="0.02"/>`,
    `<line x1="${gridX + gridW}" y1="${gridY}" x2="${gridX + gridW}" y2="${gridY + gridH}" stroke="#303030" stroke-width="0.02"/>`,
  ];
  
  // Footer
  const footerY = pageHeight - MARGIN - (FOOTER_BAND * 0.35);
  const gaugeUnit = unit === 'cm' ? '10cm' : '4in';
  const footerText = `Gauge: ${stsInput} sts × ${rowsInput} rows per ${gaugeUnit} | Created with Knit by Machine`;
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${pageWidth}in" 
     height="${pageHeight}in" 
     viewBox="0 0 ${pageWidth} ${pageHeight}"
     shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Minor grid lines (gauge subdivisions) -->
  ${minorLines.join('\n  ')}
  
  <!-- Major grid lines (1-inch) -->
  ${majorLines.join('\n  ')}
  
  <!-- Border -->
  ${borderLines.join('\n  ')}
  
  <!-- Footer -->
  <image 
    href="/images/kbm_logo.svg" 
    x="${gridX}" 
    y="${footerY - 0.12}" 
    width="0.15" 
    height="0.15" 
    preserveAspectRatio="xMidYMid meet" 
  />
  <text
    x="${gridX + 0.2}"
    y="${footerY}"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    font-size="0.1"
    opacity="0.8"
    fill="#222"
  >${footerText}</text>
</svg>`;
  
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
