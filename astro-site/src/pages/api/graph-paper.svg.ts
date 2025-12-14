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
  const orientation = url.searchParams.get('orientation') || 'portrait';
  const boldEveryParam = url.searchParams.get('boldEvery') || '10';
  const guidesParam = url.searchParams.get('guides') || '1';
  
  const stsInput = parseFloat(stsParam) || 24;  // Default: 24 stitches over 4"
  const rowsInput = parseFloat(rowsParam) || 32; // Default: 32 rows over 4"
  const boldEvery = parseInt(boldEveryParam) || 10;
  const showGuides = guidesParam === '1';
  
  // Validate inputs
  if (stsInput <= 0 || rowsInput <= 0) {
    return new Response('Invalid gauge values', { status: 400 });
  }
  
  // Convert gauge inputs to per-inch values
  // Inputs are always "over 4 inches" (unit=in) or "over 10 cm" (unit=cm)
  let stsPerIn: number;
  let rowsPerIn: number;
  
  if (unit === 'cm') {
    // Input is stitches/rows over 10 cm
    const stsPerCm = stsInput / 10;
    const rowsPerCm = rowsInput / 10;
    // Convert to per-inch
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
  
  // Get paper dimensions
  const paperSize = PAPER_SIZES[paper as keyof typeof PAPER_SIZES] || PAPER_SIZES.letter;
  let pageWidth = paperSize.width;
  let pageHeight = paperSize.height;
  
  // Apply orientation
  if (orientation === 'landscape') {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  
  // Calculate cell dimensions in inches (true-scale)
  const cellW = 1 / stsPerIn;
  const cellH = 1 / rowsPerIn;
  
  // Calculate drawable area
  const drawableWidth = pageWidth - (2 * MARGIN);
  const drawableHeight = pageHeight - (2 * MARGIN) - FOOTER_BAND;
  
  // Calculate number of cells that fit
  const numCols = Math.floor(drawableWidth / cellW);
  const numRows = Math.floor(drawableHeight / cellH);
  
  // Calculate actual grid dimensions
  const gridW = numCols * cellW;
  const gridH = numRows * cellH;
  
  // Grid starting position (left margin)
  const gridX = MARGIN;
  const gridY = MARGIN;
  
  // Bold pattern dimensions
  const boldW = cellW * boldEvery;
  const boldH = cellH * boldEvery;
  
  // Build SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${pageWidth}in" 
     height="${pageHeight}in" 
     viewBox="0 0 ${pageWidth} ${pageHeight}">
  <rect width="100%" height="100%" fill="white"/>
  
  <defs>
    <style>
      .light-line { stroke: #d0d0d0; stroke-width: 0.005; fill: none; }
      .bold-line { stroke: #808080; stroke-width: 0.01; fill: none; }
      .guide-line { stroke: #b0b0b0; stroke-width: 0.012; fill: none; stroke-dasharray: 0.03 0.015; }
      /* footer-text styles are applied inline on the element */
    </style>
    
    <!-- Light grid pattern: one stitch x one row cell -->
    <pattern id="lightGrid" 
             patternUnits="userSpaceOnUse" 
             width="${cellW}" 
             height="${cellH}"
             x="${gridX}"
             y="${gridY}">
      <line x1="0" y1="0" x2="0" y2="${cellH}" class="light-line"/>
      <line x1="0" y1="0" x2="${cellW}" y2="0" class="light-line"/>
    </pattern>
    
    <!-- Bold grid pattern: boldEvery cells, filled with light grid -->
    <pattern id="boldGrid" 
             patternUnits="userSpaceOnUse" 
             width="${boldW}" 
             height="${boldH}"
             x="${gridX}"
             y="${gridY}">
      <!-- Fill with light grid first -->
      <rect width="${boldW}" height="${boldH}" fill="url(#lightGrid)"/>
      <!-- Bold lines at origin -->
      <line x1="0" y1="0" x2="0" y2="${boldH}" class="bold-line"/>
      <line x1="0" y1="0" x2="${boldW}" y2="0" class="bold-line"/>
    </pattern>
  </defs>
  
  <!-- Grid rendered as single rectangle with pattern fill -->
  <rect 
    x="${gridX}" 
    y="${gridY}" 
    width="${gridW}" 
    height="${gridH}" 
    fill="url(#boldGrid)" 
    shape-rendering="crispEdges"
  />
  
  <!-- Border lines for right and bottom edges -->
  <line x1="${gridX + gridW}" y1="${gridY}" x2="${gridX + gridW}" y2="${gridY + gridH}" class="bold-line" shape-rendering="crispEdges"/>
  <line x1="${gridX}" y1="${gridY + gridH}" x2="${gridX + gridW}" y2="${gridY + gridH}" class="bold-line" shape-rendering="crispEdges"/>
`;

  // Draw reference guides if enabled
  if (showGuides) {
    svg += `\n  <!-- Reference guides -->\n  <g id="guides">\n`;
    
    let guideIntervalCols: number;
    let guideIntervalRows: number;
    
    if (unit === 'cm') {
      // Show 5cm guides: use per-inch values converted to cells for 5cm
      // 5cm = 5/2.54 inches ≈ 1.97 inches worth of cells
      guideIntervalCols = Math.round(stsPerIn * (5 / 2.54));
      guideIntervalRows = Math.round(rowsPerIn * (5 / 2.54));
    } else {
      // Show 1-inch guides: stitches per inch cells horizontally, rows per inch cells vertically
      guideIntervalCols = Math.round(stsPerIn);
      guideIntervalRows = Math.round(rowsPerIn);
    }
    
    // Draw vertical guide lines
    if (guideIntervalCols > 0) {
      for (let col = guideIntervalCols; col <= numCols; col += guideIntervalCols) {
        const x = gridX + (col * cellW);
        svg += `    <line x1="${x}" y1="${gridY}" x2="${x}" y2="${gridY + gridH}" class="guide-line"/>\n`;
      }
    }
    
    // Draw horizontal guide lines
    if (guideIntervalRows > 0) {
      for (let row = guideIntervalRows; row <= numRows; row += guideIntervalRows) {
        const y = gridY + (row * cellH);
        svg += `    <line x1="${gridX}" y1="${y}" x2="${gridX + gridW}" y2="${y}" class="guide-line"/>\n`;
      }
    }
    
    svg += `  </g>\n`;
  }
  
  // Footer attribution
  const footerY = pageHeight - MARGIN - (FOOTER_BAND * 0.35);
  svg += `
  <!-- Footer attribution -->
  <text
    x="${gridX}"
    y="${footerY}"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    font-size="7pt"
    opacity="0.45"
    fill="currentColor"
    text-rendering="geometricPrecision"
  >Created with the Knit by Machine Graph Paper Tool</text>
`;
  
  svg += `</svg>`;
  
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
