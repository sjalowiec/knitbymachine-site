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
  const previewParam = url.searchParams.get('preview') || '0';
  
  const stsInput = parseFloat(stsParam) || 24;  // Default: 24 stitches over 4"
  const rowsInput = parseFloat(rowsParam) || 32; // Default: 32 rows over 4"
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
  
  // Calculate minor cell dimensions in inches (gauge subdivisions)
  const cellW = 1 / stsPerIn;
  const cellH = 1 / rowsPerIn;
  
  // Major grid is always 1 inch × 1 inch
  const inchW = 1;
  const inchH = 1;
  
  let svg: string;
  
  if (isPreview) {
    // Preview mode: 3in x 3in cropped grid, no margins, no footer
    // Snap grid size to whole inches for clean major grid alignment
    const gridInchesW = Math.floor(PREVIEW_SIZE);
    const gridInchesH = Math.floor(PREVIEW_SIZE);
    const actualGridW = gridInchesW;
    const actualGridH = gridInchesH;
    
    svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${PREVIEW_SIZE}in" 
     height="${PREVIEW_SIZE}in" 
     viewBox="0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}"
     shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="white"/>
  
  <defs>
    <!-- Minor grid pattern: gauge subdivisions (1 stitch × 1 row) -->
    <pattern id="minorGrid" 
             patternUnits="userSpaceOnUse" 
             width="${cellW}" 
             height="${cellH}">
      <line x1="0" y1="0" x2="0" y2="${cellH}" stroke="#a0a0a0" stroke-width="0.008" fill="none"/>
      <line x1="0" y1="0" x2="${cellW}" y2="0" stroke="#a0a0a0" stroke-width="0.008" fill="none"/>
    </pattern>
    
    <!-- Major grid pattern: 1 inch × 1 inch squares -->
    <pattern id="inchGrid" 
             patternUnits="userSpaceOnUse" 
             width="${inchW}" 
             height="${inchH}">
      <line x1="0" y1="0" x2="0" y2="${inchH}" stroke="#303030" stroke-width="0.02" fill="none"/>
      <line x1="0" y1="0" x2="${inchW}" y2="0" stroke="#303030" stroke-width="0.02" fill="none"/>
    </pattern>
  </defs>
  
  <!-- Layer 1: Minor grid (gauge subdivisions) -->
  <rect 
    x="0" 
    y="0" 
    width="${actualGridW}" 
    height="${actualGridH}" 
    fill="url(#minorGrid)"
  />
  
  <!-- Layer 2: Major grid (1-inch squares) on top -->
  <rect 
    x="0" 
    y="0" 
    width="${actualGridW}" 
    height="${actualGridH}" 
    fill="url(#inchGrid)"
  />
  
  <!-- Border lines for right and bottom edges -->
  <line x1="${actualGridW}" y1="0" x2="${actualGridW}" y2="${actualGridH}" stroke="#303030" stroke-width="0.02" fill="none"/>
  <line x1="0" y1="${actualGridH}" x2="${actualGridW}" y2="${actualGridH}" stroke="#303030" stroke-width="0.02" fill="none"/>
</svg>`;
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
    
    // Snap to whole inches for clean major grid
    const gridInchesW = Math.floor(drawableWidth);
    const gridInchesH = Math.floor(drawableHeight);
    const gridW = gridInchesW;
    const gridH = gridInchesH;
    
    const gridX = MARGIN;
    const gridY = MARGIN;
    
    svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${pageWidth}in" 
     height="${pageHeight}in" 
     viewBox="0 0 ${pageWidth} ${pageHeight}"
     shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="white"/>
  
  <defs>
    <!-- Minor grid pattern: gauge subdivisions (1 stitch × 1 row) -->
    <pattern id="minorGrid" 
             patternUnits="userSpaceOnUse" 
             width="${cellW}" 
             height="${cellH}">
      <line x1="0" y1="0" x2="0" y2="${cellH}" stroke="#a0a0a0" stroke-width="0.008" fill="none"/>
      <line x1="0" y1="0" x2="${cellW}" y2="0" stroke="#a0a0a0" stroke-width="0.008" fill="none"/>
    </pattern>
    
    <!-- Major grid pattern: 1 inch × 1 inch squares -->
    <pattern id="inchGrid" 
             patternUnits="userSpaceOnUse" 
             width="${inchW}" 
             height="${inchH}">
      <line x1="0" y1="0" x2="0" y2="${inchH}" stroke="#303030" stroke-width="0.02" fill="none"/>
      <line x1="0" y1="0" x2="${inchW}" y2="0" stroke="#303030" stroke-width="0.02" fill="none"/>
    </pattern>
  </defs>
  
  <!-- Layer 1: Minor grid (gauge subdivisions) -->
  <rect 
    x="${gridX}" 
    y="${gridY}" 
    width="${gridW}" 
    height="${gridH}" 
    fill="url(#minorGrid)"
  />
  
  <!-- Layer 2: Major grid (1-inch squares) on top -->
  <rect 
    x="${gridX}" 
    y="${gridY}" 
    width="${gridW}" 
    height="${gridH}" 
    fill="url(#inchGrid)"
  />
  
  <!-- Border lines for right and bottom edges -->
  <line x1="${gridX + gridW}" y1="${gridY}" x2="${gridX + gridW}" y2="${gridY + gridH}" stroke="#303030" stroke-width="0.02" fill="none"/>
  <line x1="${gridX}" y1="${gridY + gridH}" x2="${gridX + gridW}" y2="${gridY + gridH}" stroke="#303030" stroke-width="0.02" fill="none"/>
`;
    
    // Footer attribution (only in full mode)
    const footerY = pageHeight - MARGIN - (FOOTER_BAND * 0.35);
    const gaugeUnit = unit === 'cm' ? '10cm' : '4in';
    const footerText = `Gauge: ${stsInput} sts × ${rowsInput} rows per ${gaugeUnit} | Created with Knit by Machine`;
    svg += `
  <!-- Footer attribution -->
  <text
    x="${gridX}"
    y="${footerY}"
    font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    font-size="0.097"
    opacity="0.45"
    fill="currentColor"
    text-rendering="geometricPrecision"
  >${footerText}</text>
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
