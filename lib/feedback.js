// Radiant Play — click-to-annotate feedback layer (dev only)
// Runs only on localhost. Never bundled into production builds.

if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  throw new Error('[feedback] Not on localhost — aborting.');
}

// --- constants ---
const SERVER          = 'http://localhost:3737';
const PANEL_WIDTH     = 320;
const PANEL_HEIGHT    = 200;
const TOAST_DURATION  = 3000;

const ICON_CURSOR = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="flex-shrink:0;transform:scaleX(-1) rotate(-15deg)" xmlns="http://www.w3.org/2000/svg"><path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"/></svg>`;
const ICON_X      = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M2 2l10 10M12 2 2 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;

// --- state ---
let annotating  = false;
let highlightEl = null;
let panelEl     = null;
let pendingData = null; // element metadata captured on click, held until submit or cancel

// --- toggle button ---
const btn = document.createElement('button');
btn.id = 'rdp-feedback-btn';
resetBtn();
document.body.appendChild(btn);

btn.addEventListener('click', () => {
  annotating = !annotating;
  if (annotating) {
    btn.innerHTML = `${ICON_X} Exit`;
    btn.classList.add('active');
  } else {
    removeHighlight();
    removePanel();
    resetBtn();
  }
});

function resetBtn() {
  btn.innerHTML = ICON_CURSOR;
  btn.classList.remove('active');
}

// --- highlight ---
function getOrCreateHighlight() {
  if (!highlightEl) {
    highlightEl = document.createElement('div');
    highlightEl.id = 'rdp-feedback-highlight';
    document.body.appendChild(highlightEl);
  }
  return highlightEl;
}

function positionHighlight(el) {
  const h = getOrCreateHighlight();
  const r = el.getBoundingClientRect();
  h.style.left   = r.left + 'px';
  h.style.top    = r.top  + 'px';
  h.style.width  = r.width  + 'px';
  h.style.height = r.height + 'px';
  h.style.display = 'block';
}

function removeHighlight() {
  if (highlightEl) highlightEl.style.display = 'none';
}

// --- event listeners ---
document.addEventListener('mousemove', (e) => {
  if (!annotating || panelEl) return;
  const target = e.target;
  if (!target || target === btn || target === highlightEl) return;
  positionHighlight(target);
}, { capture: true });

document.addEventListener('click', (e) => {
  if (!annotating || panelEl) return;
  const target = e.target;
  if (!target || target === btn || target === highlightEl) return;

  e.preventDefault();
  e.stopPropagation();

  const r = target.getBoundingClientRect();
  pendingData = {
    ts:              new Date().toISOString(),
    url:             location.href,
    prototypeName:   getPrototypeName(),
    selector:        buildSelector(target),
    componentChain:  getReactComponentChain(target),
    tagName:         target.tagName,
    textContent:     target.textContent?.trim().slice(0, 200) ?? '',
    outerHTMLSnippet: target.outerHTML.slice(0, 300),
    boundingBox: {
      x: Math.round(r.left), y: Math.round(r.top),
      width: Math.round(r.width), height: Math.round(r.height),
    },
  };

  openPanel(r);
}, { capture: true });

// --- helpers ---
function getPrototypeName() {
  const match = location.pathname.match(/\/playground\/([^/]+)/);
  return match ? match[1] : 'unknown';
}

function buildSelector(el) {
  const parts = [];
  let node = el;
  let depth = 0;
  while (node && node !== document.body && depth < 5) {
    let sel = node.tagName.toLowerCase();
    if (node.id) {
      parts.unshift(sel + '#' + node.id);
      break;
    }
    if (node.className && typeof node.className === 'string') {
      const cls = node.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) sel += '.' + cls;
    }
    const siblings = node.parentElement
      ? [...node.parentElement.children].filter(c => c.tagName === node.tagName)
      : [];
    if (siblings.length > 1) sel += `:nth-child(${siblings.indexOf(node) + 1})`;
    parts.unshift(sel);
    node = node.parentElement;
    depth++;
  }
  return parts.join(' > ');
}

// React attaches fiber data to DOM nodes under a key like __reactFiber$<hash>.
// Walking the fiber tree gives us the component display names for richer context.
function getReactComponentChain(el) {
  const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
  if (!fiberKey) return [];
  const chain = [];
  let fiber = el[fiberKey];
  let depth = 0;
  while (fiber && depth < 20) {
    const name = fiber.type?.displayName || fiber.type?.name;
    if (name && !/^[a-z]/.test(name)) chain.push(name);
    fiber = fiber.return;
    depth++;
  }
  return chain.reverse();
}

// --- panel ---
function openPanel(rect) {
  const chain = pendingData.componentChain.slice(-3).join(' › ') || pendingData.tagName;
  const text  = pendingData.textContent.slice(0, 60);

  panelEl = document.createElement('div');
  panelEl.id = 'rdp-feedback-panel';
  panelEl.innerHTML = `
    <div class="rdp-fp-meta">${chain}${text ? ` · "${text}"` : ''}</div>
    <textarea placeholder="What would you like to change?" autofocus></textarea>
    <div class="rdp-fp-actions">
      <button class="rdp-fp-cancel">Cancel</button>
      <button class="rdp-fp-submit">Send</button>
    </div>
  `;

  positionPanel(rect);
  document.body.appendChild(panelEl);

  const textarea  = panelEl.querySelector('textarea');
  const submitBtn = panelEl.querySelector('.rdp-fp-submit');
  const cancelBtn = panelEl.querySelector('.rdp-fp-cancel');

  setTimeout(() => textarea.focus(), 50);

  cancelBtn.addEventListener('click', closePanel);
  submitBtn.addEventListener('click', () => submitFeedback(textarea.value.trim(), submitBtn));
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitFeedback(textarea.value.trim(), submitBtn);
    if (e.key === 'Escape') closePanel();
  });
}

function positionPanel(rect) {
  let left = rect.right + 12;
  let top  = rect.top;
  if (left + PANEL_WIDTH > window.innerWidth - 16)  left = rect.left - PANEL_WIDTH - 12;
  if (left < 8)                                      left = 8;
  if (top + PANEL_HEIGHT > window.innerHeight - 16)  top = window.innerHeight - PANEL_HEIGHT - 16;
  if (top < 8)                                       top = 8;
  panelEl.style.left = left + 'px';
  panelEl.style.top  = top  + 'px';
}

function closePanel() {
  removePanel();
  removeHighlight();
  annotating = false;
  resetBtn();
}

function removePanel() {
  if (panelEl) {
    panelEl.remove();
    panelEl = null;
  }
}

// --- submit ---
async function submitFeedback(comment, submitBtn) {
  if (!comment) return;
  const label = pendingData.componentChain.slice(-1)[0] || pendingData.tagName.toLowerCase();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  try {
    const res = await fetch(`${SERVER}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pendingData, comment }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast(`${label} · queued`, 'success');
  } catch (err) {
    console.error('[feedback] Submit failed:', err);
    showToast('Could not reach server — is `npm run dev` running?', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send';
    removePanel();
    removeHighlight();
    pendingData = null;
  }
}

// --- route visibility (prototype pages only) ---
function updateButtonVisibility() {
  btn.style.display = /^\/playground\/.+/.test(location.pathname) ? '' : 'none';
}
updateButtonVisibility();
const _origPushState = history.pushState.bind(history);
history.pushState = (...args) => { _origPushState(...args); updateButtonVisibility(); };
window.addEventListener('popstate', updateButtonVisibility);

// --- toast ---
function showToast(msg, type) {
  document.getElementById('rdp-feedback-toast')?.remove();
  const t = document.createElement('div');
  t.id = 'rdp-feedback-toast';
  t.className = type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), TOAST_DURATION);
}
