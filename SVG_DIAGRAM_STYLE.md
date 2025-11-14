# SVG Diagram Style Guide for Pattern Wizards

This guide explains how to create consistent, reusable SVG diagrams for knitting pattern wizards (hats, blankets, etc.).

## Overview

Pattern diagrams use a **template + placeholder** system:
1. Create SVG files with placeholders like `{{WIDTH}}` or `{{BRIM_DEPTH}}`
2. Store templates in `astro-site/public/diagrams/`
3. Use the `PatternDiagram.astro` component to render with actual values

## Placeholder Conventions

### Naming Format
- **SCREAMING_SNAKE_CASE** format
- Placeholders receive fully-formatted values from wizard (with units already included)
- Examples:
  - `{{WIDTH}}` - Pattern width (wizard provides "18.5\"" or "47.0cm")
  - `{{HEIGHT}}` - Pattern height (wizard provides "8.5\"" or "21.6cm")
  - `{{BRIM_DEPTH}}` - Brim depth (wizard provides "2.0\"" or "5.1cm")

### Common Placeholders
```
{{WIDTH}}             - Pattern width (with unit)
{{HEIGHT}}            - Pattern height (with unit)
{{BRIM_DEPTH}}        - Brim depth (with unit)
{{CROWN_HEIGHT}}      - Crown height (with unit)
{{WEDGE_COUNT}}       - Number of wedges (for crown)
{{SECTION_NAME}}      - Dynamic section label
```

**Note:** Wizards handle unit conversion and formatting before passing values to diagrams. This keeps SVG templates simple and reusable.

## Color Palette (KBM Brand Colors)

Use these exact hex values for consistency:

```
Primary (Olive Green):  #52682D
Secondary (Dark Gray):  #374151
Light Gray (Fill):      #f3f4f6
Medium Gray (Fill):     #e5e7eb
Text/Labels:            #374151
Accent (if needed):     #1f2937
```

### Color Usage
- **Primary (#52682D)**: Main pattern outline, brim markers, special annotations
- **Secondary (#374151)**: Dimension lines, dimension text, body labels
- **Light/Medium Gray**: Pattern fills, ribbing textures
- **Text (#374151)**: All labels and measurements

## Visual Elements

### 1. Dimension Lines
- **Stroke width**: 1.5px
- **Color**: #374151 (dark gray)
- **Endpoints**: Circles, NOT arrows
  ```svg
  <line x1="150" y1="330" x2="350" y2="330" stroke="#374151" stroke-width="1.5"/>
  <circle cx="150" cy="330" r="4" fill="#374151"/>
  <circle cx="350" cy="330" r="4" fill="#374151"/>
  ```

### 2. Dimension Text
- **Font size**: 14px for primary measurements, 12px for secondary
- **Font weight**: 600 (semi-bold)
- **Color**: #374151
- **Positioning**: Place near dimension line with adequate spacing
  ```svg
  <text x="250" y="350" text-anchor="middle" font-size="14" font-weight="600" fill="#374151">
    Width: {{WIDTH}}
  </text>
  ```
  
**Note:** The wizard provides fully-formatted values like "18.5\"" or "47.0cm", so placeholders don't need unit suffixes.

### 3. Pattern Outlines
- **Stroke width**: 2px
- **Color**: #52682D (primary olive)
- **Fill**: #f3f4f6 (light gray) or #e5e7eb (medium gray)
  ```svg
  <rect x="150" y="100" width="200" height="200" 
        fill="#f3f4f6" stroke="#52682D" stroke-width="2"/>
  ```

### 4. Dashed Lines (for fold lines, crown starts, etc.)
- **Stroke width**: 1px
- **Dash pattern**: 5,5
- **Color**: #52682D
  ```svg
  <line x1="150" y1="180" x2="350" y2="180" 
        stroke="#52682D" stroke-width="1" stroke-dasharray="5,5"/>
  ```

### 5. Section Labels
- **Font size**: 14px
- **Font weight**: 700 (bold)
- **Color**: #52682D for special sections (Crown, Brim), #374151 for body
  ```svg
  <text x="250" y="130" text-anchor="middle" font-size="14" font-weight="700" fill="#52682D">
    Crown
  </text>
  ```

## File Organization

```
astro-site/public/diagrams/
├── hat-gathered.svg       # Gathered crown hat
├── hat-4-wedge.svg        # 4-wedge crown hat
├── hat-6-wedge.svg        # 6-wedge crown hat
├── hat-spiral.svg         # Spiral crown hat
├── blanket-corner.svg     # Corner-to-corner blanket
└── [future patterns].svg
```

### Naming Convention
- Format: `{pattern-type}-{variant}.svg`
- Use lowercase with hyphens
- Be descriptive and specific

## Creating SVGs

### Step 1: Set Up Your Canvas
```svg
<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Your diagram here -->
</svg>
```
- **viewBox**: Use appropriate dimensions (500x400 is common)
- Keep designs centered and balanced

### Step 2: Draw Pattern Shape
```svg
<!-- Example: Simple rectangular pattern -->
<rect x="150" y="100" width="200" height="200" 
      fill="#f3f4f6" stroke="#52682D" stroke-width="2"/>
```

### Step 3: Add Dimension Lines with Circles
```svg
<!-- Width dimension -->
<line x1="150" y1="330" x2="350" y2="330" stroke="#374151" stroke-width="1.5"/>
<circle cx="150" cy="330" r="4" fill="#374151"/>
<circle cx="350" cy="330" r="4" fill="#374151"/>
<text x="250" y="350" text-anchor="middle" font-size="14" font-weight="600" fill="#374151">
  Width: {{WIDTH}}
</text>
```

### Step 4: Add Placeholders
Replace any dynamic values with placeholder syntax:
- `{{WIDTH}}` for measurement values (already includes unit from wizard)
- `{{HEIGHT}}` for height measurements (already includes unit)
- Keep text formatting outside placeholders

**Important:** The wizard provides fully-formatted values like "18.5\"" or "47.0cm", so you don't need separate placeholders for units.

### Step 5: Add Labels
```svg
<text x="250" y="150" text-anchor="middle" font-size="14" font-weight="700" fill="#52682D">
  {{SECTION_NAME}}
</text>
```

## Example: Hat with Wedge Crown

```svg
<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Hat body -->
  <path d="M 150 300 L 150 150 Q 150 120, 180 110 L 320 110 Q 350 120, 350 150 L 350 300 Z" 
        fill="#f3f4f6" stroke="#52682D" stroke-width="2"/>
  
  <!-- Wedge lines (for 4-wedge crown) -->
  <line x1="210" y1="110" x2="210" y2="180" stroke="#52682D" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="250" y1="110" x2="250" y2="180" stroke="#52682D" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="290" y1="110" x2="290" y2="180" stroke="#52682D" stroke-width="1" stroke-dasharray="3,3"/>
  
  <!-- Wedge number labels -->
  <text x="180" y="140" text-anchor="middle" font-size="16" font-weight="700" fill="#52682D">1</text>
  <text x="230" y="140" text-anchor="middle" font-size="16" font-weight="700" fill="#52682D">2</text>
  <text x="270" y="140" text-anchor="middle" font-size="16" font-weight="700" fill="#52682D">3</text>
  <text x="320" y="140" text-anchor="middle" font-size="16" font-weight="700" fill="#52682D">4</text>
  
  <!-- Width dimension -->
  <line x1="150" y1="330" x2="350" y2="330" stroke="#374151" stroke-width="1.5"/>
  <circle cx="150" cy="330" r="4" fill="#374151"/>
  <circle cx="350" cy="330" r="4" fill="#374151"/>
  <text x="250" y="350" text-anchor="middle" font-size="14" font-weight="600" fill="#374151">
    Width: {{WIDTH}}
  </text>
  
  <!-- Height dimension -->
  <line x1="380" y1="110" x2="380" y2="300" stroke="#374151" stroke-width="1.5"/>
  <circle cx="380" cy="110" r="4" fill="#374151"/>
  <circle cx="380" cy="300" r="4" fill="#374151"/>
  <text x="410" y="210" text-anchor="start" font-size="14" font-weight="600" fill="#374151">
    Height: {{HEIGHT}}
  </text>
</svg>
```

## Usage in Wizards

### In your Astro wizard page:

```astro
---
import PatternDiagram from '@/components/wizards/PatternDiagram.astro';

// Calculate measurements
const width = 18.5;
const height = 8.5;

// Determine which template based on user selection
const crownType = 'gathered'; // or '4-wedge', '6-wedge', 'spiral'
const template = `hat-${crownType}`;

// Prepare fully-formatted values for placeholders (with units)
const diagramValues = {
  WIDTH: `${width.toFixed(1)}"`,        // "18.5""
  HEIGHT: `${height.toFixed(1)}"`,      // "8.5""
  BRIM_DEPTH: `${(2.5).toFixed(1)}"`    // "2.5""
};
---

<PatternDiagram template={template} values={diagramValues} />
```

**Note:** The wizard handles all unit conversion and formatting. Values passed to diagrams already include the unit symbol.

## Checklist for New Diagrams

- [ ] SVG viewBox is appropriately sized
- [ ] All colors match KBM palette (#52682D primary, #374151 secondary, etc.)
- [ ] Dimension lines use circles (not arrows) at endpoints
- [ ] All placeholders use simple format: {{WIDTH}}, {{HEIGHT}}, etc.
- [ ] Text is legible at various screen sizes
- [ ] File saved in `astro-site/public/diagrams/`
- [ ] File name follows `{pattern-type}-{variant}.svg` convention
- [ ] Tested with actual wizard values

## Tips

1. **Export from Illustrator/Figma**: Clean up unnecessary groups and IDs
2. **Use text-anchor="middle"** for centered labels
3. **Units are pre-formatted**: Wizards provide "18.5\"" or "47.0cm" - no need for separate unit placeholders
4. **Keep it simple**: Avoid overly complex paths; use basic shapes
5. **Consistent spacing**: Maintain uniform padding around diagrams
6. **Accessibility**: Use semantic grouping even though it's decorative

## Future Enhancements

Potential additions as the system evolves:
- Conditional sections (show/hide elements based on options)
- Reusable symbol libraries for common elements
- Animation support for interactive instructions
- Multi-view diagrams (front/side/top)
