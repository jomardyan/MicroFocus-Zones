let state = {
  tasks: [],
  activeTaskId: null,
  history: [],
  currentSession: null,
  theme: 'system'
};

let timerInterval = null;

  document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    loadState();
    wireKeyboardShortcuts();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'stateUpdated') {
      loadState();
    }
    if (message.type === 'timerFinished') {
      toast('Focus timer finished');
      loadState();
    }
    if (message.type === 'timerStarted') {
      startTimerTicker(message.endsAt);
    }
  });
});

function wireEvents() {
  const form = document.getElementById('new-task-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const notes = document.getElementById('task-notes').value.trim();
    if (!title) return;
    await send('createTask', { title, notes });
    form.reset();
    loadState();
  });

  // Templates toggle
  const templatesToggle = document.getElementById('templates-toggle');
  const templatesSection = document.getElementById('templates-section');
  if (templatesToggle) {
    templatesToggle.addEventListener('click', () => {
      templatesSection.style.display = templatesSection.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Template buttons
  document.querySelectorAll('.template-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const templateId = btn.dataset.template;
      try {
        const res = await send('createTaskFromTemplate', { templateId });
        toast(`Template applied: ${res.task.title}`);
        templatesSection.style.display = 'none';
        loadState();
      } catch (err) {
        toast('Failed to create task from template');
      }
    });
  });

  // Break reminder
  const breakReminderSelect = document.getElementById('break-reminder');
  if (breakReminderSelect) {
    breakReminderSelect.addEventListener('change', async (e) => {
      await send('setBreakReminder', { minutes: parseInt(e.target.value) });
      toast('Break reminder updated');
    });
  }

  // Focus goal
  const focusGoalInput = document.getElementById('focus-goal');
  if (focusGoalInput) {
    focusGoalInput.addEventListener('blur', async () => {
      const goal = parseInt(focusGoalInput.value);
      if (goal >= 30) {
        await send('setFocusGoal', { minutes: goal });
        toast('Focus goal updated');
      }
    });
  }

  // Export CSV
  const exportCsv = document.getElementById('export-csv');
  if (exportCsv) {
    exportCsv.addEventListener('click', async () => {
      try {
        const res = await send('exportHistory');
        downloadCSV(res.csv, 'microfocus-sessions.csv');
        toast('History exported');
      } catch (err) {
        toast('Export failed');
      }
    });
  }

  document.getElementById('task-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'activate') {
      await send('activateTask', { taskId: id });
      toast('Zone activated');
      loadState();
    }
    if (action === 'capture') {
      await send('captureTabs', { taskId: id });
      toast('Captured current window tabs');
      loadState();
    }
    if (action === 'restore') {
      try {
        const res = await send('restoreTabs', { taskId: id });
        toast(`Restored ${res.restored} tabs`);
      } catch (err) {
        toast('No tabs to restore in this capsule');
      }
    }
    if (action === 'delete') {
      if (confirm('Delete this Zone? This cannot be undone.')) {
        await send('deleteTask', { taskId: id });
        toast('Zone deleted');
        loadState();
      }
    }
  });

  const selfTest = document.getElementById('self-test');
  selfTest.addEventListener('click', async () => {
    try {
      await send('selfTestOverlay');
      toast('Overlay sent to this tab');
    } catch (e) {
      toast(e.message || 'Self-test failed');
    }
  });

  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', async () => {
    const next = nextTheme(state.theme || 'system');
    state.theme = next;
    applyTheme(next);
    updateThemeButton();
    await send('setTheme', { theme: next });
  });

  const helpBtn = document.getElementById('help-btn');
  helpBtn.addEventListener('click', () => {
    showHelp();
  });
}

function wireKeyboardShortcuts() {
  document.addEventListener('keydown', async (e) => {
    // Alt+Shift+1: Start 25m timer (if task active)
    if (e.altKey && e.shiftKey && e.key === '1' && state.activeTaskId) {
      await send('startTimer', { minutes: 25 });
      toast('25-minute focus started');
    }
    // Alt+Shift+2: Start 50m timer (if task active)
    if (e.altKey && e.shiftKey && e.key === '2' && state.activeTaskId) {
      await send('startTimer', { minutes: 50 });
      toast('50-minute focus started');
    }
    // Alt+Shift+X: Exit active zone
    if (e.altKey && e.shiftKey && e.key === 'X' && state.activeTaskId) {
      await send('deactivateTask');
      toast('Exited Zone');
      loadState();
    }
    // Alt+Shift+S: Stop timer
    if (e.altKey && e.shiftKey && e.key === 'S' && state.currentSession?.timerEndsAt) {
      await send('stopTimer');
      toast('Timer stopped');
      loadState();
    }
  });
}

async function loadState() {
  try {
    const res = await send('getState');
    state = res.state;
    applyTheme(state.theme || 'system');
    updateThemeButton();
    
    // Load settings
    const breakReminderSelect = document.getElementById('break-reminder');
    if (breakReminderSelect && state.breakReminder !== undefined) {
      breakReminderSelect.value = state.breakReminder;
    }
    const focusGoalInput = document.getElementById('focus-goal');
    if (focusGoalInput && state.focusGoal) {
      focusGoalInput.value = state.focusGoal;
    }
    
    render();
  } catch (e) {
    toast(e.message || 'Failed to load state');
  }
}

function render() {
  renderActive();
  renderTasks();
  renderHistory();
  renderStats();
}

function renderStats() {
  const container = document.getElementById('stats');
  const stats = state.stats || {};
  const focusGoal = state.focusGoal || 120;
  const todayProgress = stats.todayFocusTime || 0;
  const progressPercent = Math.min(100, Math.round((todayProgress / focusGoal) * 100));
  const progressBar = `
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progressPercent}%"></div>
      <div class="progress-text">${todayProgress}/${focusGoal}m</div>
    </div>
  `;
  
  container.innerHTML = `
    <div class="stat">
      <div class="label">Today's progress</div>
      ${progressBar}
    </div>
    <div class="stat">
      <div class="label">Total focus time</div>
      <div class="stat-value">${stats.totalFocusTime || 0}m</div>
    </div>
    <div class="stat">
      <div class="label">Sessions completed</div>
      <div class="stat-value">${stats.totalSessions || 0}</div>
    </div>
    <div class="stat">
      <div class="label">Current streak</div>
      <div class="stat-value">${stats.currentStreak || 0}d</div>
    </div>
    <div class="stat">
      <div class="label">Longest streak</div>
      <div class="stat-value">${stats.longestStreak || 0}d</div>
    </div>
  `;
}

function renderActive() {
  const active = state.tasks.find((t) => t.id === state.activeTaskId);
  const titleEl = document.getElementById('active-title');
  const body = document.getElementById('active-body');
  const status = document.getElementById('active-status');
  const actions = document.getElementById('active-actions');
  actions.innerHTML = '';

  if (!active) {
    titleEl.textContent = 'No Zone running';
    body.textContent = 'Choose a task capsule to enter a MicroFocus Zone.';
    status.textContent = 'Idle';
    status.classList.remove('live');
    stopTimerTicker();
    return;
  }

  titleEl.textContent = active.title;
  status.textContent = 'Live';
  status.classList.add('live');

  const session = state.currentSession || {};
  const timerEndsAt = session.timerEndsAt;
  if (timerEndsAt) {
    startTimerTicker(timerEndsAt);
  } else {
    stopTimerTicker();
  }

  body.innerHTML = `
    <div class="muted">Notes: ${active.notes || '—'}</div>
    <div class="stat-grid">
      <div class="stat"><div class="label">Gates bypassed</div><div>${session.gateBypasses || 0}</div></div>
      <div class="stat"><div class="label">Breaks</div><div>${session.shortBreaks || 0}</div></div>
      <div class="stat"><div class="label">Off-task</div><div>${session.offTask || 0}</div></div>
      <div class="stat"><div class="label">Research</div><div>${session.allowedResearch || 0}</div></div>
    </div>
  `;

  actions.innerHTML = `
    <div class="timer-presets">
      <button class="btn secondary" data-action="start-15">15m</button>
      <button class="btn secondary" data-action="start-25">25m</button>
      <button class="btn secondary" data-action="start-45">45m</button>
      <button class="btn secondary" data-action="start-50">50m</button>
      <button class="btn secondary" data-action="start-60">60m</button>
    </div>
    <button class="btn" data-action="capture-active">Capture tabs</button>
    <button class="btn ghost" data-action="stop-task">Exit Zone</button>
  `;

  actions.onclick = async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'start-15') {
      await send('startTimer', { minutes: 15 });
      toast('15-minute focus started');
    }
    if (action === 'start-25') {
      await send('startTimer', { minutes: 25 });
      toast('25-minute focus started');
    }
    if (action === 'start-50') {
      await send('startTimer', { minutes: 50 });
      toast('50-minute focus started');
    }
    if (action === 'start-45') {
      await send('startTimer', { minutes: 45 });
      toast('45-minute focus started');
    }
    if (action === 'start-60') {
      await send('startTimer', { minutes: 60 });
      toast('60-minute focus started');
    }
    if (action === 'capture-active') {
      await send('captureTabs', { taskId: active.id });
      toast('Captured current window tabs');
      loadState();
    }
    if (action === 'stop-task') {
      await send('deactivateTask');
      toast('Exited Zone');
      loadState();
    }
  };
}

function renderTasks() {
  const list = document.getElementById('task-list');
  if (!state.tasks.length) {
    list.textContent = 'No Zones yet.';
    return;
  }
  list.innerHTML = state.tasks
    .map((task) => {
      const isActive = task.id === state.activeTaskId;
      const tabCount = task.tabs ? task.tabs.length : 0;
      return `
        <div class="task-row">
          <div>
            <div class="title">${task.title}</div>
            <div class="meta">Tabs saved: ${tabCount} • ${task.notes || 'No notes'}</div>
          </div>
          <div class="row-actions">
            <button class="btn secondary" data-action="capture" data-id="${task.id}" title="Capture current tabs">Capture</button>
            ${tabCount > 0 ? `<button class="btn secondary" data-action="restore" data-id="${task.id}" title="Restore all saved tabs">Restore</button>` : ''}
            ${
              isActive
                ? '<span class="pill live">Active</span>'
                : `<button class="btn primary" data-action="activate" data-id="${task.id}">Enter</button>`
            }
            <button class="btn ghost" data-action="delete" data-id="${task.id}" title="Delete Zone">×</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderHistory() {
  const container = document.getElementById('history');
  if (!state.history.length) {
    container.textContent = 'No focus sessions yet.';
    return;
  }
  container.innerHTML = state.history
    .slice(0, 10)
    .map((entry) => {
      const duration = entry.durationMinutes || Math.max(1, Math.round((entry.endedAt - entry.startedAt) / 60000));
      const start = new Date(entry.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const gatesBypass = entry.gateBypasses || 0;
      const breaks = entry.shortBreaks || 0;
      const offTask = entry.offTask || 0;
      return `
        <div class="history-row">
          <div class="headline">${entry.taskTitle || 'Untitled task'}</div>
          <div class="meta">
            ${start} • ${duration}m 
            ${gatesBypass > 0 ? `• ⚠ ${gatesBypass} gate${gatesBypass !== 1 ? 's' : ''}` : ''}
            ${breaks > 0 ? `• ☕ ${breaks} break${breaks !== 1 ? 's' : ''}` : ''}
            ${offTask > 0 ? `• ❌ ${offTask} off-task` : ''}
          </div>
        </div>
      `;
    })
    .join('');
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2600);
}

function startTimerTicker(endsAt) {
  stopTimerTicker();
  const status = document.getElementById('active-status');
  const tick = () => {
    const remaining = endsAt - Date.now();
    if (remaining <= 0) {
      status.textContent = 'Timer done';
      stopTimerTicker();
      return;
    }
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000)
      .toString()
      .padStart(2, '0');
    status.textContent = `Live • ${minutes}:${seconds}`;
  };
  tick();
  timerInterval = setInterval(tick, 1000);
}

function stopTimerTicker() {
  const status = document.getElementById('active-status');
  status.textContent = state.activeTaskId ? 'Live' : 'Idle';
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function send(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || 'Unknown error'));
        return;
      }
      resolve(response);
    });
  });
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

function nextTheme(current) {
  if (current === 'system') return 'light';
  if (current === 'light') return 'dark';
  return 'system';
}

function updateThemeButton() {
  const btn = document.getElementById('theme-toggle');
  const label = state.theme || 'system';
  btn.textContent = `Theme: ${label[0].toUpperCase()}${label.slice(1)}`;
}

function prefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function showHelp() {
  const shortcuts = `
⌨️ Keyboard Shortcuts:
• Alt+Shift+1 — Start 25m timer
• Alt+Shift+2 — Start 50m timer
• Alt+Shift+S — Stop timer
• Alt+Shift+X — Exit Zone

💡 Quick Tips:
• Capture tabs to save your workspace
• Restore tabs to re-open them later
• Break gate = 5-min temporary pass
• Off-task = full block with tracking
  `;
  alert(shortcuts);
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
