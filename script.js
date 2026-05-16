/* ============================================
   GYM RESERVATION — script.js (v5.2 updated)
   ============================================ */

'use strict';

// ─── STATE ──────────────────────────────────
let editIndex    = -1;
let currentGym   = null;
let activeFilter = 'all';

let users        = JSON.parse(localStorage.getItem('bb_users'))        || {};
let reservations = JSON.parse(localStorage.getItem('bb_reservations')) || [];
let activity     = JSON.parse(localStorage.getItem('bb_activity'))     || [];

// ─── ADMIN CREDENTIALS ──────────────────────
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

function isAdmin() { return getCurrentUser() === ADMIN_USER; }

// ─── DEFAULT COVERED COURT IMAGE ─────────────
const DEFAULT_GYM_IMAGE = 'data:image/svg+xml;base64,' + btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1a2744"/>
      <stop offset="100%" style="stop-color:#0f3460"/>
    </linearGradient>
    <linearGradient id="floor" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#c8a96e"/>
      <stop offset="100%" style="stop-color:#a07850"/>
    </linearGradient>
  </defs>
  <rect width="400" height="220" fill="url(#sky)"/>
  <polygon points="0,80 200,20 400,80 400,90 0,90" fill="#2c3e6e" opacity="0.9"/>
  <polygon points="20,90 380,90 380,100 20,100" fill="#3a4f7a" opacity="0.7"/>
  <line x1="50" y1="80" x2="50" y2="170" stroke="#4a5f8a" stroke-width="3"/>
  <line x1="150" y1="60" x2="150" y2="170" stroke="#4a5f8a" stroke-width="3"/>
  <line x1="250" y1="60" x2="250" y2="170" stroke="#4a5f8a" stroke-width="3"/>
  <line x1="350" y1="80" x2="350" y2="170" stroke="#4a5f8a" stroke-width="3"/>
  <line x1="0" y1="110" x2="400" y2="110" stroke="#3a4f7a" stroke-width="2" opacity="0.6"/>
  <line x1="0" y1="130" x2="400" y2="130" stroke="#3a4f7a" stroke-width="2" opacity="0.4"/>
  <rect x="0" y="165" width="400" height="55" fill="url(#floor)"/>
  <rect x="40" y="165" width="320" height="55" fill="none" stroke="#fff" stroke-width="2" opacity="0.6"/>
  <line x1="200" y1="165" x2="200" y2="220" stroke="#fff" stroke-width="2" opacity="0.6"/>
  <circle cx="200" cy="190" r="20" fill="none" stroke="#fff" stroke-width="2" opacity="0.6"/>
  <ellipse cx="100" cy="100" rx="8" ry="5" fill="#fffde0" opacity="0.9"/>
  <ellipse cx="200" cy="85" rx="8" ry="5" fill="#fffde0" opacity="0.9"/>
  <ellipse cx="300" cy="100" rx="8" ry="5" fill="#fffde0" opacity="0.9"/>
  <polygon points="96,105 104,105 115,165 85,165" fill="#fffde0" opacity="0.06"/>
  <polygon points="196,90 204,90 225,165 175,165" fill="#fffde0" opacity="0.06"/>
  <polygon points="296,105 304,105 315,165 285,165" fill="#fffde0" opacity="0.06"/>
  <text x="200" y="148" text-anchor="middle" fill="white" font-family="sans-serif" font-size="11" opacity="0.5">COVERED COURT</text>
</svg>`);

// ─── GYMS DATA ───────────────────────────────
let gyms = JSON.parse(localStorage.getItem('bb_gyms')) || [];

// ─── HELPERS ────────────────────────────────
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-dot"></div>${msg}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ─── SUCCESS POPUP NOTIFICATION ──────────────
function showSuccessPopup(msg) {
  // Remove existing popup if any
  const existing = document.getElementById('successPopup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'successPopup';
  popup.innerHTML = `
    <div class="success-popup-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="28" height="28">
        <circle cx="12" cy="12" r="10" fill="rgba(16,185,129,0.15)" stroke="#10b981"/>
        <path d="M8 12l3 3 5-5" stroke="#10b981" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="success-popup-body">
      <div class="success-popup-title">Success!</div>
      <div class="success-popup-msg">${msg}</div>
    </div>
    <button class="success-popup-close" onclick="document.getElementById('successPopup').remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  document.body.appendChild(popup);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => popup.classList.add('show'));
  });

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => { if (popup.parentNode) popup.remove(); }, 400);
  }, 4000);
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function openModal({ title, msg, onConfirm, danger = true }) {
  const m = document.getElementById('modal');
  m.classList.remove('hidden');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent   = msg;

  const icon = document.getElementById('modalIcon');
  icon.innerHTML = danger
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;

  const btn = document.getElementById('modalConfirmBtn');
  btn.onclick = () => { closeModal(); onConfirm(); };
}

function pushActivity(msg) {
  const now  = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  activity.unshift({ msg, time });
  if (activity.length > 10) activity.pop();
  save('bb_activity', activity);
}

function getCurrentUser() { return localStorage.getItem('bb_currentUser'); }

function getUserReservations() {
  const u = getCurrentUser();
  return reservations.filter(r => r.user === u);
}

// ─── LOCATION HELPERS ───────────────────────
function buildMapsUrl(location, mapsUrl) {
  if (mapsUrl && mapsUrl.trim()) return mapsUrl.trim();
  if (!location) return null;
  const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function openMapsLink(location, mapsUrl, e) {
  if (e) e.stopPropagation();
  const url = buildMapsUrl(location, mapsUrl);
  if (url) window.open(url, '_blank');
}

function renderLocationLink(location, mapsUrl, classes = '') {
  if (!location) return '';
  const url = buildMapsUrl(location, mapsUrl);
  const clickAttr = url ? `onclick="openMapsLink('${(location||'').replace(/'/g,"\\'")}','${(mapsUrl||'').replace(/'/g,"\\'")}',event)"` : '';
  const cursorStyle = url ? 'cursor:pointer;' : '';
  return `
    <div class="gym-card-loc location-link ${classes}" ${clickAttr} title="${url ? 'Open in Google Maps' : ''}" style="${cursorStyle}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" class="loc-pin-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span class="loc-text">${location}</span>
      ${url ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" class="loc-ext-icon"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>` : ''}
    </div>`;
}

// ─── SEAT CALCULATION ───────────────────────
function getAvailableSeats(gymName, gymCapacity) {
  const cap = parseInt(gymCapacity) || 0;
  if (!cap) return null;
  const used = reservations
    .filter(r => r.event === gymName && r.status === 'Accepted')
    .reduce((sum, r) => sum + parseInt(r.seats || 0), 0);
  return Math.max(0, cap - used);
}

function getSeatColor(available, total) {
  if (!total) return '#6366f1';
  const ratio = available / total;
  if (ratio <= 0) return '#f43f5e';
  if (ratio <= 0.3) return '#f59e0b';
  return '#10b981';
}

function getSeatLabel(available) {
  if (available === null) return 'Available';
  if (available <= 0) return 'Fully Booked';
  if (available <= 5) return `${available} seats left`;
  return `${available} seats available`;
}

// ─── SEAT INPUT VALIDATOR ───────────────────
function validateSeatsInput(input) {
  const warn = document.getElementById('seatsWarning');
  if (!currentGym) return;
  const cap = parseInt(currentGym.capacity) || 0;
  if (!cap) { if (warn) warn.style.display = 'none'; return; }
  const avail = getAvailableSeats(currentGym.name, cap);
  const val   = parseInt(input.value) || 0;

  if (avail === null) { if (warn) warn.style.display = 'none'; return; }

  if (val > avail) {
    input.value = avail;
    if (warn) {
      warn.style.display = 'block';
      warn.textContent = `Maximum allowed: ${avail} seats. Value adjusted.`;
    }
    showToast(`Only ${avail} seat(s) available for this court.`, 'error');
  } else if (val <= 0 && input.value !== '') {
    if (warn) {
      warn.style.display = 'block';
      warn.textContent = 'Please enter at least 1 seat.';
    }
  } else {
    if (warn) warn.style.display = 'none';
  }
}

// ─── DATE/TIME ──────────────────────────────
function updateTopbarDate() {
  const el = document.getElementById('topbarDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── AUTH ────────────────────────────────────
function showAuth(pageId) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

function register() {
  const user    = document.getElementById('regUser').value.trim();
  const email   = document.getElementById('regEmail').value.trim();
  const pass    = document.getElementById('regPass').value;
  const confirm = document.getElementById('regConfirm').value;

  if (!user || !email || !pass || !confirm) { showToast('Please fill all fields.', 'error'); return; }
  if (pass !== confirm)    { showToast('Passwords do not match.', 'error'); return; }
  if (users[user])         { showToast('Username already taken.', 'error'); return; }
  if (user === ADMIN_USER) { showToast('That username is reserved.', 'error'); return; }
  if (pass.length < 6)     { showToast('Password must be at least 6 characters.', 'error'); return; }

  users[user] = { pass, email, status: 'Active', createdAt: new Date().toISOString() };
  save('bb_users', users);

  showToast('Account created! Please sign in.', 'success');
  showAuth('loginPage');
  ['regUser','regEmail','regPass','regConfirm'].forEach(id => document.getElementById(id).value = '');
}

function login() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;

  if (!user || !pass) { showToast('Enter your credentials.', 'error'); return; }

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem('bb_currentUser', ADMIN_USER);
    launchApp(ADMIN_USER);
    return;
  }

  const stored = users[user];
  const valid  = stored && (stored.pass === pass || stored === pass);

  if (!valid) { showToast('Invalid username or password.', 'error'); return; }

  localStorage.setItem('bb_currentUser', user);
  launchApp(user);
}

function logout() {
  openModal({
    title: 'Sign Out',
    msg: 'Are you sure you want to sign out of your account?',
    onConfirm: () => {
      localStorage.removeItem('bb_currentUser');
      document.getElementById('appWrapper').classList.add('hidden');
      document.getElementById('authWrapper').style.display = 'flex';
      document.getElementById('loginUser').value = '';
      document.getElementById('loginPass').value = '';
      showAuth('loginPage');
    }
  });
}

// ─── APP BOOTSTRAP ──────────────────────────
function launchApp(user) {
  document.getElementById('authWrapper').style.display = 'none';
  document.getElementById('appWrapper').classList.remove('hidden');

  const initials = user.slice(0, 2).toUpperCase();
  document.getElementById('sidebarAvatar').textContent   = initials;
  document.getElementById('sidebarUserName').textContent = user;

  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const userNav  = document.getElementById('userNav');
  const adminNav = document.getElementById('adminNav');
  const roleEl   = document.getElementById('sidebarUserRole');
  const userLogoutBtn = document.getElementById('userLogoutBtn');

  if (isAdmin()) {
    if (userNav)  userNav.style.display  = 'none';
    if (adminNav) adminNav.style.display = 'block';
    if (roleEl)   roleEl.textContent     = 'Administrator';
    if (userLogoutBtn) userLogoutBtn.style.display = 'none';

    document.getElementById('adminDashGreeting').textContent = greet + ',';
    document.getElementById('adminDashName').textContent     = 'Administrator';

    updateTopbarDate();
    updateBadges();
    navTo('adminDashPage', document.querySelector('[data-page="adminDashPage"]'));
    loadAdminDash();
  } else {
    if (userNav)  userNav.style.display  = 'block';
    if (adminNav) adminNav.style.display = 'none';
    if (roleEl)   roleEl.textContent     = 'Resident';
    if (userLogoutBtn) userLogoutBtn.style.display = 'flex';

    document.getElementById('dashGreeting').textContent = greet + ',';
    document.getElementById('dashName').textContent     = user + '!';

    updateTopbarDate();
    updateBadges();
    navTo('dashPage', document.querySelector('[data-page="dashPage"]'));
    loadDashboard();
  }
}

// ─── NAVIGATION ─────────────────────────────
function navTo(pageId, linkEl) {
  const adminPages = ['adminDashPage','adminGymsPage','adminUsersPage','adminResPage','adminReportsPage','adminSettingsPage'];
  if (adminPages.includes(pageId) && !isAdmin()) {
    showToast('Access denied.', 'error');
    return;
  }

  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById(pageId);
  if (pg) pg.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  const titles = {
    dashPage:           ['Dashboard',           'Overview of your activity'],
    gymsPage:           ['Available Courts',    'Select a court to reserve your seat'],
    reservePage:        ['Make Reservation',    'Fill in your booking details'],
    reservationsPage:   ['My Reservations',     'Manage your court bookings'],
    adminDashPage:      ['Dashboard',           'Admin system overview'],
    adminGymsPage:      ['Manage Courts',       'Add, edit, and remove court facilities'],
    adminUsersPage:     ['Registered Users',    'View and manage all user accounts'],
    adminResPage:       ['All Reservations',    'Review and process all reservation requests'],
    adminReportsPage:   ['Reports',             'Court usage and reservation analytics'],
    adminSettingsPage:  ['Settings',            'System configuration and preferences'],
  };

  const [title, sub] = titles[pageId] || ['', ''];
  document.getElementById('topbarTitle').textContent = title;
  document.getElementById('topbarBread').textContent = sub;
}

// ─── BADGES ─────────────────────────────────
function updateBadges() {
  const gymBadge = document.getElementById('gymBadge');
  if (gymBadge) gymBadge.textContent = gyms.length;

  const statTotalGyms = document.getElementById('statTotalGyms');
  if (statTotalGyms) statTotalGyms.textContent = gyms.length;

  const adminGymBadge = document.getElementById('adminGymBadge');
  if (adminGymBadge) adminGymBadge.textContent = gyms.length;

  const adminUserBadge = document.getElementById('adminUserBadge');
  if (adminUserBadge) adminUserBadge.textContent = Object.keys(users).length;

  const pendingCount = reservations.filter(r => !r.status || r.status === 'Pending').length;

  const adminResBadge = document.getElementById('adminResBadge');
  if (adminResBadge) adminResBadge.textContent = pendingCount;

  if (isAdmin()) {
    const adStatUsers   = document.getElementById('adStatUsers');
    const adStatRes     = document.getElementById('adStatRes');
    const adStatPending = document.getElementById('adStatPending');
    const adStatGyms    = document.getElementById('adStatGyms');
    if (adStatUsers)   adStatUsers.textContent   = Object.keys(users).length;
    if (adStatRes)     adStatRes.textContent     = reservations.length;
    if (adStatPending) adStatPending.textContent = pendingCount;
    if (adStatGyms)    adStatGyms.textContent    = gyms.length;
  } else {
    const myCount = getUserReservations().length;
    const resBadge = document.getElementById('resBadge');
    if (resBadge) resBadge.textContent = myCount;
    const statMyRes = document.getElementById('statMyRes');
    if (statMyRes) statMyRes.textContent = myCount;
    const statSeats = document.getElementById('statSeats');
    if (statSeats) statSeats.textContent = gyms.length;
  }

  const settingsGymCount  = document.getElementById('settingsGymCount');
  const settingsUserCount = document.getElementById('settingsUserCount');
  if (settingsGymCount)  settingsGymCount.textContent  = gyms.length;
  if (settingsUserCount) settingsUserCount.textContent = Object.keys(users).length;
}

// ─── USER DASHBOARD ──────────────────────────
function loadDashboard() {
  loadDashGyms();
  updateBadges();
  loadRecentActivity();
}

function loadDashGyms() {
  const container = document.getElementById('dashGymSlots');
  if (!container) return;
  container.innerHTML = '';

  if (!gyms.length) {
    container.innerHTML = `
      <div class="dash-gym-empty fade-in-up">
        <img src="${DEFAULT_GYM_IMAGE}" alt="Court" class="dash-gym-empty-img">
        <div class="dash-gym-empty-title">No Active Court Sessions Today</div>
        <div class="dash-gym-empty-sub">Browse available covered courts and make a reservation.</div>
        <button class="dash-browse-btn" onclick="navTo('gymsPage', document.querySelector('[data-page=gymsPage]')); loadGyms()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4"/></svg>
          Browse Courts
        </button>
      </div>
    `;
    return;
  }

  const availableGyms = gyms.filter(g => g.status === 'Available');
  if (!availableGyms.length) {
    container.innerHTML = `
      <div class="dash-gym-empty fade-in-up">
        <img src="${DEFAULT_GYM_IMAGE}" alt="Court" class="dash-gym-empty-img">
        <div class="dash-gym-empty-title">No Active Court Sessions Today</div>
        <div class="dash-gym-empty-sub">All courts are currently full or closed. Check back later.</div>
        <button class="dash-browse-btn" onclick="navTo('gymsPage', document.querySelector('[data-page=gymsPage]')); loadGyms()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4"/></svg>
          Browse Courts
        </button>
      </div>
    `;
    return;
  }

  availableGyms.slice(0, 4).forEach((g, i) => {
    const origIndex = gyms.indexOf(g);
    const cap    = parseInt(g.capacity) || 0;
    const avail  = cap ? getAvailableSeats(g.name, cap) : null;
    const color  = getSeatColor(avail === null ? cap : avail, cap);
    const label  = getSeatLabel(avail);
    const img    = g.image || DEFAULT_GYM_IMAGE;
    const mapsUrl = buildMapsUrl(g.location, g.mapsUrl);

    const div = document.createElement('div');
    div.className = `dash-featured-gym fade-in-up`;
    div.style.animationDelay = `${i * 0.07}s`;
    div.onclick = () => openReservePage(origIndex);
    div.innerHTML = `
      <img src="${img}" alt="${g.name}" onerror="this.src='${DEFAULT_GYM_IMAGE}'">
      <div class="dash-featured-gym-info">
        <div class="dash-featured-gym-name">${g.name}</div>
        <div class="dash-featured-gym-loc" ${mapsUrl ? `onclick="event.stopPropagation();window.open('${mapsUrl}','_blank')"` : ''} style="${mapsUrl?'cursor:pointer;':''}" title="${mapsUrl?'Open in Google Maps':''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${g.location || 'Location not set'}
        </div>
      </div>
      <div class="dash-featured-gym-seats" style="color:${color}">${label}</div>
    `;
    container.appendChild(div);
  });

  if (availableGyms.length > 0) {
    const moreBtn = document.createElement('div');
    moreBtn.style.cssText = 'text-align:center;padding:12px 0 4px;';
    moreBtn.innerHTML = `
      <button class="dash-browse-btn" style="font-size:12px;padding:8px 18px;" onclick="navTo('gymsPage', document.querySelector('[data-page=gymsPage]')); loadGyms()">
        View All ${gyms.length} Courts →
      </button>
    `;
    container.appendChild(moreBtn);
  }
}

function loadRecentActivity() {
  const container = document.getElementById('recentActivity');
  if (!container) return;
  container.innerHTML = '';
  const list = isAdmin() ? activity : activity.filter(a => !a.msg.startsWith('Admin'));
  if (!list.length) { container.innerHTML = '<div class="activity-empty">No recent activity yet.</div>'; return; }
  list.forEach(a => {
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `<div class="activity-dot"></div><span>${a.msg}</span><span class="activity-time">${a.time}</span>`;
    container.appendChild(div);
  });
}

// ─── ADMIN DASHBOARD ────────────────────────
function loadAdminDash() {
  updateBadges();
  loadAdminRecentRes();
}

function loadAdminRecentRes() {
  const container = document.getElementById('adminRecentRes');
  if (!container) return;
  container.innerHTML = '';

  const recent = [...reservations].reverse().slice(0, 5);
  if (!recent.length) {
    container.innerHTML = '<div class="activity-empty">No reservations yet.</div>';
    return;
  }

  recent.forEach(r => {
    const div = document.createElement('div');
    div.className = 'admin-recent-item';
    div.innerHTML = `
      <div class="admin-recent-avatar">${(r.user || '?').slice(0,2).toUpperCase()}</div>
      <div class="admin-recent-info">
        <div class="admin-recent-name">${r.eventName} <span style="color:#888;font-weight:400">via ${r.user}</span></div>
        <div class="admin-recent-meta">${r.event} · ${r.date} ${r.time}</div>
      </div>
      ${statusBadge(r.status || 'Pending')}
    `;
    container.appendChild(div);
  });
}

// ─── GYMS ───────────────────────────────────
function filterGyms() { loadGyms(); }
function filterGymsPage() { loadGyms(); }

function loadGyms() {
  const container = document.getElementById('gymList');
  if (!container) return;
  container.innerHTML = '';

  const searchEl = document.getElementById('gymSearchInput') || document.getElementById('globalSearch');
  const query = (searchEl ? searchEl.value : '').toLowerCase();
  const statusFilter = document.getElementById('gymStatusFilter')?.value || 'all';

  const filtered = gyms.filter(g => {
    const matchQ = !query || g.name.toLowerCase().includes(query);
    const matchS = statusFilter === 'all' || g.status === statusFilter;
    return matchQ && matchS;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4"/></svg>
        </div>
        <h3>No courts available</h3>
        <p>No court facilities have been added yet. Please check back later.</p>
      </div>`;
    return;
  }

  filtered.forEach(g => {
    const origIndex = gyms.indexOf(g);
    const cap   = parseInt(g.capacity) || 0;
    const avail = cap ? getAvailableSeats(g.name, cap) : null;
    const seatColor = getSeatColor(avail === null ? cap : avail, cap);
    const seatLabel = getSeatLabel(avail);
    const barPct = cap ? Math.max(4, Math.round(((avail === null ? cap : avail) / cap) * 100)) : 0;

    const card = document.createElement('div');
    card.className = 'gym-showcase-card';

    const gymImage = g.image || DEFAULT_GYM_IMAGE;
    const statusColor = g.status === 'Available' ? 'var(--green)' : g.status === 'Full' ? 'var(--rose)' : '#888';
    const statusBg    = g.status === 'Available' ? 'rgba(16,185,129,.18)' : g.status === 'Full' ? 'rgba(244,63,94,.18)' : 'rgba(100,100,100,.18)';

    const isUnavailable = g.status !== 'Available' || (avail !== null && avail <= 0);
    const seatsBadgeLabel = cap ? `${cap} seats` : '';
    const mapsUrl = buildMapsUrl(g.location, g.mapsUrl);

    const actionBtn = isAdmin()
      ? `<button class="gym-card-btn admin-btn" onclick="navTo('adminGymsPage', document.querySelector('[data-page=adminGymsPage]')); loadAdminGymsPage()">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Manage
         </button>`
      : `<button class="gym-card-btn" onclick="openReservePage(${origIndex})" ${isUnavailable ? 'disabled' : ''}>
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
           ${g.status !== 'Available' ? g.status : (avail !== null && avail <= 0) ? 'Fully Booked' : 'Reserve Now'}
         </button>`;

    card.innerHTML = `
      <div class="gym-card-image-wrap">
        <img src="${gymImage}" alt="${g.name}" class="gym-card-image" onerror="this.src='${DEFAULT_GYM_IMAGE}'">
        <div class="gym-card-image-overlay"></div>
        <div class="gym-card-status-badge" style="color:${statusColor};background:${statusBg}">
          <span class="status-dot" style="background:${statusColor}"></span>${g.status || 'Available'}
        </div>
        ${seatsBadgeLabel ? `<div class="gym-card-capacity-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${seatsBadgeLabel}
        </div>` : ''}
      </div>
      <div class="gym-card-body">
        <div class="gym-card-name">${g.name}</div>
        ${g.location ? `
        <div class="gym-card-loc location-link" 
          ${mapsUrl ? `onclick="event.stopPropagation();window.open('${mapsUrl}','_blank')"` : ''}
          style="${mapsUrl ? 'cursor:pointer;' : ''}"
          title="${mapsUrl ? 'Open in Google Maps' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" class="loc-pin-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span class="loc-text">${g.location}</span>
          ${mapsUrl ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" class="loc-ext-icon"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>` : ''}
        </div>` : ''}
        ${cap ? `<div class="gym-card-seats-indicator">
          <span style="font-size:11px;color:${seatColor};font-weight:700">${seatLabel}</span>
          <div class="seats-bar"><div class="seats-bar-fill" style="width:${barPct}%;background:${seatColor}"></div></div>
        </div>` : ''}
        ${actionBtn}
      </div>
    `;
    container.appendChild(card);
  });
}

// ─── RESERVE ────────────────────────────────
function openReservePage(index) {
  if (isAdmin()) { showToast('Admins cannot make reservations. Use the Admin Panel.', 'info'); return; }

  const gym = gyms[index];
  if (!gym) return;

  const cap   = parseInt(gym.capacity) || 0;
  const avail = cap ? getAvailableSeats(gym.name, cap) : null;

  if (gym.status !== 'Available') { showToast(`This court is currently ${gym.status}.`, 'error'); return; }
  if (avail !== null && avail <= 0) { showToast('This court is fully booked.', 'error'); return; }

  currentGym = { ...gym, index, availableSeats: avail };
  editIndex  = -1;

  const gymImage = gym.image || DEFAULT_GYM_IMAGE;
  const mapsUrl  = buildMapsUrl(gym.location, gym.mapsUrl);

  const imgEl = document.getElementById('reserveGymImage');
  if (imgEl) { imgEl.src = gymImage; imgEl.onerror = () => { imgEl.src = DEFAULT_GYM_IMAGE; }; }

  const nameOverlay = document.getElementById('reserveImageName');
  const locOverlay  = document.getElementById('reserveImageLoc');
  const seatsPill   = document.getElementById('reserveSeatsPill');
  const seatsLabel  = document.getElementById('reserveSeatsOverlay');

  if (nameOverlay) nameOverlay.textContent = gym.name;
  if (locOverlay) {
    locOverlay.innerHTML = gym.location
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ${gym.location}`
      : '';
    if (mapsUrl) {
      locOverlay.style.cursor = 'pointer';
      locOverlay.onclick = () => window.open(mapsUrl, '_blank');
      locOverlay.title = 'Open in Google Maps';
    }
  }

  if (seatsPill && seatsLabel) {
    const color = getSeatColor(avail === null ? cap : avail, cap);
    const label = avail !== null ? `${avail} seats available` : 'Seats available';
    seatsPill.style.background = color === '#10b981' ? 'rgba(16,185,129,0.2)' : color === '#f59e0b' ? 'rgba(245,158,11,0.2)' : 'rgba(244,63,94,0.2)';
    seatsPill.style.color      = color;
    seatsLabel.textContent     = label;
  }

  document.getElementById('detailName').textContent = gym.name;

  const detailLocEl = document.getElementById('detailLocation');
  if (detailLocEl) {
    if (gym.location && mapsUrl) {
      detailLocEl.innerHTML = `<a href="${mapsUrl}" target="_blank" class="detail-loc-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${gym.location}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>`;
    } else {
      detailLocEl.textContent = gym.location || '—';
    }
  }

  document.getElementById('detailSeats').textContent    = avail !== null ? `${avail} of ${cap} seats free` : (cap ? `${cap} total` : '—');
  document.getElementById('detailStatus').textContent   = gym.status || 'Available';
  document.getElementById('reserveBtnText').textContent = 'Confirm Reservation';

  const seatsInput = document.getElementById('seats');
  if (seatsInput) {
    seatsInput.max = avail !== null ? avail : (cap || 9999);
    seatsInput.placeholder = avail !== null ? `Max ${avail} seats` : 'Enter total seats';
  }

  ['name','contact','resDate','resTime','seats','notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const warn = document.getElementById('seatsWarning');
  if (warn) warn.style.display = 'none';

  navTo('reservePage', null);
}

function confirmReservation() {
  if (isAdmin() && editIndex === -1) { showToast('Admins cannot make reservations.', 'error'); return; }

  const eventName = document.getElementById('name').value.trim();
  const contact   = document.getElementById('contact').value.trim();
  const date      = document.getElementById('resDate').value;
  const time      = document.getElementById('resTime').value;
  const seats     = parseInt(document.getElementById('seats').value);
  const notes     = document.getElementById('notes').value.trim();

  if (!eventName) { showToast('Please enter the event name.', 'error'); return; }
  if (!contact)   { showToast('Please enter a contact number.', 'error'); return; }
  if (!date)      { showToast('Please select a date.', 'error'); return; }
  if (!time)      { showToast('Please select a time.', 'error'); return; }
  if (!seats || seats < 1) { showToast('Enter a valid number of seats (min 1).', 'error'); return; }

  const user = getCurrentUser();
  const gym  = currentGym;

  const cap   = parseInt(gym.capacity) || 0;
  const avail = cap ? getAvailableSeats(gym.name, cap) : null;

  if (avail !== null && seats > avail) {
    showToast(`Only ${avail} seat(s) available. Please reduce your seat count.`, 'error');
    return;
  }

  if (isAdmin() && editIndex !== -1) {
    reservations[editIndex] = { ...reservations[editIndex], eventName, contact, date, time, seats, notes };
    editIndex = -1;
    save('bb_reservations', reservations);
    updateBadges();
    pushActivity(`Admin updated reservation for ${gym.name}`);
    showToast('Reservation updated!', 'success');
    navTo('adminResPage', document.querySelector('[data-page="adminResPage"]'));
    loadAdminResPage();
    return;
  }

  if (editIndex === -1) {
    const conflict = reservations.some(r =>
      r.user === user && r.event === gym.name && r.date === date && r.time === time && r.status === 'Accepted'
    );
    if (conflict) { showToast('You already have an accepted reservation for this court at the same date and time.', 'error'); return; }
  }

  const data = {
    user, event: gym.name, gymImage: gym.image || null, gymMapsUrl: gym.mapsUrl || null,
    eventName, contact, seats, date, time, notes,
    status:    editIndex !== -1 ? (reservations[editIndex].status || 'Pending') : 'Pending',
    id:        editIndex !== -1 ? reservations[editIndex].id : Date.now(),
    createdAt: new Date().toISOString()
  };

  if (editIndex !== -1) {
    reservations[editIndex] = data;
    editIndex = -1;
    showToast('Reservation updated successfully!', 'success');
    pushActivity(`Updated reservation for ${gym.name}`);
  } else {
    reservations.push(data);
    showToast('Reservation submitted! Awaiting admin approval.', 'success');
    pushActivity(`Submitted reservation at ${gym.name} (Pending)`);
  }

  save('bb_reservations', reservations);
  updateBadges();
  navTo('gymsPage', document.querySelector('[data-page="gymsPage"]'));
  loadGyms();
}

// ─── STATUS BADGE ────────────────────────────
function statusBadge(status) {
  const map = {
    Pending:   { color: 'var(--amber)',  bg: 'rgba(245,158,11,.13)',  label: 'Pending'   },
    Accepted:  { color: 'var(--green)',  bg: 'rgba(16,185,129,.13)',  label: 'Accepted'  },
    Declined:  { color: 'var(--rose)',   bg: 'rgba(244,63,94,.13)',   label: 'Declined'  },
    Available: { color: 'var(--green)',  bg: 'rgba(16,185,129,.13)',  label: 'Available' },
    Full:      { color: 'var(--rose)',   bg: 'rgba(244,63,94,.13)',   label: 'Full'      },
    Closed:    { color: '#888',          bg: 'rgba(100,100,100,.13)', label: 'Closed'    },
    Active:    { color: 'var(--green)',  bg: 'rgba(16,185,129,.13)',  label: 'Active'    },
  };
  const s = map[status] || map['Pending'];
  return `<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;color:${s.color};background:${s.bg}">${s.label}</span>`;
}

// ─── MY RESERVATIONS (USER) ─────────────────
function loadReservations() {
  const container = document.getElementById('reservationList');
  if (!container) return;
  container.innerHTML = '';

  const user  = getCurrentUser();
  const myRes = reservations.map((r, i) => ({ ...r, _globalIndex: i })).filter(r => r.user === user);

  if (!myRes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div>
        <h3>No reservations yet</h3>
        <p>Browse courts and reserve your first seat.</p>
      </div>`;
    return;
  }

  myRes.forEach(r => {
    const gi = r._globalIndex;
    const isPending = !r.status || r.status === 'Pending';
    const gymImg = r.gymImage || DEFAULT_GYM_IMAGE;
    const gym = gyms.find(g => g.name === r.event);
    const mapsUrl = gym ? buildMapsUrl(gym.location, gym.mapsUrl) : (r.gymMapsUrl || null);
    const locationText = gym ? gym.location : '';

    const card = document.createElement('div');
    card.className = 'reservation-card';
    card.innerHTML = `
      <div class="res-card-image-header">
        <img src="${gymImg}" alt="${r.event}" class="res-card-gym-image" onerror="this.src='${DEFAULT_GYM_IMAGE}'">
        <div class="res-card-image-overlay"></div>
        <div class="res-card-gym-name-overlay">${r.event}</div>
        <div class="res-card-status-overlay">${statusBadge(r.status || 'Pending')}</div>
      </div>
      <div class="res-card-body">
        <div class="res-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <strong>Event Name:</strong> ${r.eventName || r.name || '—'}
        </div>
        <div class="res-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          <strong>Contact:</strong> ${r.contact}
        </div>
        <div class="res-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <strong>Date:</strong> ${r.date} at ${r.time}
        </div>
        <div class="res-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <strong>Seats:</strong> ${r.seats}
        </div>
        ${locationText ? `<div class="res-field location-field ${mapsUrl ? 'location-clickable' : ''}" ${mapsUrl ? `onclick="window.open('${mapsUrl}','_blank')"` : ''} title="${mapsUrl ? 'Open in Google Maps' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loc-pin-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <strong>Location:</strong> <span class="loc-text">${locationText}</span>
          ${mapsUrl ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" class="loc-ext-icon"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>` : ''}
        </div>` : ''}
        ${r.notes ? `<div class="res-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg><strong>Notes:</strong> ${r.notes}</div>` : ''}
      </div>
      <div class="res-card-footer">
        ${isPending ? `<button class="btn-edit" onclick="editReservation(${gi})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button>` : ''}
        <button class="btn-cancel" onclick="cancelReservation(${gi})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Cancel</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function editReservation(globalIndex) {
  const r = reservations[globalIndex];
  if (!r || (r.user !== getCurrentUser() && !isAdmin())) { showToast('Cannot edit this reservation.', 'error'); return; }

  const gym = gyms.find(g => g.name === r.event);
  const cap = gym ? parseInt(gym.capacity) || 0 : 0;
  const avail = cap ? getAvailableSeats(r.event, cap) : null;

  currentGym = {
    name: r.event, image: r.gymImage || null, capacity: cap, availableSeats: avail,
    location: gym ? gym.location : '', mapsUrl: gym ? gym.mapsUrl : '', status: gym ? gym.status : 'Available'
  };
  editIndex = globalIndex;

  const gymImage = r.gymImage || DEFAULT_GYM_IMAGE;
  const mapsUrl  = buildMapsUrl(currentGym.location, currentGym.mapsUrl);
  const imgEl = document.getElementById('reserveGymImage');
  if (imgEl) { imgEl.src = gymImage; imgEl.onerror = () => { imgEl.src = DEFAULT_GYM_IMAGE; }; }

  const nameOverlay = document.getElementById('reserveImageName');
  const locOverlay  = document.getElementById('reserveImageLoc');
  if (nameOverlay) nameOverlay.textContent = r.event;
  if (locOverlay) {
    locOverlay.innerHTML = currentGym.location
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ${currentGym.location}`
      : '';
    if (mapsUrl) { locOverlay.style.cursor='pointer'; locOverlay.onclick=()=>window.open(mapsUrl,'_blank'); }
  }

  document.getElementById('detailName').textContent = r.event;
  const detailLocEl = document.getElementById('detailLocation');
  if (detailLocEl) {
    if (currentGym.location && mapsUrl) {
      detailLocEl.innerHTML = `<a href="${mapsUrl}" target="_blank" class="detail-loc-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${currentGym.location}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>`;
    } else {
      detailLocEl.textContent = currentGym.location || '—';
    }
  }
  document.getElementById('detailSeats').textContent  = avail !== null ? `${avail} of ${cap} seats free` : '— editing mode';
  document.getElementById('detailStatus').textContent = gym ? (gym.status || 'Available') : '—';
  document.getElementById('reserveBtnText').textContent = 'Update Reservation';

  document.getElementById('name').value    = r.eventName || r.name || '';
  document.getElementById('contact').value = r.contact;
  document.getElementById('resDate').value = r.date;
  document.getElementById('resTime').value = r.time;
  document.getElementById('seats').value   = r.seats;
  document.getElementById('notes').value   = r.notes || '';

  const seatsInput = document.getElementById('seats');
  if (seatsInput && avail !== null) {
    seatsInput.max = avail + (r.seats || 0);
  }

  const warn = document.getElementById('seatsWarning');
  if (warn) warn.style.display = 'none';

  navTo('reservePage', null);
}

function cancelReservation(globalIndex) {
  const r = reservations[globalIndex];
  if (!r || (r.user !== getCurrentUser() && !isAdmin())) { showToast('Cannot cancel this reservation.', 'error'); return; }

  openModal({
    title: 'Cancel Reservation',
    msg: `Cancel the reservation for "${r.event}"? This cannot be undone.`,
    onConfirm: () => {
      pushActivity(`Cancelled reservation at ${r.event}`);
      reservations.splice(globalIndex, 1);
      save('bb_reservations', reservations);
      updateBadges();
      if (isAdmin()) { loadAdminResPage(); } else { loadReservations(); }
      showToast('Reservation cancelled.', 'info');
      if (document.getElementById('gymsPage').classList.contains('active')) loadGyms();
      if (document.getElementById('dashPage').classList.contains('active')) loadDashboard();
    }
  });
}

function confirmClearAll() {
  if (isAdmin()) { showToast('Use the Admin Panel to clear reservations.', 'info'); return; }
  const myRes = getUserReservations();
  if (!myRes.length) { showToast('No reservations to clear.', 'info'); return; }

  openModal({
    title: 'Clear All Reservations',
    msg: `This will permanently delete all ${myRes.length} of your reservation(s). Are you sure?`,
    onConfirm: () => {
      const user = getCurrentUser();
      reservations = reservations.filter(r => r.user !== user);
      save('bb_reservations', reservations);
      pushActivity('Cleared all personal reservations');
      updateBadges();
      loadReservations();
      showToast('All reservations cleared.', 'info');
    }
  });
}

// ─── ADMIN: GYMS PAGE ────────────────────────
function loadAdminGymsPage() {
  if (!isAdmin()) return;
  renderAdminGymsFullTable();
  updateBadges();
}

function renderAdminGymsFullTable() {
  const container = document.getElementById('adminGymsFullTable');
  if (!container) return;

  if (!gyms.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4"/></svg></div>
        <h3>No courts added yet</h3>
        <p>Click "+ Add Court" to add your first court facility.</p>
      </div>`;
    return;
  }

  let rows = gyms.map((g, i) => {
    const thumb = g.image || DEFAULT_GYM_IMAGE;
    const cap   = parseInt(g.capacity) || 0;
    const avail = cap ? getAvailableSeats(g.name, cap) : null;
    const seatColor = getSeatColor(avail === null ? cap : avail, cap);
    const seatLabel = avail !== null ? `${avail} of ${cap}` : (cap ? cap + ' total' : '—');
    const mapsUrl = buildMapsUrl(g.location, g.mapsUrl);

    return `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${thumb}" alt="${g.name}" style="width:56px;height:40px;object-fit:cover;border-radius:8px;flex-shrink:0;" onerror="this.src='${DEFAULT_GYM_IMAGE}'">
          <strong>${g.name}</strong>
        </div>
      </td>
      <td>
        ${g.location ? `<div class="table-location-cell ${mapsUrl ? 'location-clickable' : ''}" ${mapsUrl ? `onclick="window.open('${mapsUrl}','_blank')"` : ''} title="${mapsUrl ? 'Open in Google Maps' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" class="loc-pin-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span class="loc-text">${g.location}</span>
          ${mapsUrl ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" class="loc-ext-icon"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>` : ''}
        </div>` : '<span style="color:#666">—</span>'}
      </td>
      <td>
        <span style="font-weight:700;color:${seatColor}">${seatLabel}</span>
        ${cap ? `<span style="color:#888;font-size:11px"> seats</span>` : ''}
      </td>
      <td>${statusBadge(g.status || 'Available')}</td>
      <td>
        <div class="admin-actions">
          <button class="btn-cancel sm" onclick="adminDeleteGym(${i})" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  `}).join('');

  container.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Court</th><th>Location</th><th>Available Seats</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ─── ADMIN: USERS PAGE ───────────────────────
function loadAdminUsersPage() {
  if (!isAdmin()) return;
  renderUsersTable(Object.entries(users));
  const total  = Object.keys(users).length;
  const active = Object.keys(users).filter(u => reservations.some(r => r.user === u)).length;
  const usStatTotal  = document.getElementById('usStatTotal');
  const usStatActive = document.getElementById('usStatActive');
  if (usStatTotal)  usStatTotal.textContent  = total;
  if (usStatActive) usStatActive.textContent = active;
  updateBadges();
}

function filterUsers() {
  const q = (document.getElementById('userSearchInput').value || '').toLowerCase();
  const filtered = Object.entries(users).filter(([u, d]) =>
    u.toLowerCase().includes(q) || (d.email || '').toLowerCase().includes(q)
  );
  renderUsersTable(filtered);
}

function renderUsersTable(userList) {
  const tbody = document.getElementById('adminUserBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!userList.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No users found.</td></tr>`;
    return;
  }

  userList.forEach(([uname, udata]) => {
    const resCount = reservations.filter(r => r.user === uname).length;
    const status   = udata.status || 'Active';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="admin-user-badge">${uname.slice(0,2).toUpperCase()}</div>
          <div>
            <div style="font-weight:600">${uname}</div>
            <div style="font-size:12px;color:#888">Registered user</div>
          </div>
        </div>
      </td>
      <td>${udata.email || '—'}</td>
      <td><span style="background:rgba(99,102,241,.13);color:#6366f1;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">Resident</span></td>
      <td><span class="admin-seats-chip">${resCount}</span></td>
      <td>${statusBadge(status)}</td>
      <td>
        <div class="admin-actions">
          <button class="btn-cancel sm" onclick="adminDeleteUser('${uname}')" title="Delete User">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── ADMIN: RESERVATIONS PAGE ────────────────
function loadAdminResPage() {
  if (!isAdmin()) return;
  renderResTable(reservations);
  updateResStats();
  detectConflicts();
  updateBadges();
}

function updateResStats() {
  const pending  = reservations.filter(r => !r.status || r.status === 'Pending').length;
  const accepted = reservations.filter(r => r.status === 'Accepted').length;
  const declined = reservations.filter(r => r.status === 'Declined').length;
  const rsPending  = document.getElementById('rsPending');
  const rsAccepted = document.getElementById('rsAccepted');
  const rsDeclined = document.getElementById('rsDeclined');
  if (rsPending)  rsPending.textContent  = pending;
  if (rsAccepted) rsAccepted.textContent = accepted;
  if (rsDeclined) rsDeclined.textContent = declined;
}

function detectConflicts() {
  const banner = document.getElementById('resConflictBanner');
  const msg    = document.getElementById('conflictMsg');
  if (!banner) return;

  const conflicts = [];
  reservations.forEach((r, i) => {
    reservations.forEach((r2, j) => {
      if (i >= j) return;
      if (r.event === r2.event && r.date === r2.date && r.time === r2.time &&
          r.status !== 'Declined' && r2.status !== 'Declined') {
        conflicts.push(`${r.user} & ${r2.user} at ${r.event} on ${r.date}`);
      }
    });
  });

  if (conflicts.length) {
    banner.style.display = 'flex';
    msg.textContent = `${conflicts.length} scheduling conflict(s) detected: ${conflicts[0]}${conflicts.length > 1 ? ` (+${conflicts.length-1} more)` : ''}`;
  } else {
    banner.style.display = 'none';
  }
}

function adminFilterByStatus() {
  const statusFilter = document.getElementById('resStatusFilter').value;
  const q = (document.getElementById('adminSearchInput').value || '').toLowerCase();
  const filtered = reservations.filter(r => {
    const matchQ = !q || JSON.stringify(r).toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || (r.status || 'Pending') === statusFilter;
    return matchQ && matchS;
  });
  renderResTable(filtered);
}

function adminSearchRes() {
  const q = (document.getElementById('adminSearchInput').value || '').toLowerCase();
  const statusFilter = document.getElementById('resStatusFilter')?.value || 'all';
  const filtered = reservations.filter(r => {
    const matchQ = !q || JSON.stringify(r).toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || (r.status || 'Pending') === statusFilter;
    return matchQ && matchS;
  });
  renderResTable(filtered);
}

function renderResTable(list) {
  const tbody = document.getElementById('adminResBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted)">No reservations found.</td></tr>`;
    return;
  }

  list.forEach(r => {
    const i = reservations.indexOf(r);
    const isPending  = !r.status || r.status === 'Pending';
    const isAccepted = r.status === 'Accepted';
    const isDeclined = r.status === 'Declined';
    const thumb = r.gymImage || DEFAULT_GYM_IMAGE;

    const gym = gyms.find(g => g.name === r.event);
    const mapsUrl = gym ? buildMapsUrl(gym.location, gym.mapsUrl) : null;
    const locationText = gym ? gym.location : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="admin-user-badge">${(r.user || '?').slice(0,2).toUpperCase()}</span> ${r.user || '—'}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <img src="${thumb}" style="width:36px;height:28px;object-fit:cover;border-radius:5px;flex-shrink:0;" onerror="this.src='${DEFAULT_GYM_IMAGE}'">
          <div>
            <div>${r.event}</div>
            ${locationText ? `<div class="table-location-mini ${mapsUrl ? 'location-clickable' : ''}" ${mapsUrl ? `onclick="event.stopPropagation();window.open('${mapsUrl}','_blank')"` : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${locationText}
            </div>` : ''}
          </div>
        </div>
      </td>
      <td>${r.eventName || r.name || '—'}</td>
      <td>${r.date} ${r.time}</td>
      <td><span class="admin-seats-chip">${r.seats} seats</span></td>
      <td>${r.contact}</td>
      <td>${statusBadge(r.status || 'Pending')}</td>
      <td>
        <div class="admin-actions">
          ${isPending ? `
            <button class="btn-accept sm" onclick="adminAcceptRes(${i})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Accept
            </button>
            <button class="btn-decline sm" onclick="adminDeclineRes(${i})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Decline
            </button>
          ` : ''}
          ${isAccepted ? `<button class="btn-decline sm" onclick="adminDeclineRes(${i})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Decline</button>` : ''}
          ${isDeclined ? `<button class="btn-accept sm" onclick="adminAcceptRes(${i})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Accept</button>` : ''}
          <button class="btn-edit sm" onclick="adminEditRes(${i})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-cancel sm" onclick="cancelReservation(${i})" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── ADMIN: ACCEPT / DECLINE ─────────────────
function adminAcceptRes(index) {
  const r = reservations[index];
  if (!r) return;

  const gym = gyms.find(g => g.name === r.event);
  const cap = gym ? parseInt(gym.capacity) || 0 : 0;
  if (cap) {
    const avail = getAvailableSeats(r.event, cap);
    if (avail < parseInt(r.seats || 0)) {
      showToast(`Cannot accept: only ${avail} seat(s) available for ${r.event}.`, 'error');
      return;
    }
  }

  reservations[index].status = 'Accepted';
  save('bb_reservations', reservations);
  pushActivity(`Admin accepted reservation for ${r.event} (${r.user})`);
  updateBadges();
  loadAdminResPage();
  showToast(`Reservation accepted for ${r.user}.`, 'success');
}

function adminDeclineRes(index) {
  const r = reservations[index];
  if (!r) return;
  openModal({
    title: 'Decline Reservation',
    msg: `Decline the reservation for "${r.event}" by ${r.user}?`,
    onConfirm: () => {
      reservations[index].status = 'Declined';
      save('bb_reservations', reservations);
      pushActivity(`Admin declined reservation for ${r.event} (${r.user})`);
      updateBadges();
      loadAdminResPage();
      showToast(`Reservation declined for ${r.user}.`, 'info');
    }
  });
}

function adminEditRes(index) { editReservation(index); }

// ─── ADMIN: GYM MANAGEMENT ───────────────────
let pendingGymImageData = null;

function openAddGymModal() {
  if (!isAdmin()) { showToast('Access denied.', 'error'); return; }
  pendingGymImageData = null;
  document.getElementById('addGymModal').classList.remove('hidden');
  document.getElementById('newGymName').value     = '';
  document.getElementById('newGymLocation').value = '';
  document.getElementById('newGymMapsUrl') && (document.getElementById('newGymMapsUrl').value = '');
  document.getElementById('newGymCapacity').value = '';
  document.getElementById('newGymStatus').value   = 'Available';
  const preview = document.getElementById('gymImagePreview');
  if (preview) { preview.src = DEFAULT_GYM_IMAGE; }
  const fileInput = document.getElementById('newGymImage');
  if (fileInput) fileInput.value = '';
}

function closeAddGymModal() {
  document.getElementById('addGymModal').classList.add('hidden');
  pendingGymImageData = null;
}

function handleGymImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please upload a valid image file.', 'error'); return; }
  if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB.', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    pendingGymImageData = e.target.result;
    const preview = document.getElementById('gymImagePreview');
    if (preview) {
      preview.src = pendingGymImageData;
      preview.style.opacity = '1';
    }
    showToast('Image loaded successfully!', 'success');
  };
  reader.readAsDataURL(file);
}

function saveNewGym() {
  const name     = document.getElementById('newGymName').value.trim();
  const location = document.getElementById('newGymLocation').value.trim();
  const mapsUrlEl = document.getElementById('newGymMapsUrl');
  const mapsUrl  = mapsUrlEl ? mapsUrlEl.value.trim() : '';
  const capacity = document.getElementById('newGymCapacity').value;
  const status   = document.getElementById('newGymStatus').value;

  if (!name) { showToast('Please enter a court name.', 'error'); return; }

  if (mapsUrl && !mapsUrl.startsWith('http')) {
    showToast('Please enter a valid Google Maps URL (starting with http).', 'error');
    return;
  }

  gyms.push({
    name,
    location,
    mapsUrl: mapsUrl || null,
    capacity: capacity || '',
    status: status || 'Available',
    image: pendingGymImageData || null
  });
  save('bb_gyms', gyms);
  pendingGymImageData = null;
  updateBadges();
  pushActivity(`Admin added court: ${name}`);

  // Close modal and clear form
  closeAddGymModal();

  // Refresh gym list instantly
  loadAdminGymsPage();

  // Show success popup notification
  showSuccessPopup('Gym added successfully!');
}

function adminDeleteGym(index) {
  const g = gyms[index];
  if (!g) return;
  openModal({
    title: 'Delete Court',
    msg: `Delete "${g.name}"? All related reservations will also be removed.`,
    onConfirm: () => {
      reservations = reservations.filter(r => r.event !== g.name);
      save('bb_reservations', reservations);
      gyms.splice(index, 1);
      save('bb_gyms', gyms);
      pushActivity(`Admin deleted court: ${g.name}`);
      updateBadges();
      loadAdminGymsPage();
      showToast(`Court "${g.name}" deleted.`, 'info');
    }
  });
}

// ─── ADMIN: USER MANAGEMENT ──────────────────
function adminDeleteUser(uname) {
  openModal({
    title: 'Delete User',
    msg: `Delete user "${uname}" and all their reservations? This cannot be undone.`,
    onConfirm: () => {
      delete users[uname];
      save('bb_users', users);
      reservations = reservations.filter(r => r.user !== uname);
      save('bb_reservations', reservations);
      pushActivity(`Admin deleted user: ${uname}`);
      updateBadges();
      loadAdminUsersPage();
      showToast(`User "${uname}" deleted.`, 'info');
    }
  });
}

// ─── ADMIN: CLEAR ALL ────────────────────────
function adminClearAllRes() {
  if (!reservations.length) { showToast('No reservations to clear.', 'info'); return; }
  openModal({
    title: 'Clear ALL Reservations',
    msg: `This will permanently delete ALL ${reservations.length} reservations. Are you sure?`,
    onConfirm: () => {
      reservations = [];
      save('bb_reservations', reservations);
      pushActivity('Admin cleared all reservations');
      updateBadges();
      if (document.getElementById('adminResPage').classList.contains('active')) loadAdminResPage();
      showToast('All reservations cleared.', 'info');
    }
  });
}

// ─── REPORTS ────────────────────────────────
function loadReports() {
  const container = document.getElementById('reportsContent');
  if (!container) return;

  const gymCounts = {};
  gyms.forEach(g => { gymCounts[g.name] = 0; });
  reservations.forEach(r => {
    if (gymCounts[r.event] !== undefined) gymCounts[r.event]++;
    else gymCounts[r.event] = 1;
  });

  const topGym = Object.entries(gymCounts).sort((a,b) => b[1]-a[1])[0];
  const totalSeats = reservations.reduce((s, r) => s + parseInt(r.seats || 0), 0);
  const accepted   = reservations.filter(r => r.status === 'Accepted').length;
  const pending    = reservations.filter(r => !r.status || r.status === 'Pending').length;

  container.innerHTML = `
    <div class="reports-summary">
      <div class="report-card">
        <div class="report-card-icon amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div class="report-val">${totalSeats}</div>
        <div class="report-lbl">Total Seats Reserved</div>
      </div>
      <div class="report-card">
        <div class="report-card-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <div class="report-val">${accepted}</div>
        <div class="report-lbl">Accepted Reservations</div>
      </div>
      <div class="report-card">
        <div class="report-card-icon amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="report-val">${pending}</div>
        <div class="report-lbl">Pending Approval</div>
      </div>
      <div class="report-card">
        <div class="report-card-icon indigo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4"/></svg>
        </div>
        <div class="report-val">${topGym ? topGym[0] : '—'}</div>
        <div class="report-lbl">Most Popular Court</div>
      </div>
    </div>

    <div class="panel" style="margin-top:24px">
      <div class="panel-header">
        <div class="panel-title">Reservations per Court</div>
      </div>
      <div class="gym-report-list">
        ${Object.entries(gymCounts).length ? Object.entries(gymCounts).sort((a,b)=>b[1]-a[1]).map(([name, count]) => {
          const gym = gyms.find(g => g.name === name);
          const thumb = gym && gym.image ? gym.image : DEFAULT_GYM_IMAGE;
          const mapsUrl = gym ? buildMapsUrl(gym.location, gym.mapsUrl) : null;
          const location = gym ? gym.location : '';
          return `
          <div class="gym-report-row">
            <img src="${thumb}" style="width:40px;height:30px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.src='${DEFAULT_GYM_IMAGE}'">
            <div>
              <div class="gym-report-name">${name}</div>
              ${location ? `<div class="table-location-mini ${mapsUrl?'location-clickable':''}" ${mapsUrl?`onclick="window.open('${mapsUrl}','_blank')"`:''} style="font-size:11px;margin-top:2px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${location}
              </div>` : ''}
            </div>
            <div class="gym-report-bar-wrap">
              <div class="gym-report-bar" style="width:${Math.max(4, (count / Math.max(...Object.values(gymCounts),1)) * 100)}%"></div>
            </div>
            <div class="gym-report-count">${count} reservations</div>
          </div>
        `}).join('') : '<div class="activity-empty">No reservation data yet.</div>'}
      </div>
    </div>
  `;
}

// ─── SETTINGS ────────────────────────────────
function resetActivity() {
  openModal({
    title: 'Reset Activity Log',
    msg: 'Clear all activity history? This cannot be undone.',
    onConfirm: () => {
      activity = [];
      save('bb_activity', activity);
      showToast('Activity log cleared.', 'info');
    }
  });
}

// ─── MODAL CLOSE ON OVERLAY ──────────────────
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.getElementById('addGymModal').addEventListener('click', function(e) {
  if (e.target === this) closeAddGymModal();
});

// ─── AUTO-LOGIN CHECK ────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  updateTopbarDate();
  const user = localStorage.getItem('bb_currentUser');
  if (user && (user === ADMIN_USER || users[user])) {
    document.getElementById('authWrapper').style.display = 'none';
    launchApp(user);
  }
});