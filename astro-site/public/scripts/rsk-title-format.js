document.addEventListener("DOMContentLoaded", () => {
  const headings = document.querySelectorAll("h1, h2, .page-title");

  headings.forEach(h => {
    const text = h.textContent.trim();
    const marker = "Ready • Set • Knit:";

    if (text.startsWith(marker)) {
      const moduleName = text.replace(marker, "").trim();

      h.innerHTML = `${marker} <span class="rsk-module">${moduleName}</span>`;
    }
  });
});
