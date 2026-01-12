// Dynamic tooltip system for content stored in database
// Converts data-tooltip attributes into interactive tooltips
// Supports both static and dynamically generated content

(function() {
  console.log('[Tooltips] Script loaded');
  
  let glossaryData = null;
  let glossaryLoading = null;

  // Fetch glossary data (cached)
  async function loadGlossaryData() {
    if (glossaryData) {
      console.log('[Tooltips] Using cached glossary data');
      return glossaryData;
    }
    if (glossaryLoading) return glossaryLoading;

    glossaryLoading = (async () => {
      try {
        console.log('[Tooltips] Fetching /glossary.json...');
        const response = await fetch('/glossary.json');
        console.log('[Tooltips] Fetch response status:', response.status);
        if (response.ok) {
          const entries = await response.json();
          console.log('[Tooltips] Loaded', entries.length, 'glossary entries');
          glossaryData = {};
          entries.forEach(entry => {
            const slug = entry.slug?.toLowerCase().trim();
            const term = entry.term?.toLowerCase().trim();
            glossaryData[slug] = entry;
            if (term) glossaryData[term] = entry;
          });
          console.log('[Tooltips] Indexed slugs:', Object.keys(glossaryData).slice(0, 10), '...');
        } else {
          console.warn('[Tooltips] Glossary fetch failed:', response.status);
          glossaryData = {};
        }
      } catch (error) {
        console.error('[Tooltips] Failed to load glossary data:', error);
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

    console.log('[Tooltips] Processing term:', termSlug);

    // Look up glossary entry
    const entry = data[termSlug.toLowerCase().trim()];
    let tooltipText = '';

    if (entry?.tooltip) {
      tooltipText = entry.tooltip;
      console.log('[Tooltips] Found tooltip for', termSlug, ':', tooltipText.substring(0, 50));
    } else if (entry?.description) {
      // Fallback to first sentence of description
      const firstSentence = entry.description.split(/[.!?]/)[0];
      tooltipText = firstSentence ? firstSentence + '.' : entry.description;
      console.log('[Tooltips] Using description for', termSlug);
    } else {
      tooltipText = termSlug; // Fallback to term slug
      console.log('[Tooltips] No entry found for', termSlug, '- using slug as fallback');
    }

    // Convert to kbm-tooltip style - add the class and data-tooltip attribute
    // The CSS in global.css handles the tooltip display on hover
    trigger.classList.add('kbm-tooltip');
    trigger.setAttribute('data-tooltip', tooltipText);
    trigger.removeAttribute('data-tooltip-term');
    console.log('[Tooltips] Applied kbm-tooltip class and data-tooltip to element');
  }

  // Process all tooltip triggers that haven't been converted yet
  async function processAllTooltips() {
    const triggers = document.querySelectorAll('[data-tooltip-term]');
    console.log('[Tooltips] Found', triggers.length, 'tooltip triggers to process');
    if (triggers.length === 0) return;

    const data = await loadGlossaryData();
    triggers.forEach(trigger => processTooltipTrigger(trigger, data));
  }

  // Set up MutationObserver to watch for dynamically added content
  function setupObserver() {
    console.log('[Tooltips] Setting up MutationObserver');
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
        console.log('[Tooltips] MutationObserver detected new tooltip elements');
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
    console.log('[Tooltips] Initializing...');
    await processAllTooltips();
    setupObserver();
    console.log('[Tooltips] Initialization complete');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    console.log('[Tooltips] DOM loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('[Tooltips] DOM ready, starting init');
    init();
  }
})();
