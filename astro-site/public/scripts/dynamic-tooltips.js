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

    // Convert to kbm-tooltip style - add the class and data-tooltip attribute
    // The CSS in global.css handles the tooltip display on hover
    trigger.classList.add('kbm-tooltip');
    trigger.setAttribute('data-tooltip', tooltipText);
    trigger.removeAttribute('data-tooltip-term');
  }

  // Process all tooltip triggers that haven't been converted yet
  async function processAllTooltips() {
    const triggers = document.querySelectorAll('[data-tooltip-term]');
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
              if (node.matches?.('[data-tooltip-term]') ||
                  node.querySelector?.('[data-tooltip-term]')) {
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
