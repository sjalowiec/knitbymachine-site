/**
 * Row-by-Row Shaping Generator
 * 
 * A reusable "lego block" utility for generating row-by-row shaping instructions.
 * Can be used across the entire Knit by Machine site:
 * - Shaping Formula tools
 * - Patterns
 * - Skill builders
 * - Any shaping calculator or practice worksheet
 */

/**
 * Generates a row-by-row breakdown of shaping actions.
 * 
 * @param {Object} options - Configuration for generating the breakdown
 * @param {number} options.startingStitches - Initial stitch count before any shaping
 * @param {Array<{sts: number, rows: number, times: number}>} options.steps - Array of shaping steps
 * @param {'both'|'one'} options.shapingMode - Whether shaping occurs on both sides or one side
 * @param {'decrease'|'increase'} [options.direction='decrease'] - Direction of shaping
 * @returns {Array<{rowNumber: number, action: string, location: string, stitchesAfter: number}>}
 * 
 * @example
 * const breakdown = generateRowByRow({
 *   startingStitches: 100,
 *   steps: [
 *     { sts: 1, rows: 4, times: 5 },  // dec 1 st every 4 rows, 5 times
 *     { sts: 1, rows: 6, times: 3 },  // dec 1 st every 6 rows, 3 times
 *   ],
 *   shapingMode: 'both',
 *   direction: 'decrease'
 * });
 */
function generateRowByRow(options) {
  const {
    startingStitches,
    steps,
    shapingMode,
    direction = 'decrease'
  } = options;

  const entries = [];
  
  // Track the current stitch count as we process each shaping action
  // This represents the TOTAL number of stitches on the needles
  let currentStitches = startingStitches;
  
  // Track the current row number as we progress through the piece
  // Shaping typically starts at row 2 (row 1 is the setup row with no shaping)
  let currentRow = 0;

  // Determine the stitch change per action based on shaping mode:
  // - "both" mode: Each action affects BOTH edges, so we add/remove 2x the sts value
  //   Example: "decrease 1 stitch each side" removes 2 total stitches (1 left + 1 right)
  // - "one" mode: Each action affects only ONE edge, so we add/remove exactly sts value
  //   Example: "decrease 1 stitch on right side only" removes 1 total stitch
  const stitchMultiplier = shapingMode === 'both' ? 2 : 1;
  
  // Format the location text for display
  const locationText = shapingMode === 'both' ? 'Both sides' : 'One side only';

  // Process each shaping step in order
  for (const step of steps) {
    const { sts, rows: interval, times } = step;
    
    // Format the action text (e.g., "Decrease 1 stitch" or "Increase 2 stitches")
    const actionVerb = direction === 'decrease' ? 'Decrease' : 'Increase';
    const stitchWord = sts === 1 ? 'stitch' : 'stitches';
    const actionText = `${actionVerb} ${sts} ${stitchWord}`;

    // Repeat this step the specified number of times
    for (let i = 0; i < times; i++) {
      // Advance to the next shaping row
      currentRow += interval;

      // Update the stitch count based on direction and mode
      if (direction === 'decrease') {
        currentStitches -= sts * stitchMultiplier;
      } else {
        currentStitches += sts * stitchMultiplier;
      }

      // Record this shaping action
      // stitchesAfter reflects the TOTAL needles in work AFTER this shaping action completes
      entries.push({
        rowNumber: currentRow,
        action: actionText,
        location: locationText,
        stitchesAfter: currentStitches,
      });
    }
  }

  return entries;
}

// Make available globally for inline scripts
window.generateRowByRow = generateRowByRow;
