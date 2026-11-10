/**
 * MINIKITCHEN — EXECUTIVE HOSPITALITY MANAGEMENT CONTROLLER
 * Handles administrator authentication, operational metrics calculation,
 * real-time guest ledger management, and gastronomy collection administration.
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// Curated Michelin / Luxury Hotel food photography library
const FOOD_IMAGES = {
  crab: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=900&q=88',
  prawn: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=88',
  cuttlefish: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=900&q=88',
  squid: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=900&q=88',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=88',
  seafood: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=900&q=88',
  kottu: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=88',
  roti: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=88',
  hopper: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=88',
  curry: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=900&q=88',
  rice: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=88',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=88',
  chicken: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=88',
  dessert: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=88',
  juice: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=88',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=88',
};

const LUXURY_FALLBACK_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
  <rect width="600" height="380" fill="#0f2420"/>
  <circle cx="300" cy="170" r="70" fill="none" stroke="#c5a880" stroke-width="1.5" stroke-dasharray="4 4"/>
  <text x="300" y="178" font-family="Georgia, serif" font-size="28" fill="#c5a880" text-anchor="middle">⚜</text>
  <text x="300" y="270" font-family="-apple-system, sans-serif" font-size="12" letter-spacing="4" font-weight="600" fill="#dfcaa7" text-anchor="middle">MINIKITCHEN SANCTUARY</text>
</svg>
`);

function getMenuItemImage(item) {
  if (item.image_url && typeof item.image_url === 'string' && item.image_url.trim().length > 5) {
    return item.image_url.trim();
  }
  const text = `${item.name || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGES)) {
    if (key !== 'default' && text.includes(key)) {
      return url;
    }
  }
  return FOOD_IMAGES.default;
}

// ---------- Authentication State & Bootstrap ----------
let authed = false;

async function checkAuth() {
  try {
    const r = await fetch('/api/admin/check');
    if (r.ok) return true;
  } catch {}
  return false;
}

function showDashboard() {
  authed = true;
  $('#login-screen').style.display = 'none';
  $('#dashboard').style.display = 'block';
  loadReservations();
  loadMenuAdmin();
}

function showLogin() {
  authed = false;
  $('#dashboard').style.display = 'none';
  $('#login-screen').style.display = 'flex';
}

(async () => {
  if (await checkAuth()) {
    showDashboard();
  } else {
    showLogin();
  }
})();

// ---------- Login Submission ----------
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const err = $('#login-err');
  btn.disabled = true;
  btn.textContent = 'Authenticating…';
  err.style.display = 'none';

  try {
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: $('#login-user').value.trim(),
        password: $('#login-pass').value,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Authentication rejected');
    if (data.token) {
      sessionStorage.setItem('admin_jwt', data.token);
    }
    showDashboard();
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Authenticate Access';
  }
});

// ---------- Logout ----------
$('#logout-btn').addEventListener('click', async () => {
  sessionStorage.removeItem('admin_jwt');
  await fetch('/api/admin/logout', { method: 'POST' });
  showLogin();
});

// ---------- State & Operational Metrics ----------
let allReservations = [];
let menuItems = [];

function updateMetrics() {
  const total = allReservations.length;
  const pending = allReservations.filter((r) => r.status === 'Pending').length;
  const confirmed = allReservations.filter((r) => r.status === 'Confirmed').length;

  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const todayReservations = allReservations.filter((r) => r.date === todayStr && r.status !== 'Cancelled');
  const todayCovers = todayReservations.reduce((acc, r) => acc + (Number(r.guests) || 0), 0);

  const activeDishes = menuItems.filter((m) => m.available).length;

  if ($('#metric-total')) $('#metric-total').textContent = total;
  if ($('#metric-pending')) $('#metric-pending').textContent = pending;
  if ($('#metric-confirmed')) $('#metric-confirmed').textContent = confirmed;
  if ($('#metric-today')) $('#metric-today').textContent = `${todayCovers} (${todayReservations.length})`;
  if ($('#metric-today-date')) $('#metric-today-date').textContent = `${todayStr} • active covers`;
  if ($('#metric-menu')) $('#metric-menu').textContent = menuItems.length;
  if ($('#metric-menu-avail')) $('#metric-menu-avail').textContent = `${activeDishes} currently available`;
}

// ---------- Reservations Ledger ----------
async function loadReservations() {
  const wrap = $('#reservations-table-wrap');
  wrap.innerHTML = '<p class="muted" style="padding:28px 20px;">Retrieving guest ledger from database…</p>';
  try {
    const r = await fetch('/api/admin/reservations');
    if (!r.ok) throw new Error();
    allReservations = await r.json();
    renderReservations();
    updateMetrics();
  } catch {
    wrap.innerHTML = '<p class="admin-alert error" style="margin:20px;">Could not retrieve guest reservations ledger.</p>';
  }
}

function renderReservations() {
  const statusFilter = $('#status-filter') ? $('#status-filter').value : '';
  const dateFilter = $('#date-filter') ? $('#date-filter').value : '';
  const searchFilter = $('#search-input') ? $('#search-input').value.trim().toLowerCase() : '';
  const wrap = $('#reservations-table-wrap');

  let list = allReservations;

  if (statusFilter) {
    list = list.filter((r) => r.status === statusFilter);
  }
  if (dateFilter) {
    list = list.filter((r) => r.date === dateFilter);
  }
  if (searchFilter) {
    list = list.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const contact = (r.contact || '').toLowerCase();
      const id = String(r.id || '');
      return name.includes(searchFilter) || contact.includes(searchFilter) || id.includes(searchFilter);
    });
  }

  if (list.length === 0) {
    wrap.innerHTML = `
      <div style="padding:48px 20px;text-align:center;">
        <p class="font-serif" style="font-size:1.4rem;color:var(--color-primary);margin-bottom:6px;">No reservations found</p>
        <p class="muted" style="font-size:0.9rem;">No guest records match your search or filter criteria.</p>
      </div>
    `;
    return;
  }

  const table = document.createElement('table');
  table.className = 'admin-ledger-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Guest Name</th>
        <th>Contact Information</th>
        <th>Date</th>
        <th>Time</th>
        <th>Covers</th>
        <th>Seating Preference</th>
        <th>Channel</th>
        <th>Status</th>
        <th>Review Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  for (const res of list) {
    const tr = document.createElement('tr');
    const dateStr = res.date ? res.date : '—';
    const timeStr = res.time ? res.time.slice(0, 5) : '—';
    const shortId = String(res.id || '').length > 10 ? String(res.id).slice(0, 8) + '…' : String(res.id);

    tr.innerHTML = `
      <td><span style="font-family:monospace;font-weight:700;color:var(--color-gold-dark);" title="${escHtml(String(res.id))}">${escHtml(shortId)}</span></td>
      <td><strong>${escHtml(res.name)}</strong></td>
      <td>${escHtml(res.contact)}</td>
      <td>${escHtml(dateStr)}</td>
      <td>${escHtml(timeStr)}</td>
      <td><strong>${res.guests}</strong></td>
      <td><span class="seating-tag">${escHtml(res.seating || 'Standard / Veranda')}</span></td>
      <td><span class="source-tag">${escHtml(res.source || 'web')}</span></td>
      <td><span class="status-pill ${escHtml(res.status)}">${escHtml(res.status)}</span></td>
      <td></td>
    `;

    // Status updater dropdown
    const sel = document.createElement('select');
    sel.className = 'status-action-select';
    ['Pending', 'Confirmed', 'Cancelled'].forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === res.status) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', async () => {
      sel.disabled = true;
      const oldStatus = res.status;
      const newStatus = sel.value;
      try {
        const rr = await fetch(`/api/admin/reservations/${res.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!rr.ok) throw new Error();
        res.status = newStatus;
        const badge = tr.querySelector('.status-pill');
        badge.className = `status-pill ${newStatus}`;
        badge.textContent = newStatus;
        updateMetrics();
      } catch {
        alert('Could not update reservation status. Please try again.');
        sel.value = oldStatus;
      } finally {
        sel.disabled = false;
      }
    });

    tr.querySelector('td:last-child').appendChild(sel);
    tbody.appendChild(tr);
  }

  wrap.innerHTML = '';
  wrap.appendChild(table);
}

// Filter Listeners
if ($('#status-filter')) $('#status-filter').addEventListener('change', renderReservations);
if ($('#date-filter')) $('#date-filter').addEventListener('input', renderReservations);
if ($('#search-input')) $('#search-input').addEventListener('input', renderReservations);
if ($('#reset-filters-btn')) {
  $('#reset-filters-btn').addEventListener('click', () => {
    if ($('#status-filter')) $('#status-filter').value = '';
    if ($('#date-filter')) $('#date-filter').value = '';
    if ($('#search-input')) $('#search-input').value = '';
    renderReservations();
  });
}

// ---------- Gastronomy Collection Admin ----------
async function loadMenuAdmin() {
  const wrap = $('#menu-admin-list');
  wrap.innerHTML = '<p class="muted" style="padding:24px 0;">Loading gastronomy offerings…</p>';
  try {
    const r = await fetch('/api/menu?t=' + Date.now());
    if (!r.ok) throw new Error();
    menuItems = await r.json();
    renderMenuAdmin();
    updateMetrics();
  } catch {
    wrap.innerHTML = '<p class="admin-alert error">Could not load gastronomy collection items.</p>';
  }
}

function renderMenuAdmin() {
  const wrap = $('#menu-admin-list');
  if (menuItems.length === 0) {
    wrap.innerHTML = `
      <div style="padding:36px;text-align:center;">
        <p class="font-serif" style="font-size:1.3rem;">No offerings published yet.</p>
        <p class="muted">Add your first fine-dining offering above.</p>
      </div>
    `;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'admin-dish-grid';

  for (const item of menuItems) {
    grid.appendChild(buildAdminDishCard(item));
  }

  wrap.innerHTML = '';
  wrap.appendChild(grid);
}

function buildAdminDishCard(item) {
  const card = document.createElement('article');
  card.className = 'admin-dish-card';
  card.dataset.id = item.id;

  // Media
  const media = document.createElement('div');
  media.className = 'admin-dish-media';
  const img = document.createElement('img');
  img.className = 'admin-dish-img';
  img.src = getMenuItemImage(item);
  img.alt = item.name || 'Dish';
  img.loading = 'lazy';
  img.onerror = () => {
    img.onerror = null;
    img.src = LUXURY_FALLBACK_SVG;
  };
  media.appendChild(img);

  const catTag = document.createElement('span');
  catTag.className = 'admin-dish-cat-tag';
  catTag.textContent = item.category || 'Specialty';
  media.appendChild(catTag);
  card.appendChild(media);

  // Content
  const body = document.createElement('div');
  body.className = 'admin-dish-body';

  const top = document.createElement('div');
  top.className = 'admin-dish-top';
  const title = document.createElement('h4');
  title.className = 'admin-dish-title';
  title.textContent = item.name;
  const price = document.createElement('span');
  price.className = 'admin-dish-price';
  price.textContent = 'Rs. ' + Number(item.price).toLocaleString();
  top.appendChild(title);
  top.appendChild(price);
  body.appendChild(top);

  const desc = document.createElement('p');
  desc.className = 'admin-dish-desc';
  desc.textContent = item.description || 'No description provided.';
  body.appendChild(desc);

  // Action Buttons
  const actions = document.createElement('div');
  actions.className = 'admin-dish-actions';

  // Availability Toggle
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = `admin-toggle-avail ${item.available ? 'active' : 'inactive'}`;
  toggleBtn.textContent = item.available ? 'Available' : 'Sold Out';
  toggleBtn.addEventListener('click', async () => {
    toggleBtn.disabled = true;
    const newVal = !item.available;
    try {
      const r = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newVal }),
      });
      if (!r.ok) throw new Error();
      item.available = newVal;
      toggleBtn.textContent = newVal ? 'Available' : 'Sold Out';
      toggleBtn.className = `admin-toggle-avail ${newVal ? 'active' : 'inactive'}`;
      updateMetrics();
    } catch {
      alert('Could not update dish availability.');
    } finally {
      toggleBtn.disabled = false;
    }
  });
  actions.appendChild(toggleBtn);

  // Edit Button
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'admin-btn-edit';
  editBtn.textContent = 'Edit';

  let editForm = null;
  editBtn.addEventListener('click', () => {
    if (editForm) {
      editForm.remove();
      editForm = null;
      editBtn.textContent = 'Edit';
      return;
    }
    editBtn.textContent = 'Cancel';
    editForm = buildInlineEditForm(item, card, () => {
      editForm = null;
      editBtn.textContent = 'Edit';
    });
    body.appendChild(editForm);
  });
  actions.appendChild(editBtn);

  // Delete Button
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'admin-btn-delete';
  delBtn.textContent = 'Delete';
  delBtn.addEventListener('click', async () => {
    if (!confirm(`Are you certain you wish to remove "${item.name}" from the gastronomy collection?`)) return;
    delBtn.disabled = true;
    try {
      const r = await fetch(`/api/admin/menu/${item.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      menuItems = menuItems.filter((m) => m.id !== item.id);
      card.remove();
      updateMetrics();
      if (menuItems.length === 0) renderMenuAdmin();
    } catch {
      alert('Could not delete dish. Please try again.');
      delBtn.disabled = false;
    }
  });
  actions.appendChild(delBtn);

  body.appendChild(actions);
  card.appendChild(body);
  return card;
}

function buildInlineEditForm(item, card, onDone) {
  const form = document.createElement('form');
  form.className = 'dish-inline-edit';

  form.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="field-group">
        <label style="font-size:0.75rem;">Dish Name</label>
        <input type="text" name="name" value="${escHtml(item.name)}" required>
      </div>
      <div class="field-group">
        <label style="font-size:0.75rem;">Price (Rs.)</label>
        <input type="number" name="price" value="${item.price}" min="0" step="0.01" required>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="field-group">
        <label style="font-size:0.75rem;">Category</label>
        <input type="text" name="category" value="${escHtml(item.category || '')}">
      </div>
      <div class="field-group">
        <label style="font-size:0.75rem;">Photo URL</label>
        <input type="url" name="image_url" value="${escHtml(item.image_url || '')}" placeholder="https://…">
      </div>
    </div>

    <div class="field-group">
      <label style="font-size:0.75rem;">Description</label>
      <input type="text" name="description" value="${escHtml(item.description || '')}">
    </div>

    <div style="display:flex;gap:10px;align-items:center;margin-top:6px;">
      <button type="submit" class="btn btn-primary" style="padding:8px 18px;font-size:0.75rem;">
        Save Changes
      </button>
      <span class="inline-msg" style="font-size:0.8rem;color:var(--color-text-muted);"></span>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const msg = form.querySelector('.inline-msg');
    btn.disabled = true;
    msg.textContent = 'Saving changes…';

    const changes = {
      name: form.name.value.trim(),
      price: Number(form.price.value),
      category: form.category.value.trim(),
      description: form.description.value.trim(),
      image_url: form.image_url.value.trim(),
    };

    try {
      const r = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!r.ok) throw new Error();
      const updated = await r.json();
      Object.assign(item, updated);
      const newCard = buildAdminDishCard(item);
      card.replaceWith(newCard);
      updateMetrics();
      onDone();
    } catch {
      msg.textContent = 'Could not update dish.';
      msg.style.color = 'var(--color-danger)';
      btn.disabled = false;
    }
  });

  return form;
}

// Preset Photo Pills in Add Dish Form
const addImgInput = $('#new-item-image');
const previewWrap = $('#add-item-preview-wrap');
const previewImg = $('#add-item-preview');
const addCatInput = $('#new-item-category');

function updateAddPreview(url) {
  if (url && url.trim().startsWith('http')) {
    previewImg.src = url.trim();
    previewWrap.style.display = 'block';
  } else {
    previewWrap.style.display = 'none';
  }
}

if (addImgInput) {
  addImgInput.addEventListener('input', () => updateAddPreview(addImgInput.value));
}

$$('.preset-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    const imgUrl = btn.dataset.img;
    const cat = btn.dataset.cat;
    if (addImgInput) addImgInput.value = imgUrl;
    if (addCatInput && !addCatInput.value) addCatInput.value = cat;
    updateAddPreview(imgUrl);
  });
});

// Add Dish Form Submit
$('#add-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = $('#add-item-msg');
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Publishing…';
  msg.className = 'admin-alert';
  msg.style.display = 'block';
  msg.textContent = 'Registering offering with atelier…';

  const payload = {
    name: form.name.value.trim(),
    price: Number(form.price.value),
    category: form.category.value.trim() || 'Lagoon Specialties',
    description: form.description.value.trim(),
    image_url: form.image_url.value.trim(),
    available: form.available.checked,
  };

  try {
    const r = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Failed to add dish to collection');

    msg.className = 'admin-alert success';
    msg.textContent = `"${data.name}" published to Gastronomy Collection.`;
    form.reset();
    form.available.checked = true;
    if (previewWrap) previewWrap.style.display = 'none';

    menuItems.push(data);
    renderMenuAdmin();
    updateMetrics();
  } catch (ex) {
    msg.className = 'admin-alert error';
    msg.textContent = ex.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish to Gastronomy Collection';
  }
});

// Helper
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
