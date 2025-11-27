document.addEventListener("DOMContentLoaded", () => {
  const headings = document.querySelectorAll("h1, h2, .page-title, .hero-title");

  headings.forEach(h => {
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
});
