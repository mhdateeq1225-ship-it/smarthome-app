/* ================================================================
   EnergyIQ v2 — Smart Home Energy Monitor
   script.js — Full Application Logic
================================================================ */

'use strict';

/* ---------------------------------------------------------------
   CONSTANTS & CONFIG
--------------------------------------------------------------- */
const RATE_PER_KWH  = 0.12;   // $ per kWh
const CO2_PER_KWH   = 0.233;  // kg CO₂ per kWh
const ALERT_DEFAULT = 500;     // kWh threshold

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', AED: 'د.إ' };

const CATEGORY_ICONS = {
  Cooling:       '🌬️',
  Heating:       '🔥',
  Lighting:      '💡',
  Kitchen:       '🍳',
  Entertainment: '📺',
  Washing:       '🫧',
  Other:         '🔌',
};

/* ---------------------------------------------------------------
   STATE — single source of truth
--------------------------------------------------------------- */
let state = {
  devices:      [],   // { id, name, category, kwh, location, brand, wattage, addedAt }
  notifications:[],   // { id, type, icon, iconClass, title, body, time, unread }
  currentUser:  null, // { username, name, email, address }
  accounts:     [],   // registered accounts (simulated DB)
  prefs: {
    darkMode:     true,
    alerts:       true,
    emailNotif:   false,
    weeklySummary:false,
    notificationMethod: 'app',
    energyTarget: 500,
    rememberLogin: false,
    autoRefresh:  false,
    threshold:    ALERT_DEFAULT,
    currency:     'USD',
  },
  budget: {
    monthlyLimit: 150,
    currentSpent: 0,
  },
  goals: {
    weeklyTarget: 400,
    reductionTarget: 15,
  },
  achievements: {
    firstDevice: null,
    fiveDevices: null,
  },
  integrations: {
    mobileNotif: false,
    emailDigest: false,
    smartHome: false,
    utility: false,
    calendar: false,
    export: false,
  },
  automationRules: [],
  gamification: {
    streak: 0,
    points: 0,
    badges: 3,
  },
  charts: {
    energy:   null,
    category: null,
    pie:      null,
    trend:    null,
  },
  autoRefreshTimer: null,
};

/* ---------------------------------------------------------------
   LOCAL STORAGE HELPERS
--------------------------------------------------------------- */
function save() {
  localStorage.setItem('eiq_devices',       JSON.stringify(state.devices));
  localStorage.setItem('eiq_notifications', JSON.stringify(state.notifications));
  localStorage.setItem('eiq_accounts',      JSON.stringify(state.accounts));
  localStorage.setItem('eiq_prefs',         JSON.stringify(state.prefs));
  localStorage.setItem('eiq_budget',        JSON.stringify(state.budget));
  localStorage.setItem('eiq_goals',         JSON.stringify(state.goals));
  localStorage.setItem('eiq_achievements',  JSON.stringify(state.achievements));
  localStorage.setItem('eiq_integrations',  JSON.stringify(state.integrations));
  localStorage.setItem('eiq_automationRules', JSON.stringify(state.automationRules));
  localStorage.setItem('eiq_gamification',  JSON.stringify(state.gamification));
  if (state.currentUser) {
    localStorage.setItem('eiq_current_user', JSON.stringify(state.currentUser));
  }
}

function load() {
  try {
    const d  = localStorage.getItem('eiq_devices');
    const n  = localStorage.getItem('eiq_notifications');
    const a  = localStorage.getItem('eiq_accounts');
    const p  = localStorage.getItem('eiq_prefs');
    const cu = localStorage.getItem('eiq_current_user');
    const b  = localStorage.getItem('eiq_budget');
    const g  = localStorage.getItem('eiq_goals');
    const ach = localStorage.getItem('eiq_achievements');
    const integ = localStorage.getItem('eiq_integrations');
    const ar = localStorage.getItem('eiq_automationRules');
    const gam = localStorage.getItem('eiq_gamification');

    if (d)  state.devices       = JSON.parse(d);
    if (n)  state.notifications = JSON.parse(n);
    if (a)  state.accounts      = JSON.parse(a);
    if (p)  state.prefs         = { ...state.prefs, ...JSON.parse(p) };
    if (cu) state.currentUser   = JSON.parse(cu);
    if (b)  state.budget        = { ...state.budget, ...JSON.parse(b) };
    if (g)  state.goals         = { ...state.goals, ...JSON.parse(g) };
    if (ach) state.achievements = { ...state.achievements, ...JSON.parse(ach) };
    if (integ) state.integrations = { ...state.integrations, ...JSON.parse(integ) };
    if (ar) state.automationRules = JSON.parse(ar);
    if (gam) state.gamification = { ...state.gamification, ...JSON.parse(gam) };
  } catch (e) {
    console.warn('EnergyIQ: Failed to load state from localStorage', e);
  }

  // Ensure default admin account always exists
  if (!state.accounts.find(acc => acc.username === 'admin')) {
    state.accounts.push({ username: 'admin', password: '1234', name: 'Admin User', email: 'admin@energyiq.app', address: '', plan: 'Free' });
    save();
  }
}

/* ---------------------------------------------------------------
   HELPERS
--------------------------------------------------------------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatCurrency(amount) {
  const sym = CURRENCY_SYMBOLS[state.prefs.currency] || '$';
  return `${sym}${amount.toFixed(2)}`;
}

function calcCost(kwh) {
  return parseFloat(kwh) * RATE_PER_KWH * 30; // monthly
}

function calcCO2(kwh) {
  return (parseFloat(kwh) * CO2_PER_KWH).toFixed(1);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function showToast(el) {
  if (!el) return;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 2800);
}

function efficiencyScore(total) {
  if (total === 0)   return 'A+';
  if (total < 200)   return 'A+';
  if (total < 400)   return 'A';
  if (total < 700)   return 'B';
  if (total < 1000)  return 'C';
  if (total < 1500)  return 'D';
  return 'F';
}

/* ---------------------------------------------------------------
   THEME
--------------------------------------------------------------- */
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const icon  = dark ? '🌙' : '☀️';
  const label = dark ? '🌙 Dark Mode' : '☀️ Light Mode';
  const desktopBtn = document.getElementById('theme-toggle');
  const mobileBtn  = document.getElementById('theme-toggle-mobile');
  if (desktopBtn) desktopBtn.textContent = label;
  if (mobileBtn)  mobileBtn.textContent  = icon;
  const settingsChk = document.getElementById('settings-dark-mode');
  if (settingsChk) settingsChk.checked = dark;
}

function toggleTheme() {
  state.prefs.darkMode = !state.prefs.darkMode;
  applyTheme(state.prefs.darkMode);
  save();
  refreshCharts();
}

function getLastLoginLabel() {
  const ts = localStorage.getItem('eiq_last_login');
  if (!ts) return '—';
  const date = new Date(ts);
  return isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

/* ---------------------------------------------------------------
   SCREEN NAVIGATION (Login ↔ App)
--------------------------------------------------------------- */
function showApp() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-shell').classList.add('active');
  initApp();
}

function showLogin() {
  document.getElementById('app-shell').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  prefillRememberedLogin();
  document.getElementById('password').value  = '';
  document.getElementById('login-error').classList.add('hidden');
}

function prefillRememberedLogin() {
  const remembered = localStorage.getItem('eiq_remember_username') || '';
  const usernameEl = document.getElementById('username');
  const rememberEl = document.getElementById('remember-me');
  if (usernameEl) usernameEl.value = remembered;
  if (rememberEl) rememberEl.checked = state.prefs.rememberLogin;
}

function handleGuestLogin() {
  state.currentUser = {
    username: 'guest',
    name:     'Guest User',
    email:    '',
    address:  '',
    plan:     'Guest',
  };
  localStorage.removeItem('eiq_current_user');
  showApp();
}

function handleForgotPassword(event) {
  event.preventDefault();
  const errEl = document.getElementById('login-error');
  if (errEl) {
    errEl.textContent = 'Password reset is not available in demo mode. Use admin / 1234 or create a new account.';
    errEl.classList.remove('hidden');
  }
}

/* ---------------------------------------------------------------
   AUTH — LOGIN
--------------------------------------------------------------- */
function handleLogin() {
  const uname = document.getElementById('username').value.trim();
  const pw    = document.getElementById('password').value;
  const remember = document.getElementById('remember-me')?.checked;
  const errEl = document.getElementById('login-error');

  const account = state.accounts.find(
    a => a.username === uname && a.password === pw
  );

  if (account) {
    errEl.classList.add('hidden');
    state.currentUser = {
      username: account.username,
      name:     account.name || account.username,
      email:    account.email || '',
      address:  account.address || '',
      plan:     account.plan || 'Free',
    };
    state.prefs.rememberLogin = remember;
    if (remember) {
      localStorage.setItem('eiq_remember_username', uname);
    } else {
      localStorage.removeItem('eiq_remember_username');
    }
    localStorage.setItem('eiq_last_login', new Date().toISOString());
    save();
    localStorage.setItem('eiq_current_user', JSON.stringify(state.currentUser));
    showApp();
  } else {
    if (errEl) {
      errEl.textContent = 'Incorrect credentials. Try admin / 1234 or create a new account.';
      errEl.classList.remove('hidden');
    }
    const input = document.getElementById('username');
    if (input) {
      input.style.borderColor = 'var(--danger)';
      setTimeout(() => { input.style.borderColor = ''; }, 1500);
    }
  }
}

/* ---------------------------------------------------------------
   AUTH — 
--------------------------------------------------------------- */
function handleSignup() {
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const pw       = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const errEl    = document.getElementById('signup-error');
  const sucEl    = document.getElementById('signup-success');

  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  if (!name || !email || !username || !pw || pw.length < 4) {
    errEl.textContent = 'Please fill in all fields. Password must be at least 4 characters.';
    errEl.classList.remove('hidden');
    return;
  }
  if (pw !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.classList.remove('hidden');
    return;
  }
  if (state.accounts.find(a => a.username === username)) {
    errEl.textContent = 'Username already taken. Choose a different one.';
    errEl.classList.remove('hidden');
    return;
  }

  state.accounts.push({ username, password: pw, name, email, address: '', plan: 'Free' });
  save();

  sucEl.classList.remove('hidden');

  // Clear signup fields
  ['signup-name','signup-email','signup-username','signup-password','signup-confirm']
    .forEach(id => { document.getElementById(id).value = ''; });

  // Switch to sign-in tab after short delay
  setTimeout(() => {
    switchAuthTab('signin');
    sucEl.classList.add('hidden');
    document.getElementById('username').value = username;
  }, 2000);
}

/* ---------------------------------------------------------------
   AUTH — LOGOUT
--------------------------------------------------------------- */
function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem('eiq_current_user');
  stopAutoRefresh();
  showLogin();
}

/* ---------------------------------------------------------------
   AUTH TAB SWITCHER
--------------------------------------------------------------- */
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.auth-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tab}`);
  });
}

/* ---------------------------------------------------------------
   PASSWORD TOGGLE
--------------------------------------------------------------- */
function togglePasswordVisibility(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (!input || !btn) return;
  const isText = input.type === 'text';
  input.type   = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁' : '🙈';
}

/* ---------------------------------------------------------------
   PAGE NAVIGATION
--------------------------------------------------------------- */
function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  // Show target
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const linkEl = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (linkEl) linkEl.classList.add('active');

  // Close mobile sidebar
  closeSidebar();

  // Lazy-render page-specific content
  switch (page) {
    case 'dashboard':     renderDashboard();     break;
    case 'analytics':     renderAnalytics();     break;
    case 'devices':       renderDevicesTable();  break;
    case 'notifications': renderNotifications(); break;
    case 'budget':        renderBudget();        break;
    case 'goals':         renderGoals();         break;
    case 'achievements':  renderAchievements();  break;
    case 'sustainability': renderSustainability(); break;
    case 'integrations':  renderIntegrations();  break;
    case 'recommendations': renderRecommendations(); break;
    case 'benchmarking':  renderBenchmarking();  break;
    case 'automation':    renderAutomation();    break;
    case 'weather':       renderWeather();       break;
    case 'gamification':  renderGamification();  break;
    case 'settings':      renderSettings();      break;
  }
}

/* ---------------------------------------------------------------
   SIDEBAR (Mobile)
--------------------------------------------------------------- */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  let overlay = document.getElementById('sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeSidebar);
  }
  overlay.classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.classList.remove('active');
}

/* ---------------------------------------------------------------
   INIT APP
--------------------------------------------------------------- */
function initApp() {
  updateSidebarUser();
  applyTheme(state.prefs.darkMode);
  updateDashboardGreeting();
  renderDashboard();
  updateNotifDot();
  startAutoRefresh();
}

function updateSidebarUser() {
  if (!state.currentUser) return;
  const u = state.currentUser;
  const name    = u.name || u.username;
  const initial = name.charAt(0).toUpperCase();

  const avatarEl   = document.getElementById('sidebar-avatar');
  const usernameEl = document.getElementById('sidebar-username');
  const roleEl     = document.getElementById('sidebar-role');

  if (avatarEl)   avatarEl.textContent   = initial;
  if (usernameEl) usernameEl.textContent = name;
  if (roleEl)     roleEl.textContent     = u.email ? 'Home Owner' : 'Guest';
}

function updateDashboardGreeting() {
  const el = document.getElementById('dashboard-greeting');
  if (el) {
    const name = state.currentUser?.name || state.currentUser?.username || 'User';
    el.textContent = `${greeting()}, ${name}! Here's your energy overview.`;
  }
}

/* ---------------------------------------------------------------
   DASHBOARD RENDER
--------------------------------------------------------------- */
function renderDashboard() {
  const devices = state.devices;
  const total   = devices.reduce((s, d) => s + parseFloat(d.kwh || 0), 0);
  const count   = devices.length;
  const avg     = count ? (total / count) : 0;
  const top     = [...devices].sort((a, b) => b.kwh - a[1])[0];
  const cost    = calcCost(total);
  const co2     = calcCO2(total);
  const target  = state.prefs.energyTarget || 500;
  const goalPct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  const roomMap = devices.reduce((map, device) => {
    const loc = device.location || 'Unknown';
    map[loc] = (map[loc] || 0) + parseFloat(device.kwh || 0);
    return map;
  }, {});
  const topRoom = Object.entries(roomMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  setText('stat-total',   `${total.toFixed(1)} <span>kWh</span>`);
  setText('stat-devices', count);
  setText('stat-top',     top ? top.name : '—');
  setText('stat-avg',     `${avg.toFixed(1)} <span>kWh</span>`);
  setText('stat-cost',    `${formatCurrency(cost)} <span></span>`);
  setText('stat-co2',     `${co2} <span>kg</span>`);
  setText('stat-goal',    `${goalPct} <span>%</span>`);
  setText('stat-goal-note', `Target ${target} kWh this week`);
  setText('stat-top-room', escHtml(topRoom));
  renderOverviewSummary(total, target, topRoom, goalPct);

  // Total note
  const noteEl = document.getElementById('stat-total-note');
  if (noteEl) noteEl.textContent = count > 0 ? `Across ${count} device${count > 1 ? 's' : ''}` : 'All devices combined';

  // Efficiency Score
  const effGrade = calculateEfficiencyGrade(total);
  setText('efficiency-grade', effGrade.grade);
  setText('efficiency-desc', effGrade.desc);

  // Alert banner
  const threshold = state.prefs.threshold || ALERT_DEFAULT;
  const banner = document.getElementById('alert-banner');
  const badge  = document.getElementById('alert-badge');
  if (state.prefs.alerts && total > threshold) {
    banner?.classList.remove('hidden');
    badge?.classList.remove('hidden');
  } else {
    banner?.classList.add('hidden');
    badge?.classList.add('hidden');
  }

  renderEnergyChart();
  renderUsageTrendChart();
  renderRecentDevices();
}

function setText(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function renderOverviewSummary(total, target, topRoom, goalPct) {
  const acctType = state.currentUser?.plan || (state.currentUser?.username === 'admin' ? 'Administrator' : state.currentUser?.username === 'guest' ? 'Guest' : 'Free');
  setText('overview-account-type', escHtml(acctType));
  setText('overview-weekly-target', `${target} kWh`);
  setText('overview-alert-channel', state.prefs.notificationMethod ? state.prefs.notificationMethod.charAt(0).toUpperCase() + state.prefs.notificationMethod.slice(1) : 'App');
  setText('overview-goal-progress', `${goalPct}%`);
}

/* ---------------------------------------------------------------
   ENERGY CHART (Dashboard)
--------------------------------------------------------------- */
function renderEnergyChart() {
  const devices  = state.devices;
  const placeholder = document.getElementById('chart-placeholder');
  const canvas   = document.getElementById('energy-chart');
  if (!canvas) return;

  if (devices.length === 0) {
    placeholder?.classList.remove('hidden');
    canvas.style.display = 'none';
    if (state.charts.energy) { state.charts.energy.destroy(); state.charts.energy = null; }
    return;
  }

  placeholder?.classList.add('hidden');
  canvas.style.display = 'block';

  const labels = devices.map(d => d.name);
  const data   = devices.map(d => parseFloat(d.kwh));
  const type   = document.getElementById('chart-type-select')?.value || 'bar';
  const isDark = state.prefs.darkMode;
  const textColor = isDark ? '#7fa8d0' : '#4a6a9a';
  const gridColor = isDark ? 'rgba(26,51,86,0.6)' : 'rgba(200,216,238,0.6)';

  const colors = data.map((_, i) => {
    const hue = (200 + i * 37) % 360;
    return `hsla(${hue}, 70%, 60%, 0.85)`;
  });

  if (state.charts.energy) {
    state.charts.energy.destroy();
    state.charts.energy = null;
  }

  const ctx = canvas.getContext('2d');

  const config = {
    type,
    data: {
      labels,
      datasets: [{
        label: 'Usage (kWh)',
        data,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.85', '1')),
        borderWidth: type === 'bar' ? 0 : 2,
        borderRadius: type === 'bar' ? 6 : 0,
        hoverOffset: type !== 'bar' ? 10 : 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type !== 'bar',
          labels: { color: textColor, font: { family: 'DM Sans', size: 12 }, padding: 14 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y ?? ctx.parsed} kWh  |  ${formatCurrency(calcCost(ctx.parsed.y ?? ctx.parsed))}`,
          },
        },
      },
      scales: type === 'bar' ? {
        x: { ticks: { color: textColor, font: { family: 'DM Sans', size: 11 } }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, font: { family: 'DM Sans', size: 11 } }, grid: { color: gridColor }, beginAtZero: true },
      } : {},
    },
  };

  state.charts.energy = new Chart(ctx, config);
}

function generateWeeklyTrend(total) {
  const base = total / 7;
  const pattern = [0.95, 1.05, 1.12, 0.88, 1.00, 1.08, 0.92];
  return pattern.map((mult, idx) => ({
    label: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][idx],
    value: parseFloat((base * mult).toFixed(1)),
  }));
}

function renderUsageTrendChart() {
  const canvas = document.getElementById('trend-chart');
  const placeholder = document.getElementById('trend-placeholder');
  if (!canvas) return;

  if (!state.devices.length) {
    placeholder?.classList.remove('hidden');
    canvas.style.display = 'none';
    if (state.charts.trend) { state.charts.trend.destroy(); state.charts.trend = null; }
    return;
  }

  const total = state.devices.reduce((sum, d) => sum + parseFloat(d.kwh || 0), 0);
  if (total <= 0) {
    placeholder?.classList.remove('hidden');
    canvas.style.display = 'none';
    if (state.charts.trend) { state.charts.trend.destroy(); state.charts.trend = null; }
    return;
  }

  placeholder?.classList.add('hidden');
  canvas.style.display = 'block';

  const trendData = generateWeeklyTrend(total);
  const labels = trendData.map(point => point.label);
  const data = trendData.map(point => point.value);
  const isDark = state.prefs.darkMode;
  const textColor = isDark ? '#7fa8d0' : '#4a6a9a';
  const gridColor = isDark ? 'rgba(26,51,86,0.6)' : 'rgba(200,216,238,0.6)';

  if (state.charts.trend) {
    state.charts.trend.destroy();
    state.charts.trend = null;
  }

  state.charts.trend = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Estimated usage',
        data,
        borderColor: 'rgba(29,124,242,0.95)',
        backgroundColor: 'rgba(29,124,242,0.16)',
        pointBackgroundColor: 'rgba(255,255,255,0.9)',
        pointBorderColor: 'rgba(29,124,242,0.95)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} kWh`,
          },
        },
      },
      scales: {
        x: { ticks: { color: textColor, font: { family: 'DM Sans', size: 11 } }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, font: { family: 'DM Sans', size: 11 } }, grid: { color: gridColor }, beginAtZero: true },
      },
    },
  });
}

/* ---------------------------------------------------------------
   RECENT DEVICES (Dashboard)
--------------------------------------------------------------- */
function renderRecentDevices() {
  const list = document.getElementById('recent-devices-list');
  if (!list) return;

  const recent = [...state.devices]
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .slice(0, 5);

  if (recent.length === 0) {
    list.innerHTML = '<div class="empty-inline">No devices yet</div>';
    return;
  }

  list.innerHTML = recent.map(d => `
    <div class="recent-item">
      <div class="recent-item-left">
        <div class="recent-item-icon">${CATEGORY_ICONS[d.category] || '🔌'}</div>
        <div>
          <div class="recent-item-name">${escHtml(d.name)}</div>
          <div class="recent-item-meta">${escHtml(d.category)} · ${escHtml(d.location || '—')} · ${timeAgo(d.addedAt)}</div>
        </div>
      </div>
      <div class="recent-item-kwh">${parseFloat(d.kwh).toFixed(1)} kWh</div>
    </div>
  `).join('');
}

/* ---------------------------------------------------------------
   ANALYTICS RENDER
--------------------------------------------------------------- */
function renderAnalytics() {
  const devices = state.devices;
  const total   = devices.reduce((s, d) => s + parseFloat(d.kwh || 0), 0);

  setText('an-total-devices', devices.length);
  setText('an-efficiency',    efficiencyScore(total));

  // Category totals
  const catMap = {};
  devices.forEach(d => {
    catMap[d.category] = (catMap[d.category] || 0) + parseFloat(d.kwh);
  });
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  setText('an-top-category', sortedCats.length ? sortedCats[0][0] : '—');

  // Last added
  const last = [...devices].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))[0];
  setText('an-last-added', last ? escHtml(last.name) : '—');

  renderAnalyticsInsights(sortedCats, last);
  renderCategoryChart(sortedCats);
  renderPieChart(sortedCats);
  renderTop5();
}

function renderAnalyticsInsights(sortedCats, last) {
  const topArea = sortedCats.length ? `${sortedCats[0][0]} · ${sortedCats[0][1].toFixed(1)} kWh` : 'Add devices for analysis';
  const action = sortedCats.length
    ? `Target a ${Math.min(18, Math.max(12, Math.round(sortedCats[0][1] / 20)))}% reduction in ${sortedCats[0][0]} usage.`
    : 'Collect device data to generate recommendations.';
  const quickWin = last ? `Review scheduling for ${escHtml(last.name)} and reduce idle runtime.` : 'Add recent device data to find quick wins.';
  const goal = sortedCats.length
    ? 'Aim to reduce the top category by 12–18% this cycle.'
    : 'Build the analytics profile with device entries.';

  setText('insight-top-area', topArea);
  setText('insight-action', action);
  setText('insight-quick-win', quickWin);
  setText('insight-goal', goal);
}

function renderCategoryChart(sortedCats) {
  const canvas = document.getElementById('category-chart');
  const placeholder = document.getElementById('cat-placeholder');
  if (!canvas) return;

  if (!sortedCats.length) {
    placeholder?.classList.remove('hidden');
    canvas.style.display = 'none';
    if (state.charts.category) { state.charts.category.destroy(); state.charts.category = null; }
    return;
  }

  placeholder?.classList.add('hidden');
  canvas.style.display = 'block';

  const isDark = state.prefs.darkMode;
  const textColor = isDark ? '#7fa8d0' : '#4a6a9a';
  const gridColor = isDark ? 'rgba(26,51,86,0.6)' : 'rgba(200,216,238,0.6)';

  if (state.charts.category) { state.charts.category.destroy(); state.charts.category = null; }

  const colors = sortedCats.map((_, i) => `hsla(${(200 + i * 45) % 360},65%,58%,0.85)`);

  state.charts.category = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: sortedCats.map(c => c[0]),
      datasets: [{
        label: 'kWh',
        data:  sortedCats.map(c => c[1].toFixed(1)),
        backgroundColor: colors,
        borderRadius: 6,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { family: 'DM Sans', size: 11 } }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, font: { family: 'DM Sans', size: 11 } }, grid: { color: gridColor }, beginAtZero: true },
      },
    },
  });
}

function renderPieChart(sortedCats) {
  const canvas = document.getElementById('pie-chart');
  const placeholder = document.getElementById('pie-placeholder');
  if (!canvas) return;

  if (!sortedCats.length) {
    placeholder?.classList.remove('hidden');
    canvas.style.display = 'none';
    if (state.charts.pie) { state.charts.pie.destroy(); state.charts.pie = null; }
    return;
  }

  placeholder?.classList.add('hidden');
  canvas.style.display = 'block';

  const isDark = state.prefs.darkMode;
  const textColor = isDark ? '#7fa8d0' : '#4a6a9a';

  if (state.charts.pie) { state.charts.pie.destroy(); state.charts.pie = null; }

  const colors = sortedCats.map((_, i) => `hsla(${(200 + i * 45) % 360},65%,58%,0.85)`);

  state.charts.pie = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: sortedCats.map(c => c[0]),
      datasets: [{
        data:   sortedCats.map(c => c[1].toFixed(1)),
        backgroundColor: colors,
        hoverOffset: 8,
        borderWidth: 2,
        borderColor: isDark ? '#0b1829' : '#ffffff',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor, font: { family: 'DM Sans', size: 11 }, padding: 12 } },
      },
      cutout: '62%',
    },
  });
}

function renderTop5() {
  const top5El  = document.getElementById('top5-list');
  const emptyEl = document.getElementById('top5-empty');
  if (!top5El) return;

  const sorted = [...state.devices].sort((a, b) => b.kwh - a.kwh).slice(0, 5);

  if (!sorted.length) {
    top5El.innerHTML = '';
    emptyEl?.classList.remove('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  const rankClass = i => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';

  top5El.innerHTML = sorted.map((d, i) => `
    <div class="top5-item">
      <div class="top5-rank ${rankClass(i)}">${i + 1}</div>
      <div class="top5-info">
        <div class="top5-name">${escHtml(d.name)}</div>
        <div class="top5-meta">${escHtml(d.category)} · ${escHtml(d.location || '—')} · ${formatCurrency(calcCost(d.kwh))}/mo</div>
      </div>
      <div class="top5-kwh">${parseFloat(d.kwh).toFixed(1)} kWh</div>
    </div>
  `).join('');
}

/* ---------------------------------------------------------------
   ADD DEVICE
--------------------------------------------------------------- */
function handleAddDevice() {
  const name     = document.getElementById('device-name').value.trim();
  const category = document.getElementById('device-category').value;
  const kwh      = parseFloat(document.getElementById('device-kwh').value);
  const location = document.getElementById('device-location').value.trim();
  const brand    = document.getElementById('device-brand').value.trim();
  const wattage  = document.getElementById('device-wattage').value.trim();
  const errEl    = document.getElementById('device-error');

  if (!name || !category || isNaN(kwh) || kwh < 0 || !location) {
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const device = { id: uid(), name, category, kwh, location, brand, wattage, addedAt: new Date().toISOString() };
  state.devices.push(device);

  // Auto-notification on add
  addNotification({
    type: 'success',
    icon: CATEGORY_ICONS[category] || '🔌',
    iconClass: 'green',
    title: 'Device Added',
    body: `"${name}" (${category}) was registered with ${kwh} kWh usage.`,
  });

  // High-usage alert notification
  const total = state.devices.reduce((s, d) => s + parseFloat(d.kwh), 0);
  if (state.prefs.alerts && total > (state.prefs.threshold || ALERT_DEFAULT)) {
    addNotification({
      type: 'warning',
      icon: '⚠️',
      iconClass: 'yellow',
      title: 'High Usage Alert',
      body: `Total energy usage (${total.toFixed(1)} kWh) exceeds your threshold of ${state.prefs.threshold} kWh.`,
    });
  }

  save();
  clearAddDeviceForm();
  showToast(document.getElementById('add-success'));
  updateNotifDot();
}

function clearAddDeviceForm() {
  ['device-name','device-category','device-kwh','device-location','device-brand','device-wattage']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  document.getElementById('cost-preview')?.classList.add('hidden');
  document.getElementById('device-error')?.classList.add('hidden');
}

function updateCostPreview() {
  const kwh    = parseFloat(document.getElementById('device-kwh')?.value);
  const preview = document.getElementById('cost-preview');
  if (!preview) return;

  if (!isNaN(kwh) && kwh > 0) {
    const cost = calcCost(kwh);
    const co2  = calcCO2(kwh);
    document.getElementById('cost-preview-val').textContent = formatCurrency(cost);
    document.getElementById('co2-preview-val').textContent  = `${co2} kg`;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
}

/* ---------------------------------------------------------------
   DEVICES TABLE
--------------------------------------------------------------- */
function renderDevicesTable() {
  const search   = (document.getElementById('search-input')?.value   || '').toLowerCase();
  const filterCat = document.getElementById('filter-category')?.value || '';
  const sortBy   = document.getElementById('sort-select')?.value      || 'newest';

  let devices = [...state.devices];

  // Filter
  if (search)    devices = devices.filter(d => d.name.toLowerCase().includes(search) || (d.location || '').toLowerCase().includes(search));
  if (filterCat) devices = devices.filter(d => d.category === filterCat);

  // Sort
  switch (sortBy) {
    case 'oldest':   devices.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt)); break;
    case 'newest':   devices.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)); break;
    case 'kwh-desc': devices.sort((a, b) => b.kwh - a.kwh);  break;
    case 'kwh-asc':  devices.sort((a, b) => a.kwh - b.kwh);  break;
    case 'name':     devices.sort((a, b) => a.name.localeCompare(b.name)); break;
  }

  const tbody  = document.getElementById('devices-tbody');
  const noEl   = document.getElementById('no-devices');
  const tableEl = document.getElementById('devices-table');
  const countEl = document.getElementById('device-count-pill');
  const totalEl = document.getElementById('table-total');
  const costEl  = document.getElementById('table-cost');

  if (countEl) countEl.textContent = `${state.devices.length} device${state.devices.length !== 1 ? 's' : ''}`;

  if (!devices.length) {
    tbody.innerHTML = '';
    noEl?.classList.remove('hidden');
    tableEl?.classList.add('hidden');
  } else {
    noEl?.classList.add('hidden');
    tableEl?.classList.remove('hidden');

    const maxKwh = Math.max(...devices.map(d => parseFloat(d.kwh)));

    tbody.innerHTML = devices.map((d, i) => {
      const kwh   = parseFloat(d.kwh);
      const pct   = maxKwh > 0 ? (kwh / maxKwh) * 100 : 0;
      const cost  = calcCost(kwh);
      const share = state.devices.reduce((s, dev) => s + parseFloat(dev.kwh), 0);
      const sharePct = share > 0 ? ((kwh / share) * 100).toFixed(1) : '0.0';

      return `
        <tr>
          <td class="row-num">${i + 1}</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.1rem;">${CATEGORY_ICONS[d.category] || '🔌'}</span>
              <div>
                <div style="font-weight:600;">${escHtml(d.name)}</div>
                ${d.brand ? `<div style="font-size:0.74rem;color:var(--text-muted);">${escHtml(d.brand)}</div>` : ''}
              </div>
            </div>
          </td>
          <td><span class="category-badge">${escHtml(d.category)}</span></td>
          <td style="color:var(--text-secondary);">${escHtml(d.location || '—')}</td>
          <td>
            <div class="usage-bar-wrap">
              <span style="min-width:46px;font-weight:600;">${kwh.toFixed(1)}</span>
              <div class="usage-bar-bg">
                <div class="usage-bar-fill" style="width:${pct}%;"></div>
              </div>
            </div>
          </td>
          <td style="color:var(--success);font-weight:600;">${formatCurrency(cost)}/mo</td>
          <td style="color:var(--text-muted);font-size:0.78rem;">${sharePct}%</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-ghost" style="padding:5px 10px;font-size:0.76rem;" onclick="editDevice('${d.id}')">✏️</button>
              <button class="btn btn-danger" onclick="deleteDevice('${d.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Table footer totals
  const allTotal = state.devices.reduce((s, d) => s + parseFloat(d.kwh), 0);
  if (totalEl) totalEl.textContent = `${allTotal.toFixed(1)} kWh`;
  if (costEl)  costEl.textContent  = `${formatCurrency(calcCost(allTotal))}/mo`;
}

/* ---------------------------------------------------------------
   EDIT / DELETE DEVICE
--------------------------------------------------------------- */
function deleteDevice(id) {
  const device = state.devices.find(d => d.id === id);
  if (!device) return;
  if (!confirm(`Delete "${device.name}"?`)) return;
  state.devices = state.devices.filter(d => d.id !== id);

  addNotification({
    type: 'danger',
    icon: '🗑️',
    iconClass: 'red',
    title: 'Device Removed',
    body: `"${device.name}" has been deleted from your device list.`,
  });

  save();
  renderDevicesTable();
  updateNotifDot();
}

function editDevice(id) {
  const device = state.devices.find(d => d.id === id);
  if (!device) return;

  // Navigate to add-device form with pre-filled values
  navigateTo('add-device');

  // Remove old device to avoid duplicates — we'll re-add on submit
  state.devices = state.devices.filter(d => d.id !== id);

  document.getElementById('device-name').value     = device.name;
  document.getElementById('device-category').value = device.category;
  document.getElementById('device-kwh').value      = device.kwh;
  document.getElementById('device-location').value = device.location || '';
  document.getElementById('device-brand').value    = device.brand    || '';
  document.getElementById('device-wattage').value  = device.wattage  || '';

  updateCostPreview();

  // Change button label to indicate editing
  const btn = document.getElementById('add-device-btn');
  if (btn) {
    btn.textContent = 'Update Device ✏️';
    btn._editing    = true;
  }
}

/* ---------------------------------------------------------------
   EXPORT CSV
--------------------------------------------------------------- */
function exportCSV() {
  if (!state.devices.length) {
    alert('No devices to export.');
    return;
  }

  const rows = [
    ['Name','Category','Location','Brand','Wattage (W)','Usage (kWh)','Est. Monthly Cost','CO2 (kg)','Added'],
    ...state.devices.map(d => [
      d.name, d.category, d.location || '', d.brand || '', d.wattage || '',
      d.kwh,
      calcCost(d.kwh).toFixed(2),
      calcCO2(d.kwh),
      new Date(d.addedAt).toLocaleString(),
    ]),
  ];

  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `EnergyIQ_Devices_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------
   NOTIFICATIONS
--------------------------------------------------------------- */
function addNotification({ type = 'unread', icon, iconClass, title, body }) {
  const notif = {
    id: uid(),
    type,
    icon,
    iconClass,
    title,
    body,
    time: new Date().toISOString(),
    unread: true,
  };
  state.notifications.unshift(notif);
  // Keep max 50
  if (state.notifications.length > 50) state.notifications = state.notifications.slice(0, 50);
  save();
}

function renderNotifications() {
  const list  = document.getElementById('notifications-list');
  const noEl  = document.getElementById('no-notifs');
  if (!list) return;

  // Seed default notifications if empty
  if (state.notifications.length === 0) {
    state.notifications = [
      { id: uid(), type: 'unread', icon: '⚡', iconClass: 'blue', title: 'Welcome to EnergyIQ!', body: 'Start tracking your home energy by adding devices.', time: new Date().toISOString(), unread: true },
      { id: uid(), type: 'success', icon: '✅', iconClass: 'green', title: 'Account Ready', body: 'Your EnergyIQ account is set up and ready to use.', time: new Date(Date.now() - 3600000).toISOString(), unread: false },
    ];
    save();
  }

  if (!state.notifications.length) {
    list.innerHTML = '';
    noEl?.classList.remove('hidden');
    return;
  }

  noEl?.classList.add('hidden');

  list.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.unread ? n.type || 'unread' : ''}" id="notif-${n.id}">
      <div class="notif-icon-wrap ${n.iconClass || 'blue'}">${n.icon || '🔔'}</div>
      <div class="notif-content">
        <div class="notif-title">${escHtml(n.title)}</div>
        <div class="notif-body">${escHtml(n.body)}</div>
        <div class="notif-time">${timeAgo(n.time)}</div>
      </div>
      <button class="notif-dismiss" onclick="dismissNotif('${n.id}')" title="Dismiss">✕</button>
    </div>
  `).join('');

  // Mark all as read
  state.notifications.forEach(n => { n.unread = false; });
  save();
  updateNotifDot();
}

function dismissNotif(id) {
  state.notifications = state.notifications.filter(n => n.id !== id);
  save();
  renderNotifications();
  updateNotifDot();
}

function clearAllNotifs() {
  state.notifications = [];
  save();
  renderNotifications();
  updateNotifDot();
}

function updateNotifDot() {
  const hasUnread = state.notifications.some(n => n.unread);
  const dot = document.getElementById('nav-notif-dot');
  if (dot) dot.classList.toggle('visible', hasUnread);
}

/* ---------------------------------------------------------------
   SETTINGS
--------------------------------------------------------------- */
function renderSettings() {
  if (!state.currentUser) return;
  const u = state.currentUser;

  const nameEl  = document.getElementById('settings-display-name');
  const emailEl = document.getElementById('settings-email');
  const addrEl  = document.getElementById('settings-address');

  if (nameEl)  nameEl.value  = u.name    || '';
  if (emailEl) emailEl.value = u.email   || '';
  if (addrEl)  addrEl.value  = u.address || '';

  // Prefs
  const p = state.prefs;
  const set = (id, val) => { const el = document.getElementById(id); if (!el) return; if (el.type === 'checkbox') el.checked = val; else el.value = val; };
  set('settings-dark-mode',   p.darkMode);
  set('settings-alerts',      p.alerts);
  set('settings-email-notif', p.emailNotif);
  set('settings-weekly-summary', p.weeklySummary);
  set('settings-autorefresh', p.autoRefresh);
  set('settings-notif-method', p.notificationMethod);
  set('settings-energy-target', p.energyTarget);

  const threshEl = document.getElementById('settings-threshold');
  if (threshEl) threshEl.value = p.threshold;

  const currEl = document.getElementById('settings-currency');
  if (currEl) currEl.value = p.currency;

  setText('account-plan', state.currentUser?.plan || (state.currentUser?.username === 'admin' ? 'Administrator' : state.currentUser?.username === 'guest' ? 'Guest' : 'Basic'));
  setText('account-devices', state.devices.length);
  setText('account-notif-method', p.notificationMethod.charAt(0).toUpperCase() + p.notificationMethod.slice(1));
  setText('account-last-login', getLastLoginLabel());
}

function saveProfile() {
  const name  = document.getElementById('settings-display-name')?.value.trim();
  const email = document.getElementById('settings-email')?.value.trim();
  const addr  = document.getElementById('settings-address')?.value.trim();

  if (!state.currentUser) return;
  state.currentUser.name    = name;
  state.currentUser.email   = email;
  state.currentUser.address = addr;

  // Update in accounts array too
  const acc = state.accounts.find(a => a.username === state.currentUser.username);
  if (acc) { acc.name = name; acc.email = email; acc.address = addr; }

  save();
  updateSidebarUser();
  showToast(document.getElementById('profile-saved'));
}

function savePrefs() {
  const getBool = id => document.getElementById(id)?.checked ?? false;
  state.prefs.darkMode         = getBool('settings-dark-mode');
  state.prefs.alerts           = getBool('settings-alerts');
  state.prefs.emailNotif       = getBool('settings-email-notif');
  state.prefs.weeklySummary    = getBool('settings-weekly-summary');
  state.prefs.notificationMethod = document.getElementById('settings-notif-method')?.value || 'app';
  state.prefs.energyTarget     = parseFloat(document.getElementById('settings-energy-target')?.value) || 500;
  state.prefs.autoRefresh      = getBool('settings-autorefresh');
  state.prefs.threshold        = parseFloat(document.getElementById('settings-threshold')?.value) || ALERT_DEFAULT;
  state.prefs.currency         = document.getElementById('settings-currency')?.value || 'USD';

  save();
  applyTheme(state.prefs.darkMode);
  startAutoRefresh();
  showToast(document.getElementById('prefs-saved'));
}

function changePassword() {
  const currPw   = document.getElementById('settings-curr-pw')?.value;
  const newPw    = document.getElementById('settings-new-pw')?.value;
  const confirmPw = document.getElementById('settings-confirm-pw')?.value;
  const errEl    = document.getElementById('pw-change-error');
  const sucEl    = document.getElementById('pw-change-success');

  errEl?.classList.add('hidden');
  sucEl?.classList.add('hidden');

  const acc = state.accounts.find(a => a.username === state.currentUser?.username);
  if (!acc || acc.password !== currPw) {
    errEl.textContent = 'Current password is incorrect.';
    errEl?.classList.remove('hidden');
    return;
  }
  if (!newPw || newPw.length < 4 || newPw !== confirmPw) {
    errEl.textContent = 'New passwords do not match or are too short (min. 4 chars).';
    errEl?.classList.remove('hidden');
    return;
  }

  acc.password = newPw;
  save();

  ['settings-curr-pw','settings-new-pw','settings-confirm-pw'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  sucEl?.classList.remove('hidden');
  setTimeout(() => sucEl?.classList.add('hidden'), 3000);
}

function clearAllDevices() {
  if (!confirm('This will permanently remove all devices. Are you sure?')) return;
  state.devices = [];
  addNotification({ type: 'danger', icon: '⚠️', iconClass: 'red', title: 'All Devices Cleared', body: 'All registered devices have been removed.' });
  save();
  updateNotifDot();
  alert('All devices cleared successfully.');
}

/* ---------------------------------------------------------------
   AUTO-REFRESH
--------------------------------------------------------------- */
function startAutoRefresh() {
  stopAutoRefresh();
  if (state.prefs.autoRefresh) {
    state.autoRefreshTimer = setInterval(() => {
      const activePage = document.querySelector('.page.active');
      if (!activePage) return;
      const pageId = activePage.id.replace('page-', '');
      if (pageId === 'dashboard') renderDashboard();
    }, 60000);
  }
}

function stopAutoRefresh() {
  if (state.autoRefreshTimer) {
    clearInterval(state.autoRefreshTimer);
    state.autoRefreshTimer = null;
  }
}

/* ---------------------------------------------------------------
   CHART REFRESH (on theme change)
--------------------------------------------------------------- */
function refreshCharts() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const pageId = activePage.id.replace('page-', '');
  if (pageId === 'dashboard') {
    renderEnergyChart();
    renderUsageTrendChart();
  }
  if (pageId === 'analytics') renderAnalytics();
}

/* ---------------------------------------------------------------
   BUDGET RENDER
--------------------------------------------------------------- */
function renderBudget() {
  const total = state.devices.reduce((s, d) => s + parseFloat(d.kwh || 0), 0);
  const spent = total * RATE_PER_KWH * 30;
  state.budget.currentSpent = spent;

  setText('budget-monthly', formatCurrency(state.budget.monthlyLimit));
  setText('budget-spent', formatCurrency(spent));
  setText('budget-status', spent > state.budget.monthlyLimit ? 'Over budget' : 'On track');
  setText('budget-savings', formatCurrency(Math.max(0, state.budget.monthlyLimit - spent)));

  const forecastList = document.getElementById('cost-forecast-list');
  if (forecastList) {
    forecastList.innerHTML = `
      <div style="display:grid;gap:10px;">
        <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);">
          <div style="font-size:0.85rem;color:var(--text-secondary);">Week 1-2</div>
          <div style="font-size:1.1rem;color:var(--text-primary);font-weight:700;">${formatCurrency(spent / 2)}</div>
        </div>
        <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);">
          <div style="font-size:0.85rem;color:var(--text-secondary);">Month End Projection</div>
          <div style="font-size:1.1rem;color:var(--text-primary);font-weight:700;">${formatCurrency(spent)}</div>
        </div>
      </div>
    `;
  }
}

/* ---------------------------------------------------------------
   GOALS RENDER
--------------------------------------------------------------- */
function renderGoals() {
  const total = state.devices.reduce((s, d) => s + parseFloat(d.kwh || 0), 0);
  const progressList = document.getElementById('goal-progress-list');
  if (progressList) {
    const pct = Math.min(100, Math.round((state.goals.weeklyTarget / Math.max(1, total)) * 100));
    progressList.innerHTML = `
      <div style="display:grid;gap:12px;">
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:0.85rem;color:var(--text-secondary);">Weekly Target</span>
            <span style="font-weight:700;">${pct}% of target</span>
          </div>
          <div style="width:100%;height:12px;background:var(--bg-elevated);border-radius:6px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:var(--blue-400);transition:width 0.3s;"></div>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${state.goals.weeklyTarget} kWh target</div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:0.85rem;color:var(--text-secondary);">Reduction Goal</span>
            <span style="font-weight:700;">${state.goals.reductionTarget}% reduction</span>
          </div>
          <div style="padding:8px;background:var(--bg-elevated);border-radius:var(--radius-sm);font-size:0.82rem;color:var(--text-secondary);">Aim to reduce consumption by ${state.goals.reductionTarget}% each week.</div>
        </div>
      </div>
    `;
  }
}

/* ---------------------------------------------------------------
   ACHIEVEMENTS RENDER
--------------------------------------------------------------- */
function renderAchievements() {
  // Update achievement dates
  if (state.devices.length > 0 && !state.achievements.firstDevice) {
    state.achievements.firstDevice = new Date().toLocaleDateString();
    save();
  }
  if (state.devices.length >= 5 && !state.achievements.fiveDevices) {
    state.achievements.fiveDevices = new Date().toLocaleDateString();
    save();
  }

  setText('achieve-first-device', state.achievements.firstDevice || '—');
  setText('achieve-five-devices', state.achievements.fiveDevices || '—');

  const highlightsList = document.getElementById('highlights-list');
  if (highlightsList) {
    const highlights = [
      { icon: '⚡', text: 'Dashboard updated with latest device data' },
      { icon: '🎯', text: 'Weekly energy target set to ' + state.goals.weeklyTarget + ' kWh' },
      { icon: '💰', text: 'Monthly budget set to ' + formatCurrency(state.budget.monthlyLimit) },
      { icon: '📈', text: 'Analytics insights generated based on device patterns' },
    ];
    highlightsList.innerHTML = highlights.map(h => `
      <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);display:flex;gap:10px;margin-bottom:8px;">
        <div style="font-size:1.2rem;">${h.icon}</div>
        <div style="font-size:0.88rem;color:var(--text-secondary);">${h.text}</div>
      </div>
    `).join('');
  }
}

/* ---------------------------------------------------------------
   SUSTAINABILITY RENDER
--------------------------------------------------------------- */
function renderSustainability() {
  const total = state.devices.reduce((s, d) => s + parseFloat(d.kwh || 0), 0);
  const co2 = calcCO2(total);
  const trees = Math.max(1, Math.round(total / 50)); // rough estimate

  setText('sustain-co2', `${co2} kg`);
  setText('sustain-trees', trees);
  setText('sustain-reduction', '15%'); // placeholder
  setText('sustain-saved', `${(total * 0.15).toFixed(1)} kg CO₂`);

  const impactList = document.getElementById('impact-list');
  if (impactList) {
    impactList.innerHTML = `
      <li style="padding:8px 0;border-bottom:1px solid var(--bg-border);">🌍 <strong>${co2} kg CO₂</strong> equivalent to driving a car ${Math.round(co2 * 2.4)} km</li>
      <li style="padding:8px 0;border-bottom:1px solid var(--bg-border);">🌳 Trees needed to offset: <strong>${trees}</strong> trees annually</li>
      <li style="padding:8px 0;border-bottom:1px solid var(--bg-border);">♻️ Reduction achieved: <strong>15%</strong> below baseline consumption</li>
      <li style="padding:8px 0;">🌱 Annual savings: <strong>${(total * 0.15).toFixed(1)} kg CO₂</strong> saved</li>
    `;
  }
}

/* ---------------------------------------------------------------
   INTEGRATIONS RENDER
--------------------------------------------------------------- */
function renderIntegrations() {
  const connectedList = document.getElementById('connected-list');
  if (connectedList) {
    const enabled = [];
    if (state.integrations.mobileNotif) enabled.push('📱 Mobile Notifications');
    if (state.integrations.emailDigest) enabled.push('📧 Email Digest');
    if (state.integrations.smartHome) enabled.push('🏠 Smart Home');
    if (state.integrations.utility) enabled.push('⚡ Utility Provider');
    if (state.integrations.calendar) enabled.push('📅 Calendar');
    if (state.integrations.export) enabled.push('📊 Export');

    if (enabled.length === 0) {
      connectedList.innerHTML = '<p style="color:var(--text-muted);">No integrations enabled yet. Select above to get started.</p>';
    } else {
      connectedList.innerHTML = '<div style="display:grid;gap:8px;">' + enabled.map(e => `<div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);font-size:0.88rem;">${e}</div>`).join('') + '</div>';
    }
  }
}

/* ---------------------------------------------------------------
   RECOMMENDATIONS RENDER
--------------------------------------------------------------- */
function renderRecommendations() {
  const total = state.devices.reduce((s, d) => s + parseFloat(d.kwh || 0), 0);
  const list = document.getElementById('recommendations-list');
  if (!list) return;

  const recommendations = [
    { icon: '🔌', title: 'Unplug Standby Devices', desc: 'Save up to 10% by eliminating phantom power draw', savings: '8-15%' },
    { icon: '❄️', title: 'Optimize AC Usage', desc: 'Lower thermostat 2°C to cut cooling costs by 20%', savings: '15-20%' },
    { icon: '💡', title: 'Switch to LED Lighting', desc: 'Replace bulbs to save 75% on lighting costs', savings: '20%' },
    { icon: '⏱️', title: 'Schedule Laundry Off-Peak', desc: 'Run machines at night for lower rates', savings: '5-10%' },
    { icon: '🌡️', title: 'Upgrade Old AC Unit', desc: 'Your AC is above average age - newer models save 40%', savings: '35-40%' },
  ];

  list.innerHTML = recommendations.map((r, i) => `
    <div class="recommendation-card">
      <div class="rec-icon">${r.icon}</div>
      <div class="rec-content">
        <h4>${r.title}</h4>
        <p>${r.desc}</p>
        <div class="rec-saving">Potential savings: <strong>${r.savings}</strong></div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="addNotification({type:'info',icon:'💡',iconClass:'blue',title:'Recommendation',body:'${r.title} added to your action items'})">Learn More</button>
    </div>
  `).join('');
}

/* ---------------------------------------------------------------
   BENCHMARKING RENDER
--------------------------------------------------------------- */
function renderBenchmarking() {
  const total = state.devices.reduce((s, d) => s + parseFloat(d.kwh || 0), 0);
  const avgUsage = 850;
  const diff = total - avgUsage;
  const rank = diff > 0 ? 'Above Average' : 'Below Average';

  setText('bench-your', `${total.toFixed(0)} kWh`);
  setText('bench-avg', `${avgUsage} kWh`);
  setText('bench-diff', diff > 0 ? `+${diff.toFixed(0)} kWh` : `${diff.toFixed(0)} kWh`);
  setText('bench-rank', rank);

  const chart = document.getElementById('benchmark-chart');
  if (chart) {
    const pct = Math.round((total / avgUsage) * 100);
    chart.innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span>Your household</span>
          <strong>${pct}%</strong>
        </div>
        <div style="width:100%;height:12px;background:var(--bg-elevated);border-radius:6px;overflow:hidden;">
          <div style="width:${Math.min(100, pct)}%;height:100%;background:var(--blue-400);"></div>
        </div>
      </div>
      <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;">
        <p>You are ${diff > 0 ? 'using more' : 'saving more'} energy than similar households.</p>
        <p>Focus areas: Cooling & AC usage represent ${Math.round(total * 0.4)}% of your total.</p>
      </div>
    `;
  }
}

/* ---------------------------------------------------------------
   AUTOMATION RENDER
--------------------------------------------------------------- */
function renderAutomation() {
  // Populate device select
  const sel = document.getElementById('auto-device');
  if (sel) {
    sel.innerHTML = '<option value="">— Choose device —</option>' + state.devices.map(d => 
      `<option value="${d.id}">${escHtml(d.name)}</option>`
    ).join('');
  }

  // Render active rules
  const rulesList = document.getElementById('automation-rules-list');
  if (rulesList) {
    if (state.automationRules.length === 0) {
      rulesList.innerHTML = '<p style="color:var(--text-muted);">No automation rules yet.</p>';
    } else {
      rulesList.innerHTML = state.automationRules.map((r, idx) => `
        <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:0.85rem;"><strong>${r.action}</strong> at ${r.time} on ${r.days.join(', ')}</div>
          <button class="btn btn-danger-solid btn-sm" onclick="state.automationRules.splice(${idx}, 1); save(); renderAutomation();">Delete</button>
        </div>
      `).join('');
    }
  }
}

/* ---------------------------------------------------------------
   WEATHER RENDER
--------------------------------------------------------------- */
function renderWeather() {
  const impacts = document.getElementById('weather-impacts');
  if (impacts) {
    impacts.innerHTML = `
      <div style="display:grid;gap:12px;">
        <div style="padding:12px;background:rgba(59,130,246,0.1);border-left:4px solid var(--blue-400);border-radius:var(--radius-sm);">
          <strong style="color:var(--blue-400);">🌡️ Hot Days Ahead</strong>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">High temps (28°C) expected. Pre-cool your home now to save 15-20% on AC.</p>
        </div>
        <div style="padding:12px;background:rgba(76,175,80,0.1);border-left:4px solid var(--green-400);border-radius:var(--radius-sm);">
          <strong style="color:var(--green-400);">☔ Cooler Tomorrow</strong>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">Mild weather (22°C) means lower AC load. Good day to run dishwasher/laundry.</p>
        </div>
        <div style="padding:12px;background:rgba(255,152,0,0.1);border-left:4px solid var(--yellow-400);border-radius:var(--radius-sm);">
          <strong style="color:var(--yellow-400);">📊 Monthly Impact</strong>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">Warmer-than-average June will increase AC usage ~12-15% vs. last year.</p>
        </div>
      </div>
    `;
  }
}

/* ---------------------------------------------------------------
   GAMIFICATION RENDER
--------------------------------------------------------------- */
function renderGamification() {
  const streak = state.gamification.streak || 0;
  const points = state.gamification.points || 0;
  const badges = state.gamification.badges || 0;

  setText('streak-days', `${streak} days`);
  setText('energy-points', points);
  setText('badges-count', badges);

  const challenge = document.getElementById('current-challenge');
  if (challenge) {
    challenge.innerHTML = `
      <div>
        <h4 style="margin-bottom:8px;">Reduce usage by 20% this month</h4>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.85rem;">
          <span>Progress</span>
          <strong>12% achieved</strong>
        </div>
        <div style="width:100%;height:16px;background:var(--bg-elevated);border-radius:8px;overflow:hidden;">
          <div style="width:60%;height:100%;background:linear-gradient(90deg,var(--blue-400),var(--blue-500));"></div>
        </div>
        <div style="margin-top:10px;font-size:0.8rem;color:var(--text-secondary);">
          🏆 Reward: 500 Energy Points + "20% Hero" badge
        </div>
      </div>
    `;
  }

  const leaderboard = document.getElementById('leaderboard-list');
  if (leaderboard) {
    leaderboard.innerHTML = `
      <div style="display:grid;gap:8px;">
        <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);display:flex;align-items:center;gap:12px;border-left:4px solid gold;">
          <div style="font-size:1.2rem;">🥇</div>
          <div style="flex:1;">
            <div style="font-weight:700;">You</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);">5,250 points</div>
          </div>
          <div style="text-align:right;font-weight:700;">#1</div>
        </div>
        <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);display:flex;align-items:center;gap:12px;border-left:4px solid silver;">
          <div style="font-size:1.2rem;">🥈</div>
          <div style="flex:1;">
            <div style="font-weight:700;">Alex Johnson</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);">4,890 points</div>
          </div>
          <div style="text-align:right;font-weight:700;">#2</div>
        </div>
        <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);display:flex;align-items:center;gap:12px;border-left:4px solid #CD7F32;">
          <div style="font-size:1.2rem;">🥉</div>
          <div style="flex:1;">
            <div style="font-weight:700;">Sam Tech</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);">4,120 points</div>
          </div>
          <div style="text-align:right;font-weight:700;">#3</div>
        </div>
      </div>
    `;
  }
}

/* ---------------------------------------------------------------
   SECURITY HELPER
--------------------------------------------------------------- */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------------------------------------------------------------
   EFFICIENCY GRADE CALCULATION
--------------------------------------------------------------- */
function calculateEfficiencyGrade(totalKwh) {
  const grades = [
    { max: 300, grade: 'A', desc: 'Excellent - Outstanding efficiency' },
    { max: 500, grade: 'B', desc: 'Good - Well managed usage' },
    { max: 750, grade: 'C', desc: 'Fair - Room for improvement' },
    { max: 1000, grade: 'D', desc: 'Poor - Consider optimization' },
    { max: Infinity, grade: 'F', desc: 'Critical - Urgent action needed' }
  ];
  
  return grades.find(g => totalKwh <= g.max) || { grade: 'F', desc: 'Critical - Urgent action needed' };
}

/* ---------------------------------------------------------------
   EVENT LISTENERS — BOOT
--------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  load();

  // Apply theme immediately
  applyTheme(state.prefs.darkMode);

  setupAppListeners();
  prefillRememberedLogin();

  // If user was already logged in, skip login screen
  if (state.currentUser) {
    showApp();
    return;
  }

  /* ---- LOGIN SCREEN ---- */

  // Auth tab switching
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      switchAuthTab(btn.dataset.tab);
    });
  });

  // Sign in
  document.getElementById('login-btn')?.addEventListener('click', handleLogin);
  document.getElementById('guest-btn')?.addEventListener('click', handleGuestLogin);
  document.getElementById('forgot-password-link')?.addEventListener('click', handleForgotPassword);
  document.getElementById('password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('username')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  // Sign up
  document.getElementById('signup-btn')?.addEventListener('click', handleSignup);

  // Password toggles (login screen)
  document.getElementById('toggle-pw-signin')?.addEventListener('click', () =>
    togglePasswordVisibility('password', 'toggle-pw-signin')
  );
  document.getElementById('toggle-pw-signup')?.addEventListener('click', () =>
    togglePasswordVisibility('signup-password', 'toggle-pw-signup')
  );

  setupAppListeners();
});

/* ---------------------------------------------------------------
   APP-SHELL EVENT LISTENERS
--------------------------------------------------------------- */
function setupAppListeners() {
  // Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Logout buttons
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('logout-mobile')?.addEventListener('click', handleLogout);

  // Theme toggles
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);

  // Hamburger
  document.getElementById('hamburger')?.addEventListener('click', openSidebar);

  // Add device
  document.getElementById('add-device-btn')?.addEventListener('click', handleAddDevice);
  document.getElementById('clear-form-btn')?.addEventListener('click', clearAddDeviceForm);
  document.getElementById('device-kwh')?.addEventListener('input', updateCostPreview);

  // Chart type switch
  document.getElementById('chart-type-select')?.addEventListener('change', renderEnergyChart);

  // Devices table — search / filter / sort
  document.getElementById('search-input')?.addEventListener('input', renderDevicesTable);
  document.getElementById('filter-category')?.addEventListener('change', renderDevicesTable);
  document.getElementById('sort-select')?.addEventListener('change', renderDevicesTable);

  // Export CSV
  document.getElementById('export-btn')?.addEventListener('click', exportCSV);
  document.getElementById('settings-export-btn')?.addEventListener('click', exportCSV);

  // Notifications
  document.getElementById('clear-notifs-btn')?.addEventListener('click', clearAllNotifs);

  // Settings
  document.getElementById('save-profile-btn')?.addEventListener('click', saveProfile);
  document.getElementById('save-prefs-btn')?.addEventListener('click', savePrefs);
  document.getElementById('change-pw-btn')?.addEventListener('click', changePassword);
  document.getElementById('settings-clear-btn')?.addEventListener('click', clearAllDevices);

  // Settings dark mode toggle (live preview)
  document.getElementById('settings-dark-mode')?.addEventListener('change', e => {
    applyTheme(e.target.checked);
    refreshCharts();
  });

  // Alert banner close
  document.querySelector('.alert-close')?.addEventListener('click', () => {
    document.getElementById('alert-banner')?.classList.add('hidden');
  });

  // Budget listeners
  document.getElementById('save-budget-btn')?.addEventListener('click', () => {
    const val = parseFloat(document.getElementById('budget-input').value);
    if (val > 0) {
      state.budget.monthlyLimit = val;
      save();
      renderBudget();
      showToast(document.getElementById('budget-saved'));
    }
  });

  // Goals listeners
  document.getElementById('save-goal-btn')?.addEventListener('click', () => {
    const weekly = parseFloat(document.getElementById('goal-weekly').value);
    const reduction = parseFloat(document.getElementById('goal-reduction').value);
    if (weekly > 0 && reduction > 0) {
      state.goals.weeklyTarget = weekly;
      state.goals.reductionTarget = reduction;
      save();
      renderGoals();
      showToast(document.getElementById('goal-saved'));
    }
  });

  // Integration listeners
  document.getElementById('enable-mobile')?.addEventListener('click', () => {
    state.integrations.mobileNotif = !state.integrations.mobileNotif;
    save();
    renderIntegrations();
  });
  document.getElementById('enable-email')?.addEventListener('click', () => {
    state.integrations.emailDigest = !state.integrations.emailDigest;
    save();
    renderIntegrations();
  });
  document.getElementById('enable-smart-home')?.addEventListener('click', () => {
    state.integrations.smartHome = !state.integrations.smartHome;
    save();
    renderIntegrations();
  });
  document.getElementById('enable-utility')?.addEventListener('click', () => {
    state.integrations.utility = !state.integrations.utility;
    save();
    renderIntegrations();
  });
  document.getElementById('enable-calendar')?.addEventListener('click', () => {
    state.integrations.calendar = !state.integrations.calendar;
    save();
    renderIntegrations();
  });
  document.getElementById('enable-export')?.addEventListener('click', () => {
    state.integrations.export = !state.integrations.export;
    save();
    renderIntegrations();
  });

  // Automation listener
  document.getElementById('save-automation-btn')?.addEventListener('click', () => {
    const device = document.getElementById('auto-device')?.value;
    const action = document.getElementById('auto-action')?.value;
    const hour = document.getElementById('auto-hour')?.value;
    const minute = document.getElementById('auto-minute')?.value;
    const time = hour && minute ? `${hour}:${minute}` : '';
    const days = Array.from(document.querySelectorAll('.auto-day:checked')).map(cb => cb.value);
    const error = document.getElementById('automation-error');

    if (!device || !action || !time || days.length === 0) {
      if (error) {
        error.textContent = 'Please choose a device, time and at least one day.';
        error.classList.remove('hidden');
      }
      return;
    }

    if (error) error.classList.add('hidden');

    state.automationRules.push({ device, action, time, days });
    save();
    renderAutomation();
    showToast(document.getElementById('automation-saved'));
    document.getElementById('auto-device').value = '';
    document.getElementById('auto-hour').value = '';
    document.getElementById('auto-minute').value = '';
    document.querySelectorAll('.auto-day').forEach(cb => cb.checked = false);
  });
}