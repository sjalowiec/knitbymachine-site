document.addEventListener("DOMContentLoaded", () => {
  formatRskTitles();
  
  // Also run after a short delay to catch dynamically rendered content
  setTimeout(formatRskTitles, 500);
  
  // Watch for dynamically added content (e.g., catalog cards)
  const observer = new MutationObserver(() => {
    formatRskTitles();
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
});

function formatRskTitles() {
  const headings = document.querySelectorAll("h1, h2, h3, .page-title, .hero-title, .wizard-card-title, .section-title");

  headings.forEach(h => {
    // Skip if already formatted
    if (h.querySelector('.rsk-module')) return;
    
    const text = h.textContent.trim();
    
    // Support both bullet styles: • (bullet) and ● (black circle)
    const markers = [
      "Ready • Set • Knit:",
      "Ready ● Set ● Knit:"
    ];

    for (const marker of markers) {
      if (text.startsWith(marker)) {
        const moduleName = text.replace(marker, "").trim();
        h.innerHTML = `${marker} <span class="rsk-module">${moduleName}</span>`;
        break;
      }
    }
  });
}
