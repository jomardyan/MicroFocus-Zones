const TASK_TEMPLATES = {
  writing: {
    title: 'Writing Session',
    notes: 'Focus on content creation. Block social media and distractions.',
    color: '#8b5cf6'
  },
  coding: {
    title: 'Coding Session',
    notes: 'Deep work on code. Keep docs and Stack Overflow accessible.',
    color: '#0ea5e9'
  },
  research: {
    title: 'Research Session',
    notes: 'Academic/topic research. Allow multiple sources, block news/social.',
    color: '#10b981'
  },
  design: {
    title: 'Design Session',
    notes: 'UI/UX design work. Access Figma, Adobe tools, design resources.',
    color: '#f59e0b'
  },
  reading: {
    title: 'Reading Session',
    notes: 'Deep reading. Articles, papers, documentation only.',
    color: '#06b6d4'
  }
};

const DEFAULT_STATE = {
  tasks: [],
  activeTaskId: null,
  history: [],
  currentSession: null,
  overrides: {},
  theme: 'system',
  breakReminder: 30,
  focusGoal: 120,
  stats: {
    totalFocusTime: 0,
    totalSessions: 0,
    longestStreak: 0,
    currentStreak: 0,
    lastSessionDate: null,
    todayFocusTime: 0
  }
};

chrome.runtime.onInstalled.addListener(async (details) => {
  const current = await chrome.storage.local.get();
  if (Object.keys(current).length === 0) {
    await chrome.storage.local.set({ ...DEFAULT_STATE });
  }
  await ensureSidePanelBehavior();
  if (details?.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('tutorial.html') }).catch(() => {});
  }
});

chrome.runtime.onStartup?.addListener(async () => {
  await ensureSidePanelBehavior();
});

chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel directly when the toolbar icon is clicked.
  if (chrome.sidePanel?.open) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } else {
    chrome.runtime.openOptionsPage?.();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message, sender).then(sendResponse).catch((err) => {
      console.error('MicroFocus error', err);
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }
  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    evaluateTab(tabId, tab);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const state = await getState();
  const overrides = { ...(state.overrides || {}) };
  const key = String(tabId);
  if (overrides[key]) {
    delete overrides[key];
    await chrome.storage.local.set({ overrides });
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  evaluateTab(tabId);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'microfocus-timer') {
    const state = await getState();
    if (state.currentSession) {
      const durationMs = Date.now() - state.currentSession.startedAt;
      const durationMin = Math.round(durationMs / 60000);
      
      const updated = {
        ...state.currentSession,
        endedAt: Date.now(),
        finishedBy: 'timer',
        durationMinutes: durationMin
      };
      
      // Update statistics
      const stats = { ...(state.stats || {}) };
      stats.totalFocusTime = (stats.totalFocusTime || 0) + durationMin;
      stats.totalSessions = (stats.totalSessions || 0) + 1;
      const today = new Date().toDateString();
      if (stats.lastSessionDate === today) {
        stats.currentStreak = (stats.currentStreak || 0) + 1;
        stats.todayFocusTime = (stats.todayFocusTime || 0) + durationMin;
      } else {
        stats.currentStreak = 1;
        stats.todayFocusTime = durationMin;
      }
      stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);
      stats.lastSessionDate = today;
      
      const history = [updated, ...(state.history || [])].slice(0, 50);
      await chrome.storage.local.set({
        currentSession: null,
        history,
        activeTaskId: null,
        overrides: {},
        stats
      });
      broadcast({ type: 'timerFinished', session: updated });
      await refreshAllTabs();
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon-128.png'),
        title: 'Focus timer finished',
        message: `Great work! "${state.currentSession.taskTitle}" session completed.`,
        priority: 2
      }).catch(() => {});
    }
  }
  
  if (alarm.name === 'microfocus-break-reminder') {
    const state = await getState();
    if (state.currentSession && state.activeTaskId) {
      const elapsedMin = Math.round((Date.now() - state.currentSession.startedAt) / 60000);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon-128.png'),
        title: 'Break time suggested',
        message: `You\'ve been focused for ${elapsedMin} minutes. Take a quick break!`,
        priority: 1
      }).catch(() => {});
      
      // Re-schedule the next reminder
      const breakReminderMins = state.breakReminder || 30;
      const nextReminderTime = Date.now() + (breakReminderMins * 60 * 1000);
      chrome.alarms.create('microfocus-break-reminder', { when: nextReminderTime });
    }
  }
});

const messageHandlers = {
  async getState() {
    const state = await getState();
    return { ok: true, state };
  },

  async setTheme(message) {
    const theme = message.theme || 'system';
    await chrome.storage.local.set({ theme });
    broadcastState();
    return { ok: true };
  },

  async createTask(message) {
    const { title, notes } = message;
    const state = await getState();
    const task = {
      id: crypto.randomUUID(),
      title,
      notes: notes || '',
      tabs: [],
      createdAt: Date.now()
    };
    const tasks = [task, ...state.tasks];
    await chrome.storage.local.set({ tasks });
    broadcastState();
    return { ok: true, task };
  },

  async updateTask(message) {
    const state = await getState();
    const tasks = state.tasks.map((t) =>
      t.id === message.id ? { ...t, ...message.updates } : t
    );
    await chrome.storage.local.set({ tasks });
    broadcastState();
    return { ok: true };
  },

  async captureTabs(message) {
    const state = await getState();
    const task = state.tasks.find((t) => t.id === message.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const snapshot = await Promise.all(
      tabs.filter((t) => !!t.url).map(async (t) => {
        const scroll = await getScrollPositionSafe(t.id);
        return {
          url: t.url,
          title: t.title || '',
          pinned: t.pinned,
          lastSeen: Date.now(),
          scroll
        };
      })
    );
    const tasks = state.tasks.map((t) =>
      t.id === task.id ? { ...t, tabs: snapshot } : t
    );
    await chrome.storage.local.set({ tasks });
    broadcastState();
    return { ok: true, tabs: snapshot };
  },

  async activateTask(message) {
    const state = await getState();
    const task = state.tasks.find((t) => t.id === message.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    const session = {
      taskId: task.id,
      taskTitle: task.title,
      startedAt: Date.now(),
      gateBypasses: 0,
      shortBreaks: 0,
      offTask: 0,
      allowedResearch: 0
    };
    await chrome.storage.local.set({
      activeTaskId: task.id,
      currentSession: session,
      overrides: {}
    });
    broadcastState();
    await refreshAllTabs();
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-128.png'),
      title: 'Zone activated',
      message: `Focus mode: "${task.title}"`,
      priority: 1
    }).catch(() => {});
    
    // Set break reminder if enabled
    const breakReminderMins = state.breakReminder || 0;
    if (breakReminderMins > 0) {
      const reminderTime = Date.now() + (breakReminderMins * 60 * 1000);
      chrome.alarms.create('microfocus-break-reminder', { when: reminderTime });
    }
    
    return { ok: true };
  },

  async deactivateTask() {
    const state = await getState();
    if (!state.currentSession) {
      return { ok: true };
    }
    const taskTitle = state.currentSession.taskTitle;
    const durationMs = Date.now() - state.currentSession.startedAt;
    const durationMin = Math.round(durationMs / 60000);
    
    const completed = {
      ...state.currentSession,
      endedAt: Date.now(),
      finishedBy: 'manual',
      durationMinutes: durationMin
    };
    
    // Update statistics
    const stats = { ...(state.stats || {}) };
    stats.totalFocusTime = (stats.totalFocusTime || 0) + durationMin;
    stats.totalSessions = (stats.totalSessions || 0) + 1;
    
    // Update streak
    const today = new Date().toDateString();
    if (stats.lastSessionDate === today) {
      stats.currentStreak = (stats.currentStreak || 0) + 1;
    } else {
      stats.currentStreak = 1;
    }
    stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);
    stats.lastSessionDate = today;
    
    const history = [completed, ...(state.history || [])].slice(0, 50);
    await chrome.storage.local.set({
      activeTaskId: null,
      currentSession: null,
      history,
      overrides: {},
      stats
    });
    broadcastState();
    await refreshAllTabs();
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-128.png'),
      title: 'Zone exited',
      message: `Session ended: ${durationMin}m on "${taskTitle}"`,
      priority: 1
    }).catch(() => {});
    return { ok: true };
  },

  async startTimer(message) {
    const state = await getState();
    if (!state.currentSession) {
      throw new Error('Start a task first');
    }
    const durationMs = (message.minutes || 25) * 60 * 1000;
    const timerEndsAt = Date.now() + durationMs;
    const currentSession = { ...state.currentSession, timerEndsAt };
    await chrome.storage.local.set({ currentSession });
    chrome.alarms.create('microfocus-timer', { when: timerEndsAt });
    broadcast({ type: 'timerStarted', endsAt: timerEndsAt });
    broadcastState();
    return { ok: true, endsAt: timerEndsAt };
  },

  async stopTimer() {
    await chrome.alarms.clear('microfocus-timer');
    const state = await getState();
    if (state.currentSession) {
      const currentSession = { ...state.currentSession };
      delete currentSession.timerEndsAt;
      await chrome.storage.local.set({ currentSession });
      broadcastState();
    }
    return { ok: true };
  },

  async gateDecision(message, sender) {
    const tabId = message.tabId || sender?.tab?.id;
    if (!tabId) {
      throw new Error('Missing tab id for gate decision');
    }
    const { decision, url, title } = message;
    const state = await getState();
    const overrides = { ...(state.overrides || {}) };
    const session = state.currentSession
      ? { ...state.currentSession }
      : null;

    if (decision === 'allow') {
      overrides[tabId] = { status: 'allow' };
      if (session) session.allowedResearch += 1;
      await sendEnforcement(tabId, { allowed: true });
    } else if (decision === 'break') {
      const expires = Date.now() + 5 * 60 * 1000;
      overrides[tabId] = { status: 'break', expires };
      if (session) session.shortBreaks += 1;
      await sendEnforcement(tabId, { allowed: true, temporary: true, expires });
    } else if (decision === 'block') {
      if (session) session.offTask += 1;
      await sendEnforcement(tabId, {
        allowed: false,
        reason: 'Blocked by MicroFocus gate'
      });
    } else {
      // off-task acknowledgement, keep overlay visible
      if (session) session.offTask += 1;
      await sendEnforcement(tabId, {
        allowed: false,
        reason: 'Marked as off-task'
      });
    }

    if (session) {
      session.gateBypasses += decision === 'allow' ? 1 : 0;
    }

    await chrome.storage.local.set({
      overrides,
      currentSession: session || state.currentSession
    });
    broadcastState();
    return { ok: true };
  },

  async selfTestOverlay() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');
    await sendEnforcement(tab.id, {
      allowed: false,
      taskTitle: 'Self-test',
      reason: 'Testing the MicroFocus overlay'
    });
    return { ok: true };
  },

  async deleteTask(message) {
    const state = await getState();
    const tasks = state.tasks.filter((t) => t.id !== message.taskId);
    const updates = { tasks };
    if (state.activeTaskId === message.taskId) {
      updates.activeTaskId = null;
      updates.currentSession = null;
      updates.overrides = {};
    }
    await chrome.storage.local.set(updates);
    broadcastState();
    return { ok: true };
  },

  async restoreTabs(message) {
    const state = await getState();
    const task = state.tasks.find((t) => t.id === message.taskId);
    if (!task || !task.tabs?.length) {
      throw new Error('No tabs found in this capsule');
    }
    const created = [];
    for (const tab of task.tabs) {
      try {
        const newTab = await chrome.tabs.create({
          url: tab.url,
          active: false
        });
        created.push(newTab);
        if (tab.scroll) {
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: (scroll) => {
                window.scrollX = scroll.x || 0;
                window.scrollY = scroll.y || 0;
              },
              args: [tab.scroll]
            }).catch(() => {});
          }, 500);
        }
      } catch (e) {
        console.error('Failed to restore tab:', tab.url, e);
      }
    }
    return { ok: true, restored: created.length };
  },

  async createTaskFromTemplate(message) {
    const template = TASK_TEMPLATES[message.templateId];
    if (!template) {
      throw new Error('Template not found');
    }
    const state = await getState();
    const task = {
      id: crypto.randomUUID(),
      title: template.title,
      notes: template.notes,
      tabs: [],
      createdAt: Date.now(),
      color: template.color
    };
    const tasks = [task, ...state.tasks];
    await chrome.storage.local.set({ tasks });
    broadcastState();
    return { ok: true, task };
  },

  async setBreakReminder(message) {
    await chrome.storage.local.set({ breakReminder: message.minutes });
    broadcastState();
    return { ok: true };
  },

  async setFocusGoal(message) {
    await chrome.storage.local.set({ focusGoal: message.minutes });
    broadcastState();
    return { ok: true };
  },

  async exportHistory() {
    const state = await getState();
    const csv = generateCSV(state.history, state.stats);
    return { ok: true, csv };
  }
};

async function getState() {
  const state = await chrome.storage.local.get();
  return { ...DEFAULT_STATE, ...state };
}

async function evaluateTab(tabId, existingTab) {
  const state = await getState();
  if (!state.activeTaskId) {
    await sendEnforcement(tabId, { allowed: true });
    return;
  }
  const task = state.tasks.find((t) => t.id === state.activeTaskId);
  if (!task) {
    await sendEnforcement(tabId, { allowed: true });
    return;
  }
  const overrides = state.overrides || {};
  const override = overrides[tabId];
  if (override?.status === 'allow') {
    await sendEnforcement(tabId, { allowed: true });
    return;
  }
  if (override?.status === 'break') {
    if (override.expires && override.expires > Date.now()) {
      await sendEnforcement(tabId, {
        allowed: true,
        temporary: true,
        expires: override.expires
      });
      return;
    }
    delete overrides[tabId];
    await chrome.storage.local.set({ overrides });
  }

  const tab = existingTab || (await safeGetTab(tabId));
  if (!tab || !tab.url) {
    return;
  }
  const allowed = isRelevant(tab, task);
  if (allowed) {
    await sendEnforcement(tabId, { allowed: true });
    return;
  }

  await sendEnforcement(tabId, {
    allowed: false,
    taskTitle: task.title,
    reason: 'Looks unrelated to the active Zone'
  });
}

function extractKeywords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

function expandKeywords(keywords) {
  // Semantic expansion: common related terms
  const expansions = {
    'blog': ['post', 'article', 'writing', 'content'],
    'esp32': ['iot', 'embedded', 'microcontroller', 'firmware', 'ota', 'update'],
    'coding': ['code', 'programming', 'developer', 'script', 'function'],
    'design': ['ui', 'ux', 'figma', 'sketch', 'layout', 'visual'],
    'video': ['youtube', 'vimeo', 'stream', 'watch', 'media'],
    'documentation': ['docs', 'guide', 'manual', 'reference', 'spec'],
    'research': ['article', 'paper', 'study', 'academic', 'journal'],
    'testing': ['test', 'debug', 'qa', 'cypress', 'jest'],
    'deployment': ['deploy', 'production', 'server', 'hosting', 'cloud'],
  };
  
  const expanded = new Set([...keywords]);
  keywords.forEach((kw) => {
    if (expansions[kw]) {
      expansions[kw].forEach((exp) => expanded.add(exp));
    }
  });
  return Array.from(expanded);
}

function scoreTabRelevance(tab, task) {
  const taskKeywords = extractKeywords(`${task.title} ${task.notes || ''}`);
  if (!taskKeywords.length) return 1; // Neutral score
  
  const expandedKeywords = expandKeywords(taskKeywords);
  const tabText = `${tab.url} ${tab.title || ''}`.toLowerCase();
  
  let score = 0;
  let matched = 0;
  
  // Exact keyword matches (higher weight)
  taskKeywords.forEach((k) => {
    if (tabText.includes(k)) {
      matched++;
      score += 2;
    }
  });
  
  // Expanded keyword matches (lower weight)
  expandedKeywords.forEach((k) => {
    if (!taskKeywords.includes(k) && tabText.includes(k)) {
      matched++;
      score += 1;
    }
  });
  
  // Domain matching from captured tabs
  const captured = task.tabs || [];
  const tabHost = getHost(tab.url);
  if (tabHost && captured.some((t) => {
    const host = getHost(t.url);
    return host && host === tabHost;
  })) {
    score += 3;
    matched++;
  }
  
  // Calculate relevance threshold
  const threshold = Math.max(1, Math.ceil(taskKeywords.length * 0.3));
  return matched >= threshold ? score : -1;
}

function isRelevant(tab, task) {
  if (!tab.url) return true;
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) return true;

  const score = scoreTabRelevance(tab, task);
  return score >= 0;
}

function getHost(url) {
  try {
    return new URL(url).host;
  } catch (e) {
    return null;
  }
}

async function sendEnforcement(tabId, payload) {
  try {
    await ensureContentScript(tabId);
    await chrome.tabs.sendMessage(tabId, { type: 'enforcement', ...payload });
  } catch (e) {
    // Tab may not support content scripts (e.g., chrome://)
  }
}

async function refreshAllTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    await evaluateTab(tab.id, tab);
  }
}

async function getScrollPositionSafe(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({ x: window.scrollX, y: window.scrollY })
    });
    return result;
  } catch (e) {
    return { x: 0, y: 0 };
  }
}

async function safeGetTab(tabId) {
  try {
    return await chrome.tabs.get(tabId);
  } catch (e) {
    return null;
  }
}

function broadcast(payload) {
  chrome.runtime.sendMessage(payload).catch(() => {});
}

function broadcastState() {
  broadcast({ type: 'stateUpdated' });
}

async function ensureSidePanelBehavior() {
  if (!chrome.sidePanel?.setPanelBehavior) return;
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (e) {
    // Older Chrome might not support this; ignore.
  }
}

async function ensureContentScript(tabId) {
  if (!tabId) return;
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (e) {
    // Some pages disallow injection (e.g., chrome://); ignore silently.
  }
}

function generateCSV(history, stats) {
  let csv = 'Task Title,Start Time,Duration (min),Gates Bypassed,Breaks,Off-Task,Finished By\n';
  history.forEach((entry) => {
    const start = new Date(entry.startedAt).toISOString();
    const duration = entry.durationMinutes || Math.round((entry.endedAt - entry.startedAt) / 60000);
    const gates = entry.gateBypasses || 0;
    const breaks = entry.shortBreaks || 0;
    const offTask = entry.offTask || 0;
    const finishedBy = entry.finishedBy || 'unknown';
    csv += `"${entry.taskTitle}","${start}",${duration},${gates},${breaks},${offTask},"${finishedBy}"\n`;
  });
  csv += '\n\nOverall Statistics\n';
  csv += `Total Focus Time (min),${stats.totalFocusTime || 0}\n`;
  csv += `Total Sessions,${stats.totalSessions || 0}\n`;
  csv += `Current Streak (days),${stats.currentStreak || 0}\n`;
  csv += `Longest Streak (days),${stats.longestStreak || 0}\n`;
  return csv;
}
