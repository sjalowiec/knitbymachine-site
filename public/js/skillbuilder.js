/**
 * Skill Builder Dynamic Loader
 * Loads JSON data and renders skill builder pages dynamically
 * Handles localStorage progress tracking and all interactivity
 */

(function() {
  'use strict';

  const SkillBuilder = {
    data: null,
    lsPrefix: '',

    /**
     * Initialize skill builder from JSON file
     */
    async init(jsonPath) {
      try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`Failed to load: ${response.statusText}`);
        this.data = await response.json();
        this.lsPrefix = `kbm_sb_${this.data.id}_`;
        this.render();
        this.attachEvents();
        this.restoreProgress();
      } catch (error) {
        console.error('Skill Builder initialization failed:', error);
        document.body.innerHTML = `<div style="padding:40px;text-align:center"><h2>Failed to load skill builder</h2><p>${error.message}</p></div>`;
      }
    },

    /**
     * Render all content from JSON data
     */
    render() {
      const d = this.data;
      
      // Hero section
      document.getElementById('sb-title').textContent = d.title;
      document.getElementById('sb-intro').textContent = d.intro;
      document.getElementById('sb-tagline').textContent = d.tagline;
      
      // Member-only badge
      const memberBadge = document.getElementById('member-badge');
      if (memberBadge) {
        memberBadge.style.display = d.memberOnly ? 'inline-flex' : 'none';
      }

      // Pre-checklist
      const checklistContainer = document.getElementById('checklist-items');
      if (checklistContainer && d.preChecklist) {
        checklistContainer.innerHTML = d.preChecklist.map((item, i) => 
          `<label class="check-pill">
            <input type="checkbox" data-prep="${i}"> ${this.escapeHtml(item)}
          </label>`
        ).join('');
      }

      // Checklist instructions
      const checkInstructions = document.getElementById('checklist-instructions');
      if (checkInstructions && d.checklistInstructions) {
        checkInstructions.innerHTML = '<ol style="margin:0 0 10px 18px">' +
          d.checklistInstructions.map(inst => `<li>${this.escapeHtml(inst)}</li>`).join('') +
          '</ol>';
      }

      // Steps
      const stepsContainer = document.getElementById('steps-container');
      if (stepsContainer && d.steps) {
        stepsContainer.innerHTML = d.steps.map((step, i) => this.renderStep(step, i + 1)).join('');
      }

      // Update progress stat total
      const progressStat = document.getElementById('progress-stat');
      if (progressStat && d.steps) {
        progressStat.innerHTML = `<strong id="doneCount">0</strong>/${d.steps.length} tried · Keep going`;
      }

      // Reflection prompts
      const notesTextarea = document.getElementById('notes');
      if (notesTextarea && d.reflectionPrompts) {
        notesTextarea.placeholder = d.reflectionPrompts.join(' ');
      }

      // Reactions
      const reactionsContainer = document.getElementById('reactions-container');
      if (reactionsContainer && d.reactions) {
        reactionsContainer.innerHTML = d.reactions.map(r => 
          `<button class="react" data-react="${r.id}" aria-pressed="false">${r.emoji} ${this.escapeHtml(r.label)}</button>`
        ).join('');
      }

      // Next steps
      const nextStepsContainer = document.getElementById('next-steps-container');
      if (nextStepsContainer && d.nextSteps) {
        nextStepsContainer.innerHTML = d.nextSteps.map(step => this.renderNextStep(step)).join('');
      }
    },

    /**
     * Render a single step card
     */
    renderStep(step, index) {
      const media = step.mediaFile && step.mediaType !== 'placeholder'
        ? (step.mediaType === 'video' 
            ? `<video src="media/${this.escapeHtml(step.mediaFile)}" loop autoplay muted></video>`
            : `<img src="media/${this.escapeHtml(step.mediaFile)}" alt="${this.escapeHtml(step.title)}">`)
        : 'GIF / Short clip';

      const tips = step.tips && step.tips.length > 0
        ? `<details class="tip">
            <summary>Show tips</summary>
            <div class="tip-body">
              <ul>${step.tips.map(tip => `<li>${this.escapeHtml(tip)}</li>`).join('')}</ul>
            </div>
          </details>`
        : '';

      return `
        <article class="step" data-step="${index}">
          <header>
            <h3>${this.escapeHtml(step.title)}</h3>
            <span class="badge">${this.escapeHtml(step.duration)}</span>
          </header>
          <div class="media" aria-label="Short demo">${media}</div>
          <div class="body">
            <p>${this.escapeHtml(step.description)}</p>
          </div>
          ${tips}
          <div class="actions">
            <button class="btn ghost" data-action="notes">Add note</button>
            <button class="btn primary" data-action="mark" aria-pressed="false">Mark tried</button>
          </div>
        </article>`;
    },

    /**
     * Render a next step card
     */
    renderNextStep(step) {
      return `
        <article class="card">
          <div class="thumb" aria-hidden="true"></div>
          <div class="pad">
            <h4>${this.escapeHtml(step.title)}</h4>
            <p>${this.escapeHtml(step.description)}</p>
            <p><a class="btn" href="${this.escapeHtml(step.link)}">${this.escapeHtml(step.buttonText)}</a></p>
          </div>
        </article>`;
    },

    /**
     * Attach all event listeners
     */
    attachEvents() {
      // Mark tried buttons
      document.querySelectorAll('[data-action="mark"]').forEach(btn => {
        btn.addEventListener('click', () => this.toggleTried(btn));
      });

      // Notes textarea
      const notes = document.getElementById('notes');
      if (notes) {
        notes.addEventListener('input', () => {
          localStorage.setItem(this.lsPrefix + 'notes', notes.value);
        });
      }

      // Reactions
      document.querySelectorAll('.react').forEach(btn => {
        btn.addEventListener('click', () => this.toggleReaction(btn));
      });

      // Next action button
      const nextBtn = document.getElementById('nextAction');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.showNextMethod());
      }

      // Checklist modal
      const openChecklist = document.getElementById('openChecklist');
      const closeChecklist = document.getElementById('closeChecklist');
      const checkModal = document.getElementById('checkModal');
      if (openChecklist && closeChecklist && checkModal) {
        openChecklist.addEventListener('click', () => checkModal.style.display = 'grid');
        closeChecklist.addEventListener('click', () => checkModal.style.display = 'none');
        checkModal.addEventListener('click', (e) => {
          if (e.target === checkModal) checkModal.style.display = 'none';
        });
      }
    },

    /**
     * Restore progress from localStorage
     */
    restoreProgress() {
      // Restore tried steps
      document.querySelectorAll('[data-action="mark"]').forEach(btn => {
        const step = btn.closest('.step').dataset.step;
        const val = localStorage.getItem(this.lsPrefix + 'step_' + step);
        if (val === 'true') {
          btn.setAttribute('aria-pressed', 'true');
          btn.textContent = 'Tried';
        }
      });

      // Restore notes
      const notes = document.getElementById('notes');
      const saved = localStorage.getItem(this.lsPrefix + 'notes');
      if (notes && saved) notes.value = saved;

      // Restore reactions
      document.querySelectorAll('.react').forEach(btn => {
        const key = this.lsPrefix + 'react_' + btn.dataset.react;
        if (localStorage.getItem(key) === 'true') {
          btn.setAttribute('aria-pressed', 'true');
        }
      });

      this.updateProgress();
    },

    /**
     * Toggle tried state on a step
     */
    toggleTried(btn) {
      const step = btn.closest('.step').dataset.step;
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!pressed));
      btn.textContent = !pressed ? 'Tried' : 'Mark tried';
      localStorage.setItem(this.lsPrefix + 'step_' + step, String(!pressed));
      this.updateProgress();
    },

    /**
     * Toggle reaction button
     */
    toggleReaction(btn) {
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!pressed));
      localStorage.setItem(this.lsPrefix + 'react_' + btn.dataset.react, String(!pressed));
    },

    /**
     * Update progress bar and count
     */
    updateProgress() {
      const steps = document.querySelectorAll('.step');
      const total = steps.length;
      const done = Array.from(steps).filter(s => 
        localStorage.getItem(this.lsPrefix + 'step_' + s.dataset.step) === 'true'
      ).length;
      
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const bar = document.getElementById('bar');
      const doneCount = document.getElementById('doneCount');
      
      if (bar) bar.style.width = pct + '%';
      if (doneCount) doneCount.textContent = String(done);
      
      if (done === total && total > 0) {
        this.blastConfetti();
      }
    },

    /**
     * Show next untried method
     */
    showNextMethod() {
      const steps = Array.from(document.querySelectorAll('.step'));
      const next = steps.find(s => 
        localStorage.getItem(this.lsPrefix + 'step_' + s.dataset.step) !== 'true'
      );
      
      if (next) {
        next.scrollIntoView({ behavior: 'smooth', block: 'center' });
        next.querySelector('[data-action="mark"]').focus();
      } else {
        this.blastConfetti();
      }
    },

    /**
     * Confetti animation (no external libraries)
     */
    blastConfetti() {
      const confetti = document.getElementById('confetti');
      if (!confetti) return;

      const ctx = confetti.getContext('2d');
      confetti.width = innerWidth;
      confetti.height = innerHeight;
      confetti.classList.add('on');

      const pieces = Array.from({ length: 140 }).map(() => ({
        x: Math.random() * confetti.width,
        y: -20 - Math.random() * 80,
        r: 6 + Math.random() * 6,
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 3,
        a: Math.random() * Math.PI
      }));

      let t = 0;
      const dur = 1400;
      const start = performance.now();

      (function frame(now) {
        t = now - start;
        ctx.clearRect(0, 0, confetti.width, confetti.height);
        pieces.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.a += 0.05;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.a);
          ctx.fillStyle = (Math.random() > 0.5) ? '#9cc29b' : '#cfe3c8';
          ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
          ctx.restore();
        });
        if (t < dur) {
          requestAnimationFrame(frame);
        } else {
          confetti.classList.remove('on');
          ctx.clearRect(0, 0, confetti.width, confetti.height);
        }
      })(start);
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Export to global scope
  window.SkillBuilder = SkillBuilder;
})();
