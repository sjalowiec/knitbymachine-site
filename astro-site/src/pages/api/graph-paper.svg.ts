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
  const stsParam = url.searchParams.get('sts') || '6';
  const rowsParam = url.searchParams.get('rows') || '8';
  const unit = url.searchParams.get('unit') || 'in';
  const paper = url.searchParams.get('paper') || 'letter';
  const orientation = url.searchParams.get('orientation') || 'portrait';
  const boldEveryParam = url.searchParams.get('boldEvery') || '10';
  const guidesParam = url.searchParams.get('guides') || '1';
  
  const sts = parseFloat(stsParam) || 6;
  const rows = parseFloat(rowsParam) || 8;
  const boldEvery = parseInt(boldEveryParam) || 10;
  const showGuides = guidesParam === '1';
  
  // Validate inputs
  if (sts <= 0 || rows <= 0) {
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
  
  // Calculate cell dimensions based on unit
  let cellWidth: number;
  let cellHeight: number;
  
  if (unit === 'cm') {
    // Input is stitches/rows per cm, convert to inches
    cellWidth = 1 / sts / 2.54; // cm to inches
    cellHeight = 1 / rows / 2.54;
  } else {
    // Input is stitches/rows per inch
    cellWidth = 1 / sts;
    cellHeight = 1 / rows;
  }
  
  // Calculate drawable area
  const drawableWidth = pageWidth - (2 * MARGIN);
  const drawableHeight = pageHeight - (2 * MARGIN) - FOOTER_BAND;
  
  // Calculate number of cells that fit
  const numCols = Math.floor(drawableWidth / cellWidth);
  const numRows = Math.floor(drawableHeight / cellHeight);
  
  // Calculate actual grid dimensions
  const gridWidth = numCols * cellWidth;
  const gridHeight = numRows * cellHeight;
  
  // Grid starting position (left margin)
  const gridX = MARGIN;
  const gridY = MARGIN;
  
  // Build SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${pageWidth}in" 
     height="${pageHeight}in" 
     viewBox="0 0 ${pageWidth} ${pageHeight}">
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Grid definitions -->
  <defs>
    <style>
      .light-line { stroke: #d0d0d0; stroke-width: 0.003in; fill: none; }
      .bold-line { stroke: #808080; stroke-width: 0.008in; fill: none; }
      .guide-line { stroke: #b0b0b0; stroke-width: 0.012in; fill: none; stroke-dasharray: 0.03 0.015; }
      .footer-text { 
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        font-size: 7pt;
        fill: currentColor;
        opacity: 0.45;
        text-rendering: geometricPrecision;
      }
    </style>
  </defs>
  
  <!-- Grid group -->
  <g id="grid">
`;

  // Draw vertical lines
  for (let col = 0; col <= numCols; col++) {
    const x = gridX + (col * cellWidth);
    const isBold = col % boldEvery === 0;
    const lineClass = isBold ? 'bold-line' : 'light-line';
    svg += `    <line x1="${x}" y1="${gridY}" x2="${x}" y2="${gridY + gridHeight}" class="${lineClass}"/>\n`;
  }
  
  // Draw horizontal lines
  for (let row = 0; row <= numRows; row++) {
    const y = gridY + (row * cellHeight);
    const isBold = row % boldEvery === 0;
    const lineClass = isBold ? 'bold-line' : 'light-line';
    svg += `    <line x1="${gridX}" y1="${y}" x2="${gridX + gridWidth}" y2="${y}" class="${lineClass}"/>\n`;
  }
  
  svg += `  </g>\n`;
  
  // Draw reference guides if enabled
  if (showGuides) {
    svg += `\n  <!-- Reference guides -->\n  <g id="guides">\n`;
    
    let guideIntervalCols: number;
    let guideIntervalRows: number;
    
    if (unit === 'cm') {
      // Show 5cm guides: stitches * 5 cells horizontally, rows * 5 cells vertically
      guideIntervalCols = Math.round(sts * 5);
      guideIntervalRows = Math.round(rows * 5);
    } else {
      // Show 1-inch guides: stitches cells horizontally, rows cells vertically
      guideIntervalCols = Math.round(sts);
      guideIntervalRows = Math.round(rows);
    }
    
    // Draw vertical guide lines
    if (guideIntervalCols > 0) {
      for (let col = guideIntervalCols; col <= numCols; col += guideIntervalCols) {
        const x = gridX + (col * cellWidth);
        svg += `    <line x1="${x}" y1="${gridY}" x2="${x}" y2="${gridY + gridHeight}" class="guide-line"/>\n`;
      }
    }
    
    // Draw horizontal guide lines
    if (guideIntervalRows > 0) {
      for (let row = guideIntervalRows; row <= numRows; row += guideIntervalRows) {
        const y = gridY + (row * cellHeight);
        svg += `    <line x1="${gridX}" y1="${y}" x2="${gridX + gridWidth}" y2="${y}" class="guide-line"/>\n`;
      }
    }
    
    svg += `  </g>\n`;
  }
  
  // Footer attribution
  const footerY = pageHeight - MARGIN - (FOOTER_BAND * 0.35);
  svg += `
  <!-- Footer attribution -->
  <text x="${gridX}" y="${footerY}" class="footer-text">
    Created with the Knit by Machine Graph Paper Tool
  </text>
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
