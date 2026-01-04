/**
 * Vanilla JS Stepped Wizard Embed
 * Wizard ID: wf-5ihf4x
 * 
 * Embed with:
 *   <div id="wizard-wf-5ihf4x"></div>
 *   <script type="module" src="/scripts/wizards/wf-5ihf4x.js"></script>
 */

(async function() {
  // KBM Brand Colors
  const COLORS = {
    green: "#52682D",
    questionBg: "#F4F6F2",
    selectedBg: "#E9EDE4",
    feedbackBg: "#E5E8E0",
    feedbackBorder: "#52682D",
    iconBg: "#D4DBC7",
    textMuted: "#6b7280"
  };

  // SVG Icons (inline for no dependencies)
  const ICONS = {
    messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
    checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>`,
    arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>`,
    arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>`,
    rotateCcw: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    externalLink: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
  };

  // Find mount element
  const mount = document.getElementById("wizard-wf-5ihf4x");
  if (!mount) {
    console.error("[Wizard wf-5ihf4x] Mount element #wizard-wf-5ihf4x not found");
    return;
  }

  // Fetch wizard data
  let data;
  try {
    const response = await fetch("/wizards/wf-5ihf4x.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (err) {
    console.error("[Wizard wf-5ihf4x] Failed to load wizard data:", err);
    mount.innerHTML = `<div style="padding: 2rem; text-align: center; color: #666;">Unable to load wizard. Please refresh the page.</div>`;
    return;
  }

  const { wizardSteps: steps, wizardOutcomes: outcomes, wizardStartStepId: startStepId, flowType } = data;
  const isLinear = flowType === "assessment";

  // State
  let currentStepId = startStepId;
  let currentOutcomeKey = null;
  let history = [];
  let selectedChoice = null;

  // Helper functions
  function getCurrentStep() {
    return steps.find(s => s.stepId === currentStepId);
  }

  function getCurrentStepIndex() {
    return steps.findIndex(s => s.stepId === currentStepId);
  }

  function getCurrentOutcome() {
    return currentOutcomeKey ? outcomes[currentOutcomeKey] : null;
  }

  // Event handlers
  function handleChoiceClick(choiceIndex) {
    const step = getCurrentStep();
    if (!step) return;
    const choice = step.choices[choiceIndex];

    if (isLinear) {
      if (choice.feedbackText) {
        selectedChoice = choice;
        render();
      } else {
        if (currentStepId) history.push(currentStepId);
        const nextIndex = getCurrentStepIndex() + 1;
        if (nextIndex < steps.length) {
          currentStepId = steps[nextIndex].stepId;
          currentOutcomeKey = null;
        } else {
          const outcomeKeys = Object.keys(outcomes);
          if (outcomeKeys.length > 0) {
            currentStepId = null;
            currentOutcomeKey = outcomeKeys[0];
          }
        }
        render();
      }
    } else {
      if (currentStepId) history.push(currentStepId);
      if (choice.routeType === "step" && choice.routeTarget) {
        currentStepId = choice.routeTarget;
        currentOutcomeKey = null;
      } else if (choice.routeType === "outcome" && choice.routeTarget) {
        currentStepId = null;
        currentOutcomeKey = choice.routeTarget;
      }
      render();
    }
  }

  function handleContinue() {
    if (!currentStepId) return;
    history.push(currentStepId);
    selectedChoice = null;

    const nextIndex = getCurrentStepIndex() + 1;
    if (nextIndex < steps.length) {
      currentStepId = steps[nextIndex].stepId;
      currentOutcomeKey = null;
    } else {
      const outcomeKeys = Object.keys(outcomes);
      if (outcomeKeys.length > 0) {
        currentStepId = null;
        currentOutcomeKey = outcomeKeys[0];
      }
    }
    render();
  }

  function handleBack() {
    if (selectedChoice) {
      selectedChoice = null;
      render();
      return;
    }
    if (history.length > 0) {
      currentStepId = history.pop();
      currentOutcomeKey = null;
      selectedChoice = null;
      render();
    }
  }

  function handleRestart() {
    currentStepId = startStepId;
    currentOutcomeKey = null;
    history = [];
    selectedChoice = null;
    render();
  }

  // CSS Styles (injected once)
  function injectStyles() {
    if (document.getElementById("wizard-embed-styles")) return;
    const style = document.createElement("style");
    style.id = "wizard-embed-styles";
    style.textContent = `
      .wizard-embed {
        max-width: 42rem;
        margin: 0 auto;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .wizard-embed * {
        box-sizing: border-box;
      }
      .wizard-bubble {
        position: relative;
        border-radius: 1rem;
        border-bottom-left-radius: 0.25rem;
        padding: 1.5rem;
        background: ${COLORS.questionBg};
      }
      .wizard-bubble-tail {
        position: absolute;
        bottom: -0.5rem;
        left: 1rem;
        width: 1rem;
        height: 1rem;
        background: ${COLORS.questionBg};
        transform: rotate(45deg);
      }
      .wizard-bubble-content {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .wizard-bubble-icon {
        color: ${COLORS.green};
        flex-shrink: 0;
        margin-top: 0.125rem;
      }
      .wizard-thought {
        font-size: 1.125rem;
        font-weight: 500;
        line-height: 1.5;
        color: #1f2937;
      }
      .wizard-helper {
        font-size: 0.875rem;
        color: ${COLORS.textMuted};
        margin-top: 0.5rem;
      }
      .wizard-choices {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-left: 1.5rem;
        margin-top: 1.5rem;
      }
      .wizard-choice-btn {
        width: 100%;
        text-align: left;
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        cursor: pointer;
        transition: border-color 0.15s, background-color 0.15s;
      }
      .wizard-choice-btn:hover {
        border-color: ${COLORS.green};
        background-color: ${COLORS.questionBg};
      }
      .wizard-selected-box {
        background: ${COLORS.selectedBg};
        border-radius: 0.5rem;
        padding: 1rem;
        margin-left: 1.5rem;
        margin-top: 1.5rem;
      }
      .wizard-selected-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: ${COLORS.green};
        margin-bottom: 0.25rem;
      }
      .wizard-selected-text {
        font-weight: 500;
        color: #1f2937;
      }
      .wizard-feedback-card {
        background: ${COLORS.feedbackBg};
        border: 2px solid ${COLORS.feedbackBorder};
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-top: 1.5rem;
      }
      .wizard-feedback-content {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      .wizard-feedback-icon {
        background: ${COLORS.iconBg};
        border-radius: 50%;
        padding: 0.5rem;
        color: ${COLORS.green};
        flex-shrink: 0;
      }
      .wizard-feedback-text {
        flex: 1;
        color: #1f2937;
        line-height: 1.6;
      }
      .wizard-outcome-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: ${COLORS.green};
        margin-bottom: 0.5rem;
      }
      .wizard-outcome-body {
        color: #1f2937;
        line-height: 1.6;
        white-space: pre-line;
      }
      .wizard-outcome-body ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      .wizard-outcome-body li {
        margin: 0.25rem 0;
      }
      .wizard-btn-row {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
      }
      .wizard-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .wizard-btn:hover {
        opacity: 0.9;
      }
      .wizard-btn-primary {
        background: ${COLORS.green};
        color: white;
        border: none;
      }
      .wizard-btn-outline {
        background: transparent;
        color: ${COLORS.green};
        border: 2px solid ${COLORS.green};
      }
      .wizard-btn-ghost {
        background: transparent;
        color: ${COLORS.green};
        border: none;
      }
      .wizard-btn-ghost:hover {
        background: rgba(82, 104, 45, 0.1);
      }
      .wizard-cta-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: ${COLORS.green};
        color: white;
        border-radius: 0.5rem;
        font-weight: 500;
        text-decoration: none;
        margin-top: 1rem;
      }
      .wizard-cta-btn:hover {
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
  }

  // Render functions
  function renderStepView(step) {
    return `
      <div class="wizard-embed" data-view="step">
        <div class="wizard-bubble">
          <div class="wizard-bubble-content">
            <div class="wizard-bubble-icon">${ICONS.messageCircle}</div>
            <div>
              <p class="wizard-thought">${escapeHtml(step.thoughtText)}</p>
              ${step.helperText ? `<p class="wizard-helper">${escapeHtml(step.helperText)}</p>` : ""}
            </div>
          </div>
          <div class="wizard-bubble-tail"></div>
        </div>
        <div class="wizard-choices">
          ${step.choices.map((choice, i) => `
            <button class="wizard-choice-btn" data-choice="${i}">${escapeHtml(choice.label)}</button>
          `).join("")}
        </div>
        ${history.length > 0 ? `
          <div class="wizard-btn-row">
            <button class="wizard-btn wizard-btn-ghost" data-action="back">
              ${ICONS.arrowLeft} Go Back
            </button>
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderFeedbackView(step, choice) {
    return `
      <div class="wizard-embed" data-view="feedback">
        <div class="wizard-bubble">
          <div class="wizard-bubble-content">
            <div class="wizard-bubble-icon">${ICONS.messageCircle}</div>
            <div>
              <p class="wizard-thought">${escapeHtml(step.thoughtText)}</p>
            </div>
          </div>
          <div class="wizard-bubble-tail"></div>
        </div>
        <div class="wizard-selected-box">
          <p class="wizard-selected-label">You selected:</p>
          <p class="wizard-selected-text">${escapeHtml(choice.label)}</p>
        </div>
        <div class="wizard-feedback-card">
          <div class="wizard-feedback-content">
            <div class="wizard-feedback-icon">${ICONS.checkCircle}</div>
            <div class="wizard-feedback-text">${escapeHtml(choice.feedbackText)}</div>
          </div>
        </div>
        <div class="wizard-btn-row">
          <button class="wizard-btn wizard-btn-ghost" data-action="back">
            ${ICONS.arrowLeft} Change Answer
          </button>
          <button class="wizard-btn wizard-btn-primary" data-action="continue">
            Continue ${ICONS.arrowRight}
          </button>
        </div>
      </div>
    `;
  }

  function renderOutcomeView(outcome) {
    return `
      <div class="wizard-embed" data-view="outcome">
        <div class="wizard-feedback-card">
          <div class="wizard-feedback-content">
            <div class="wizard-feedback-icon">${ICONS.checkCircle}</div>
            <div class="wizard-feedback-text">
              <h3 class="wizard-outcome-title">${escapeHtml(outcome.title)}</h3>
              ${outcome.body ? `<div class="wizard-outcome-body">${outcome.body}</div>` : ""}
              ${outcome.ctaLabel && outcome.ctaHref ? `
                <a href="${escapeHtml(outcome.ctaHref)}" class="wizard-cta-btn" target="_blank" rel="noopener noreferrer">
                  ${escapeHtml(outcome.ctaLabel)} ${ICONS.externalLink}
                </a>
              ` : ""}
            </div>
          </div>
        </div>
        <div class="wizard-btn-row">
          ${history.length > 0 ? `
            <button class="wizard-btn wizard-btn-outline" data-action="back">
              ${ICONS.arrowLeft} Go Back
            </button>
          ` : ""}
          <button class="wizard-btn wizard-btn-primary" data-action="restart">
            ${ICONS.rotateCcw} Start Over
          </button>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  function render() {
    const step = getCurrentStep();
    const outcome = getCurrentOutcome();

    if (step && !selectedChoice) {
      mount.innerHTML = renderStepView(step);
    } else if (step && selectedChoice) {
      mount.innerHTML = renderFeedbackView(step, selectedChoice);
    } else if (outcome) {
      mount.innerHTML = renderOutcomeView(outcome);
    } else {
      mount.innerHTML = `<div style="padding: 2rem; text-align: center; color: #666;">No steps configured for this wizard.</div>`;
    }

    attachEventListeners();
  }

  function attachEventListeners() {
    // Choice buttons
    mount.querySelectorAll("[data-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        handleChoiceClick(parseInt(btn.dataset.choice, 10));
      });
    });

    // Action buttons
    mount.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "back") handleBack();
        else if (action === "continue") handleContinue();
        else if (action === "restart") handleRestart();
      });
    });
  }

  // Initialize
  injectStyles();
  render();
})();
