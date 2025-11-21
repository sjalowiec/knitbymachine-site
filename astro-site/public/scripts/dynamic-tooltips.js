// Dynamic tooltip system for content stored in database
// Converts data-tooltip attributes into interactive tooltips

async function initializeDynamicTooltips() {
  // Find all elements with data-tooltip-term attribute
  const tooltipTriggers = document.querySelectorAll('[data-tooltip-term]');
  
  if (tooltipTriggers.length === 0) return;

  // Fetch glossary data
  let glossaryData = {};
  try {
    const response = await fetch('/glossary.json');
    if (response.ok) {
      const entries = await response.json();
      // Create lookup by slug and term
      entries.forEach(entry => {
        const slug = entry.slug?.toLowerCase().trim();
        const term = entry.term?.toLowerCase().trim();
        glossaryData[slug] = entry;
        if (term) glossaryData[term] = entry;
      });
    }
  } catch (error) {
    console.error('Failed to load glossary data:', error);
  }

  // Process each tooltip trigger
  tooltipTriggers.forEach(trigger => {
    const termSlug = trigger.getAttribute('data-tooltip-term');
    const position = trigger.getAttribute('data-tooltip-position') || 'top';
    
    if (!termSlug) return;

    // Look up glossary entry
    const entry = glossaryData[termSlug.toLowerCase().trim()];
    let tooltipText = '';

    if (entry?.tooltip) {
      tooltipText = entry.tooltip;
    } else if (entry?.description) {
      // Fallback to first sentence of description
      const firstSentence = entry.description.split(/[.!?]/)[0];
      tooltipText = firstSentence ? firstSentence + '.' : entry.description;
    } else {
      tooltipText = termSlug; // Fallback to term slug
    }

    // Create tooltip HTML
    const tooltipHTML = `
      <span class="tooltip tooltip--${position}" tabindex="0">
        <svg
          class="tooltip-icon"
          viewBox="0 0 100 100"
          width="1em"
          height="1em"
          aria-hidden="true"
        >
          <polygon
            points="50 2, 95 25, 95 75, 50 98, 5 75, 5 25"
            fill="#52682D"
            stroke="none"
          />
          <text
            x="50"
            y="63"
            text-anchor="middle"
            font-size="55"
            font-family="Arial, sans-serif"
            font-weight="bold"
            fill="#ffffff"
            pointer-events="none"
          >
            ?
          </text>
        </svg>
        ${tooltipText ? `<span class="tooltip-text" role="tooltip">${tooltipText}</span>` : ''}
      </span>
    `;

    // Replace the placeholder with the tooltip
    trigger.outerHTML = tooltipHTML;
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDynamicTooltips);
} else {
  initializeDynamicTooltips();
}
