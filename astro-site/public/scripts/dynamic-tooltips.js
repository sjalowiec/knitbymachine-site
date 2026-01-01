// Dynamic tooltip system for content stored in database
// Converts data-tooltip attributes into interactive tooltips
// Supports both static and dynamically generated content

(function() {
  let glossaryData = null;
  let glossaryLoading = null;

  // Fetch glossary data (cached)
  async function loadGlossaryData() {
    if (glossaryData) return glossaryData;
    if (glossaryLoading) return glossaryLoading;

    glossaryLoading = (async () => {
      try {
        const response = await fetch('/glossary.json');
        if (response.ok) {
          const entries = await response.json();
          glossaryData = {};
          entries.forEach(entry => {
            const slug = entry.slug?.toLowerCase().trim();
            const term = entry.term?.toLowerCase().trim();
            glossaryData[slug] = entry;
            if (term) glossaryData[term] = entry;
          });
        } else {
          glossaryData = {};
        }
      } catch (error) {
        console.error('Failed to load glossary data:', error);
        glossaryData = {};
      }
      return glossaryData;
    })();

    return glossaryLoading;
  }

  // Process a single tooltip trigger element
  function processTooltipTrigger(trigger, data) {
    // Skip if already processed
    if (trigger.dataset.tooltipProcessed) return;
    trigger.dataset.tooltipProcessed = 'true';

    const termSlug = trigger.getAttribute('data-tooltip-term');
    const position = trigger.getAttribute('data-tooltip-position') || 'top';
    
    if (!termSlug) return;

    // Look up glossary entry
    const entry = data[termSlug.toLowerCase().trim()];
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
  }

  // Process all unprocessed tooltip triggers
  async function processAllTooltips() {
    const triggers = document.querySelectorAll('[data-tooltip-term]:not([data-tooltip-processed])');
    if (triggers.length === 0) return;

    const data = await loadGlossaryData();
    triggers.forEach(trigger => processTooltipTrigger(trigger, data));
  }

  // Set up MutationObserver to watch for dynamically added content
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let hasNewTooltips = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches?.('[data-tooltip-term]:not([data-tooltip-processed])') ||
                  node.querySelector?.('[data-tooltip-term]:not([data-tooltip-processed])')) {
                hasNewTooltips = true;
                break;
              }
            }
          }
        }
        if (hasNewTooltips) break;
      }
      if (hasNewTooltips) {
        // Debounce processing
        clearTimeout(window._tooltipDebounce);
        window._tooltipDebounce = setTimeout(processAllTooltips, 50);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  async function init() {
    await processAllTooltips();
    setupObserver();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
