const root = document.documentElement;
const toggle = document.getElementById('tutorial-theme-toggle');

init();

toggle.addEventListener('click', async () => {
  const next = nextTheme(toggle.dataset.theme || 'system');
  applyTheme(next);
  toggle.dataset.theme = next;
  updateLabel();
  try {
    await chrome.storage?.local.set({ theme: next });
  } catch (e) {
    // ignore if storage unavailable
  }
});

async function init() {
  let theme = 'system';
  try {
    const stored = await chrome.storage?.local.get('theme');
    theme = stored?.theme || 'system';
  } catch (e) {
    // ignore
  }
  applyTheme(theme);
  toggle.dataset.theme = theme;
  updateLabel();
}

function applyTheme(theme) {
  if (theme === 'light') {
    root.dataset.theme = 'light';
  } else if (theme === 'dark') {
    root.dataset.theme = 'dark';
  } else {
    root.dataset.theme = prefersDark() ? 'dark' : 'light';
  }
}

function nextTheme(current) {
  if (current === 'system') return 'light';
  if (current === 'light') return 'dark';
  return 'system';
}

function updateLabel() {
  const t = toggle.dataset.theme || 'system';
  toggle.textContent = `Theme: ${t[0].toUpperCase()}${t.slice(1)}`;
}

function prefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
