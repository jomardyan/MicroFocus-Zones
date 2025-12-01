// Guard against multiple injections
if (typeof window.__MICROFOCUS_LOADED__ === 'undefined') {
  window.__MICROFOCUS_LOADED__ = true;
  
  const overlayId = 'microfocus-overlay';
  let overlayEl = null;
  let countdownInterval = null;
  let currentTheme = 'system';

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'enforcement') return;
  if (message.allowed) {
    clearOverlay();
    if (message.temporary && message.expires) {
      showBadge(`Break until ${new Date(message.expires).toLocaleTimeString()}`);
    }
    return;
  }
  showGate(message);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.theme) {
    currentTheme = changes.theme.newValue || 'system';
    applyTheme(currentTheme);
  }
});

initTheme();

function showGate(payload) {
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    overlayEl.id = overlayId;
    overlayEl.innerHTML = `
      <div class="mfz-card">
        <div class="mfz-label">MicroFocus Zone</div>
        <div class="mfz-title">Stay aligned with "<span id="mfz-task"></span>"</div>
        <div class="mfz-reason" id="mfz-reason"></div>
        <div class="mfz-actions">
          <button class="mfz-btn primary" id="mfz-allow">Let it through</button>
          <button class="mfz-btn" id="mfz-break">5-min break</button>
          <button class="mfz-btn subtle" id="mfz-offtask">Mark off-task</button>
          <button class="mfz-btn ghost" id="mfz-block">Keep blocked</button>
        </div>
        <div class="mfz-note">This page looked unrelated. Confirm how it fits your current focus.</div>
      </div>
    `;
    document.documentElement.appendChild(overlayEl);
    overlayEl.querySelector('#mfz-allow').addEventListener('click', () => sendDecision('allow'));
    overlayEl.querySelector('#mfz-break').addEventListener('click', () => sendDecision('break'));
    overlayEl.querySelector('#mfz-offtask').addEventListener('click', () => sendDecision('off-task'));
    overlayEl.querySelector('#mfz-block').addEventListener('click', () => sendDecision('block'));
  }
  const taskLabel = overlayEl.querySelector('#mfz-task');
  const reasonEl = overlayEl.querySelector('#mfz-reason');
  if (taskLabel) taskLabel.textContent = payload.taskTitle || 'this task';
  if (reasonEl) reasonEl.textContent = payload.reason || 'Looks unrelated to your Zone.';
  overlayEl.style.display = 'flex';
  overlayEl.dataset.state = 'blocked';
}

function clearOverlay() {
  if (overlayEl) {
    overlayEl.style.display = 'none';
    overlayEl.dataset.state = 'clear';
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function showBadge(text) {
  let badge = document.getElementById('mfz-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'mfz-badge';
    badge.className = 'mfz-badge';
    document.documentElement.appendChild(badge);
  }
  badge.textContent = text;
  badge.style.display = 'inline-flex';
  setTimeout(() => {
    if (badge) badge.style.display = 'none';
  }, 4000);
}

function sendDecision(decision) {
  chrome.runtime.sendMessage({
    type: 'gateDecision',
    decision,
    url: location.href,
    title: document.title
  });
}

async function initTheme() {
  try {
    const { theme } = await chrome.storage.local.get('theme');
    currentTheme = theme || 'system';
    applyTheme(currentTheme);
  } catch (e) {
    // ignore
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.dataset.theme = 'light';
  } else if (theme === 'dark') {
    root.dataset.theme = 'dark';
  } else {
    root.dataset.theme = prefersDark() ? 'dark' : 'light';
  }
}

function prefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

} // End guard - close the if statement
