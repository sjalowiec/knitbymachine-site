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
  <svg x="${gridX}" y="${footerY - 0.12}" width="0.15" height="0.15" viewBox="0 0 1261.3 1127.23">
    <path fill="#52682d" d="M880.83,0h-500.36c-46.55,0-89.56,24.83-112.83,65.14L17.46,498.47c-23.27,40.31-23.27,89.98,0,130.29l250.18,433.33c23.27,40.31,66.28,65.14,112.83,65.14h500.36c46.55,0,89.56-24.83,112.83-65.14l250.18-433.33c23.27-40.31,23.27-89.98,0-130.29l-250.18-433.33C970.39,24.83,927.38,0,880.83,0Z"/>
    <path fill="#52682d" stroke="#fff" stroke-width="26.42" d="M855.81,56.36h-450.33c-41.89,0-80.6,22.35-101.55,58.63L78.77,504.98c-20.95,36.28-20.95,80.98,0,117.26l225.16,389.99c20.95,36.28,59.66,58.63,101.55,58.63h450.33c41.89,0,80.6-22.35,101.55-58.63l225.16-389.99c20.95-36.28,20.95-80.98,0-117.26l-225.16-389.99c-20.95-36.28-59.66-58.63-101.55-58.63Z"/>
    <g fill="none" stroke="#fff" stroke-linecap="round" stroke-miterlimit="10" stroke-width="27">
      <path d="M514.72,698.52c-70.17,51.7-45.55,195.73-45.55,195.73"/>
      <path d="M469.8,585.52c75.7,56.37,59.7,148.7,57.24,308.72"/>
      <path d="M506.11,633.28c-125.56,32.01-97.25,260.97-97.25,260.97"/>
      <path d="M464.25,579.12c-155.1,97.25-110.79,315.13-110.79,315.13"/>
      <line x1="332.74" y1="194.64" x2="330.08" y2="612.35"/>
      <line x1="753.04" y1="190.21" x2="498.72" y2="475.71"/>
      <path d="M828.13,193.9s-307.25,356.9-368.8,390.14"/>
      <line x1="920.46" y1="196.36" x2="566.42" y2="586.5"/>
      <line x1="977.57" y1="899.17" x2="672.96" y2="505.38"/>
      <path d="M392.55,194.64s-4.02,240.44-1.24,308.15-37.84,86.17-37.84,86.17"/>
      <path d="M449.79,194.64s2.64,155.55,1.78,250.32-48.87,96-48.87,96"/>
      <path d="M510.01,194.64s4.72,180.13-6.36,256.45c-13,89.59-148.95,112.02-183.42,194.49-34.47,82.48-25.85,248.66-25.85,248.66"/>
      <line x1="903.71" y1="899.17" x2="626.18" y2="555.85"/>
      <line x1="821.24" y1="899.17" x2="572.58" y2="591.43"/>
    </g>
  </svg>
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
