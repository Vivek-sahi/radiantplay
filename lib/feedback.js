// Radiant Play — click-to-annotate feedback layer (dev only)
// Runs only on localhost. Never bundled into production builds.

if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  throw new Error('[feedback] Not on localhost — aborting.');
}

const SERVER = 'http://localhost:3737';
let annotating = false;
let highlightEl = null;
let panelEl = null;
let selectedEl = null;
let selectedData = null;

const ICON_COMMENT = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M7 1C3.686 1 1 3.41 1 6.4c0 1.664.784 3.152 2.016 4.16L2.5 13l2.8-1.4C5.72 11.76 6.352 11.8 7 11.8c3.314 0 6-2.41 6-5.4S10.314 1 7 1Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const ICON_CANCEL = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M2 2l10 10M12 2 2 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;

// --- toggle button ---
const btn = document.createElement('button');
btn.id = 'rdp-feedback-btn';
btn.innerHTML = `${ICON_COMMENT} Edit`;
document.body.appendChild(btn);

btn.addEventListener('click', () => {
  annotating = !annotating;
  btn.innerHTML = annotating ? `${ICON_CANCEL} Cancel` : `${ICON_COMMENT} Edit`;
  btn.classList.toggle('active', annotating);
  if (!annotating) {
    removeHighlight();
    removePanel();
  }
});

// --- highlight box ---
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
  h.style.left = r.left + window.scrollX + 'px';
  h.style.top = r.top + window.scrollY + 'px';
  h.style.width = r.width + 'px';
  h.style.height = r.height + 'px';
  h.style.display = 'block';
}

function removeHighlight() {
  if (highlightEl) {
    highlightEl.style.display = 'none';
  }
}

// --- mousemove ---
document.addEventListener('mousemove', (e) => {
  if (!annotating || panelEl) return;
  const target = e.target;
  if (!target || target === btn || target === highlightEl) return;
  positionHighlight(target);
}, { capture: true });

// --- click capture ---
document.addEventListener('click', (e) => {
  if (!annotating) return;
  const target = e.target;
  if (!target || target === btn || target === highlightEl) return;
  if (panelEl) return; // already open

  e.preventDefault();
  e.stopPropagation();

  const r = target.getBoundingClientRect();
  selectedEl = target;
  selectedData = {
    ts: new Date().toISOString(),
    url: location.href,
    prototypeName: getPrototypeName(),
    selector: buildSelector(target),
    componentChain: getReactComponentChain(target),
    tagName: target.tagName,
    textContent: target.textContent?.trim().slice(0, 200) ?? '',
    outerHTMLSnippet: target.outerHTML.slice(0, 300),
    boundingBox: { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) },
  };

  openPanel(r);
}, { capture: true });

// --- helpers ---
function getPrototypeName() {
  // URL pattern: /playground/<PrototypeName>
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
      sel += '#' + node.id;
      parts.unshift(sel);
      break;
    }
    if (node.className && typeof node.className === 'string') {
      const cls = node.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) sel += '.' + cls;
    }
    const siblings = node.parentElement ? [...node.parentElement.children].filter(c => c.tagName === node.tagName) : [];
    if (siblings.length > 1) {
      const idx = siblings.indexOf(node) + 1;
      sel += `:nth-child(${idx})`;
    }
    parts.unshift(sel);
    node = node.parentElement;
    depth++;
  }
  return parts.join(' > ');
}

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
  panelEl = document.createElement('div');
  panelEl.id = 'rdp-feedback-panel';

  const chain = selectedData.componentChain.slice(-3).join(' › ') || selectedData.tagName;
  const text = selectedData.textContent.slice(0, 60);

  panelEl.innerHTML = `
    <div class="rdp-fp-title">Edit</div>
    <div class="rdp-fp-meta">${chain}${text ? ' · "' + text + '"' : ''}</div>
    <textarea placeholder="What would you like to change?" autofocus></textarea>
    <div class="rdp-fp-actions">
      <button class="rdp-fp-cancel">Cancel</button>
      <button class="rdp-fp-submit">Send</button>
    </div>
  `;

  // position panel near element, keep inside viewport
  const panelW = 320;
  const panelH = 200;
  let left = rect.right + 12;
  let top = rect.top + window.scrollY;
  if (left + panelW > window.innerWidth - 16) left = rect.left - panelW - 12;
  if (left < 8) left = 8;
  if (top + panelH > window.scrollY + window.innerHeight - 16) top = window.scrollY + window.innerHeight - panelH - 16;
  panelEl.style.left = left + 'px';
  panelEl.style.top = top + 'px';

  document.body.appendChild(panelEl);

  const textarea = panelEl.querySelector('textarea');
  const submitBtn = panelEl.querySelector('.rdp-fp-submit');
  const cancelBtn = panelEl.querySelector('.rdp-fp-cancel');

  setTimeout(() => textarea.focus(), 50);

  cancelBtn.addEventListener('click', () => {
    removePanel();
    annotating = false;
    btn.textContent = 'Annotate';
    btn.classList.remove('active');
    removeHighlight();
  });

  submitBtn.addEventListener('click', () => submitFeedback(textarea.value.trim(), submitBtn));

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      submitFeedback(textarea.value.trim(), submitBtn);
    }
    if (e.key === 'Escape') cancelBtn.click();
  });
}

function removePanel() {
  if (panelEl) {
    panelEl.remove();
    panelEl = null;
  }
}

async function submitFeedback(comment, submitBtn) {
  if (!comment) return;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const payload = { ...selectedData, comment };

  try {
    const res = await fetch(`${SERVER}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Annotation saved', 'success');
  } catch {
    showToast('Start server with `npm run feedback`', 'error');
  } finally {
    removePanel();
    removeHighlight();
    annotating = false;
    btn.textContent = 'Annotate';
    btn.classList.remove('active');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send';
  }
}

// --- toast ---
function showToast(msg, type) {
  const existing = document.getElementById('rdp-feedback-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'rdp-feedback-toast';
  t.className = type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
