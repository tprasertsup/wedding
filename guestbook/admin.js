(function () {
  const CONFIG = window.GUESTBOOK_CONFIG || {};
  const state = {
    token: sessionStorage.getItem('guestbook-admin-token') || '',
    filter: 'all',
    submissions: []
  };

  const loginPanel = document.getElementById('login-panel');
  const dashboard = document.getElementById('dashboard');
  const loginError = document.getElementById('admin-login-error');
  const grid = document.getElementById('admin-grid');
  const empty = document.getElementById('admin-empty');
  const summary = document.getElementById('admin-summary');
  const logoutButton = document.getElementById('logout-button');
  const exportLink = document.getElementById('export-link');

  function apiBase() {
    return String(CONFIG.apiBaseUrl || '').replace(/\/$/, '');
  }

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
  }

  async function api(path, options = {}) {
    const response = await fetch(apiBase() + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.error || 'Request failed.');
    return data;
  }

  async function login(event) {
    event.preventDefault();
    loginError.hidden = true;
    if (!apiBase() || apiBase().includes('your-guestbook-api')) {
      showLoginError('Set guestbook/config.js to your deployed API URL first.');
      return;
    }
    const password = document.getElementById('admin-password').value;
    try {
      const data = await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      state.token = data.token;
      sessionStorage.setItem('guestbook-admin-token', state.token);
      await loadSubmissions();
      renderShell();
    } catch (error) {
      showLoginError(error.message);
    }
  }

  async function loadSubmissions() {
    const data = await api('/api/admin/submissions');
    state.submissions = data.submissions || [];
    render();
  }

  function renderShell() {
    const signedIn = Boolean(state.token);
    loginPanel.hidden = signedIn;
    dashboard.hidden = !signedIn;
    logoutButton.hidden = !signedIn;
    exportLink.href = apiBase() + '/api/admin/export.csv';
    exportLink.addEventListener('click', (event) => {
      event.preventDefault();
      downloadCsv();
    });
  }

  function filteredSubmissions() {
    return state.submissions.filter((item) => {
      if (state.filter === 'video') return item.mediaType === 'video';
      if (state.filter === 'photo') return item.mediaType === 'photo';
      if (state.filter === 'favorite') return item.isFavorite;
      if (state.filter === 'unreviewed') return !item.isReviewed;
      return true;
    });
  }

  function render() {
    renderSummary();
    grid.innerHTML = '';
    const items = filteredSubmissions();
    empty.hidden = items.length > 0;
    items.forEach((item) => grid.appendChild(cardFor(item)));
  }

  function renderSummary() {
    const videos = state.submissions.filter((item) => item.mediaType === 'video').length;
    const photos = state.submissions.filter((item) => item.mediaType === 'photo').length;
    const favorites = state.submissions.filter((item) => item.isFavorite).length;
    const unreviewed = state.submissions.filter((item) => !item.isReviewed).length;
    summary.innerHTML = [
      ['Videos', videos],
      ['Photos', photos],
      ['Favorites', favorites],
      ['Unreviewed', unreviewed]
    ].map(([label, value]) => `<span><strong>${value}</strong>${label}</span>`).join('');
  }

  function cardFor(item) {
    const card = document.createElement('article');
    card.className = 'admin-card';
    card.innerHTML = `
      <div class="admin-card-head">
        <span class="media-pill">${escapeHtml(item.mediaType)}</span>
        <time>${formatDate(item.createdAt)}</time>
      </div>
      <h2>${escapeHtml(item.guestName || 'Unnamed guest')}</h2>
      <p>${escapeHtml(item.relationship || item.caption || item.prompt || '')}</p>
      ${item.prompt ? `<p class="admin-meta"><strong>Prompt:</strong> ${escapeHtml(item.prompt)}</p>` : ''}
      ${item.caption ? `<p class="admin-meta"><strong>Caption:</strong> ${escapeHtml(item.caption)}</p>` : ''}
      <p class="admin-meta"><strong>File:</strong> ${escapeHtml(item.storedFileName)}</p>
      <div class="admin-card-actions">
        <a class="secondary-action" href="${escapeAttribute(item.driveUrl)}" target="_blank" rel="noopener">Open in Drive</a>
        <button type="button" class="secondary-action" data-admin-action="favorite">${item.isFavorite ? 'Unfavorite' : 'Favorite'}</button>
        <button type="button" class="secondary-action" data-admin-action="reviewed">${item.isReviewed ? 'Mark Unreviewed' : 'Mark Reviewed'}</button>
      </div>
      <label class="admin-notes">
        <span>Admin notes</span>
        <textarea rows="3">${escapeHtml(item.notes || '')}</textarea>
      </label>
      <button type="button" class="primary-action compact" data-admin-action="save-notes">Save Notes</button>
    `;

    card.querySelector('[data-admin-action="favorite"]').addEventListener('click', () => {
      updateItem(item.id, { isFavorite: !item.isFavorite });
    });
    card.querySelector('[data-admin-action="reviewed"]').addEventListener('click', () => {
      updateItem(item.id, { isReviewed: !item.isReviewed, status: !item.isReviewed ? 'reviewed' : 'uploaded' });
    });
    card.querySelector('[data-admin-action="save-notes"]').addEventListener('click', () => {
      updateItem(item.id, { notes: card.querySelector('textarea').value });
    });
    return card;
  }

  async function updateItem(id, patch) {
    const data = await api('/api/admin/update-status', {
      method: 'POST',
      body: JSON.stringify({ id, ...patch })
    });
    state.submissions = state.submissions.map((item) => item.id === id ? { ...item, ...data.submission } : item);
    render();
  }

  async function downloadCsv() {
    const response = await fetch(apiBase() + '/api/admin/export.csv', {
      headers: { Authorization: `Bearer ${state.token}` }
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nine-tom-guestbook-submissions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
  }

  function wireEvents() {
    document.getElementById('login-form').addEventListener('submit', login);
    document.getElementById('refresh-button').addEventListener('click', loadSubmissions);
    logoutButton.addEventListener('click', () => {
      state.token = '';
      sessionStorage.removeItem('guestbook-admin-token');
      renderShell();
    });
    document.querySelectorAll('.tab').forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.filter;
        document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
        render();
      });
    });
  }

  async function init() {
    wireEvents();
    renderShell();
    if (state.token) {
      try {
        await loadSubmissions();
      } catch (error) {
        state.token = '';
        sessionStorage.removeItem('guestbook-admin-token');
        renderShell();
      }
    }
  }

  init();
})();

