import type { APIRoute } from 'astro';

// Paper sizes in inches
const PAPER_SIZES = {
  letter: { width: 8.5, height: 11 },
  a4: { width: 210 / 25.4, height: 297 / 25.4 }, // A4 in inches
};

const MARGIN = 0.25; // inches
const FOOTER_BAND = 0.25; // inches
const PREVIEW_SIZE = 3; // inches for preview mode

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
  const previewParam = url.searchParams.get('preview') || '0';
  
  const stsInput = parseFloat(stsParam) || 24;  // Default: 24 stitches over 4"
  const rowsInput = parseFloat(rowsParam) || 32; // Default: 32 rows over 4"
  const boldEvery = parseInt(boldEveryParam) || 10;
  const showGuides = guidesParam === '1';
  const isPreview = previewParam === '1';
  
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
  
  // Calculate cell dimensions in inches (true-scale)
  const cellW = 1 / stsPerIn;
  const cellH = 1 / rowsPerIn;
  
  // Bold pattern dimensions
  const boldW = cellW * boldEvery;
  const boldH = cellH * boldEvery;
  
  let svg: string;
  
  if (isPreview) {
    // Preview mode: 3in x 3in cropped grid, no margins, no footer
    const previewGridW = PREVIEW_SIZE;
    const previewGridH = PREVIEW_SIZE;
    const previewNumCols = Math.floor(previewGridW / cellW);
    const previewNumRows = Math.floor(previewGridH / cellH);
    const actualGridW = previewNumCols * cellW;
    const actualGridH = previewNumRows * cellH;
    
    svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${PREVIEW_SIZE}in" 
     height="${PREVIEW_SIZE}in" 
     viewBox="0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}">
  <rect width="100%" height="100%" fill="white"/>
  
  <defs>
    <style>
      .light-line { stroke: #d0d0d0; stroke-width: 0.005; fill: none; }
      .bold-line { stroke: #808080; stroke-width: 0.01; fill: none; }
      .guide-line { stroke: #b0b0b0; stroke-width: 0.012; fill: none; stroke-dasharray: 0.03 0.015; }
    </style>
    
    <!-- Light grid pattern: one stitch x one row cell -->
    <pattern id="lightGrid" 
             patternUnits="userSpaceOnUse" 
             width="${cellW}" 
             height="${cellH}"
             x="0"
             y="0">
      <line x1="0" y1="0" x2="0" y2="${cellH}" class="light-line"/>
      <line x1="0" y1="0" x2="${cellW}" y2="0" class="light-line"/>
    </pattern>
    
    <!-- Bold grid pattern: boldEvery cells, filled with light grid -->
    <pattern id="boldGrid" 
             patternUnits="userSpaceOnUse" 
             width="${boldW}" 
             height="${boldH}"
             x="0"
             y="0">
      <!-- Fill with light grid first -->
      <rect width="${boldW}" height="${boldH}" fill="url(#lightGrid)"/>
      <!-- Bold lines at origin -->
      <line x1="0" y1="0" x2="0" y2="${boldH}" class="bold-line"/>
      <line x1="0" y1="0" x2="${boldW}" y2="0" class="bold-line"/>
    </pattern>
  </defs>
  
  <!-- Grid rendered as single rectangle with pattern fill -->
  <rect 
    x="0" 
    y="0" 
    width="${actualGridW}" 
    height="${actualGridH}" 
    fill="url(#boldGrid)" 
    shape-rendering="crispEdges"
  />
  
  <!-- Border lines for right and bottom edges -->
  <line x1="${actualGridW}" y1="0" x2="${actualGridW}" y2="${actualGridH}" class="bold-line" shape-rendering="crispEdges"/>
  <line x1="0" y1="${actualGridH}" x2="${actualGridW}" y2="${actualGridH}" class="bold-line" shape-rendering="crispEdges"/>
`;

    // Draw reference guides if enabled (in preview)
    if (showGuides) {
      svg += `\n  <!-- Reference guides -->\n  <g id="guides">\n`;
      
      let guideIntervalCols: number;
      let guideIntervalRows: number;
      
      if (unit === 'cm') {
        guideIntervalCols = Math.round(stsPerIn * (5 / 2.54));
        guideIntervalRows = Math.round(rowsPerIn * (5 / 2.54));
      } else {
        guideIntervalCols = Math.round(stsPerIn);
        guideIntervalRows = Math.round(rowsPerIn);
      }
      
      if (guideIntervalCols > 0) {
        for (let col = guideIntervalCols; col <= previewNumCols; col += guideIntervalCols) {
          const x = col * cellW;
          svg += `    <line x1="${x}" y1="0" x2="${x}" y2="${actualGridH}" class="guide-line"/>\n`;
        }
      }
      
      if (guideIntervalRows > 0) {
        for (let row = guideIntervalRows; row <= previewNumRows; row += guideIntervalRows) {
          const y = row * cellH;
          svg += `    <line x1="0" y1="${y}" x2="${actualGridW}" y2="${y}" class="guide-line"/>\n`;
        }
      }
      
      svg += `  </g>\n`;
    }

    svg += `</svg>`;
  } else {
    // Full page mode: Letter/A4 with margins and footer
    const paperSize = PAPER_SIZES[paper as keyof typeof PAPER_SIZES] || PAPER_SIZES.letter;
    let pageWidth = paperSize.width;
    let pageHeight = paperSize.height;
    
    if (orientation === 'landscape') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }
    
    const drawableWidth = pageWidth - (2 * MARGIN);
    const drawableHeight = pageHeight - (2 * MARGIN) - FOOTER_BAND;
    
    const numCols = Math.floor(drawableWidth / cellW);
    const numRows = Math.floor(drawableHeight / cellH);
    
    const gridW = numCols * cellW;
    const gridH = numRows * cellH;
    
    const gridX = MARGIN;
    const gridY = MARGIN;
    
    svg = `<?xml version="1.0" encoding="UTF-8"?>
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
        guideIntervalCols = Math.round(stsPerIn * (5 / 2.54));
        guideIntervalRows = Math.round(rowsPerIn * (5 / 2.54));
      } else {
        guideIntervalCols = Math.round(stsPerIn);
        guideIntervalRows = Math.round(rowsPerIn);
      }
      
      if (guideIntervalCols > 0) {
        for (let col = guideIntervalCols; col <= numCols; col += guideIntervalCols) {
          const x = gridX + (col * cellW);
          svg += `    <line x1="${x}" y1="${gridY}" x2="${x}" y2="${gridY + gridH}" class="guide-line"/>\n`;
        }
      }
      
      if (guideIntervalRows > 0) {
        for (let row = guideIntervalRows; row <= numRows; row += guideIntervalRows) {
          const y = gridY + (row * cellH);
          svg += `    <line x1="${gridX}" y1="${y}" x2="${gridX + gridW}" y2="${y}" class="guide-line"/>\n`;
        }
      }
      
      svg += `  </g>\n`;
    }
    
    // Footer attribution (only in full mode)
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
  }
  
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
