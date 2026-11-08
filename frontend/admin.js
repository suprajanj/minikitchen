const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// Food image preset dictionary
const FOOD_IMAGES = {
  crab: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=700&q=85',
  prawn: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=700&q=85',
  cuttlefish: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=85',
  squid: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=85',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=85',
  seafood: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=700&q=85',
  kottu: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=85',
  roti: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=700&q=85',
  hopper: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85',
  curry: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=700&q=85',
  rice: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=85',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=85',
  chicken: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=700&q=85',
  dessert: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=85',
  juice: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=85',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=85',
};

const FALLBACK_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <rect width="400" height="240" fill="#fcf4eb"/>
  <text x="200" y="115" font-size="36" text-anchor="middle">🥘</text>
  <text x="200" y="165" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#d9480f" text-anchor="middle">MiniKitchen Dish</text>
</svg>
`);

function getMenuItemImage(item) {
  if (item.image_url && typeof item.image_url === 'string' && item.image_url.trim().startsWith('http')) {
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

// ---------- Auth state ----------
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
  $('#dashboard').style.display = '';
  loadReservations();
  loadMenuAdmin();
}

function showLogin() {
  authed = false;
  $('#dashboard').style.display = 'none';
  $('#login-screen').style.display = '';
}

// ---------- Bootstrap ----------
(async () => {
  if (await checkAuth()) {
    showDashboard();
  }
})();

// ---------- Login ----------
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const err = $('#login-err');
  btn.disabled = true;
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
    if (!r.ok) throw new Error(data.error || 'Login failed');
    if (data.token) {
      sessionStorage.setItem('admin_jwt', data.token);
    }
    showDashboard();
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = '';
  } finally {
    btn.disabled = false;
  }
});

// ---------- Logout ----------
$('#logout-btn').addEventListener('click', async () => {
  sessionStorage.removeItem('admin_jwt');
  await fetch('/api/admin/logout', { method: 'POST' });
  showLogin();
});

// ---------- Reservations ----------
let allReservations = [];

async function loadReservations() {
  const wrap = $('#reservations-table-wrap');
  wrap.innerHTML = '<p class="muted">Loading reservations…</p>';
  try {
    const r = await fetch('/api/admin/reservations');
    if (!r.ok) throw new Error();
    allReservations = await r.json();
    renderReservations();
  } catch {
    wrap.innerHTML = '<p class="form-message bad" style="display:block;">Could not load reservations.</p>';
  }
}

function renderReservations() {
  const filter = $('#status-filter').value;
  const list = filter ? allReservations.filter((r) => r.status === filter) : allReservations;
  const wrap = $('#reservations-table-wrap');

  if (list.length === 0) {
    wrap.innerHTML = '<p class="muted" style="padding:24px 0;">No reservations match the selected filter.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'res-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Customer Name</th>
        <th>Contact Info</th>
        <th>Date</th>
        <th>Time</th>
        <th>Guests</th>
        <th>Channel</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  for (const res of list) {
    const tr = document.createElement('tr');
    const dateStr = res.date ? res.date : '—';
    const timeStr = res.time ? res.time.slice(0, 5) : '—';

    tr.innerHTML = `
      <td><strong>#${res.id}</strong></td>
      <td><strong>${escHtml(res.name)}</strong></td>
      <td>${escHtml(res.contact)}</td>
      <td>${escHtml(dateStr)}</td>
      <td>${escHtml(timeStr)}</td>
      <td><strong>${res.guests}</strong></td>
      <td><span class="source-badge">${escHtml(res.source || 'web')}</span></td>
      <td><span class="status-badge ${escHtml(res.status)}">${escHtml(res.status)}</span></td>
      <td></td>
    `;

    // Status change select dropdown
    const sel = document.createElement('select');
    sel.className = 'action-select';
    ['Pending', 'Confirmed', 'Cancelled'].forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === res.status) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', async () => {
      sel.disabled = true;
      try {
        const rr = await fetch(`/api/admin/reservations/${res.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: sel.value }),
        });
        if (!rr.ok) throw new Error();
        res.status = sel.value;
        const badge = tr.querySelector('.status-badge');
        badge.className = `status-badge ${res.status}`;
        badge.textContent = res.status;
      } catch {
        alert('Could not update status. Please try again.');
        sel.value = res.status;
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

$('#status-filter').addEventListener('change', renderReservations);

// ---------- Menu admin ----------
let menuItems = [];

async function loadMenuAdmin() {
  const wrap = $('#menu-admin-list');
  wrap.innerHTML = '<p class="muted">Loading dishes…</p>';
  try {
    const r = await fetch('/api/menu');
    if (!r.ok) throw new Error();
    menuItems = await r.json();
    renderMenuAdmin();
  } catch {
    wrap.innerHTML = '<p class="form-message bad" style="display:block;">Could not load menu items.</p>';
  }
}

function renderMenuAdmin() {
  const wrap = $('#menu-admin-list');
  if (menuItems.length === 0) {
    wrap.innerHTML = '<p class="muted">No dishes on the menu yet. Add your first dish above!</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'menu-admin-grid';

  for (const item of menuItems) {
    grid.appendChild(buildMenuAdminCard(item));
  }

  wrap.innerHTML = '';
  wrap.appendChild(grid);
}

function buildMenuAdminCard(item) {
  const card = document.createElement('div');
  card.className = 'menu-admin-card';
  card.dataset.id = item.id;

  // Dish Image Thumbnail Banner
  const imgWrap = document.createElement('div');
  imgWrap.className = 'admin-card-img-wrap';
  const img = document.createElement('img');
  img.className = 'admin-card-img';
  img.src = getMenuItemImage(item);
  img.alt = item.name;
  img.loading = 'lazy';
  img.onerror = () => {
    img.onerror = null;
    img.src = FALLBACK_SVG;
  };
  imgWrap.appendChild(img);

  const catBadge = document.createElement('span');
  catBadge.className = 'admin-card-cat-badge';
  catBadge.textContent = item.category || 'Special';
  imgWrap.appendChild(catBadge);
  card.appendChild(imgWrap);

  // Card Content
  const content = document.createElement('div');
  content.className = 'admin-card-content';

  const top = document.createElement('div');
  top.className = 'card-top';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'card-name';
  nameSpan.textContent = item.name;
  const priceSpan = document.createElement('span');
  priceSpan.className = 'card-price';
  priceSpan.textContent = 'Rs. ' + Number(item.price).toLocaleString();
  top.appendChild(nameSpan);
  top.appendChild(priceSpan);
  content.appendChild(top);

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = item.description || 'No description provided.';
  content.appendChild(desc);

  // Action Buttons Row
  const row = document.createElement('div');
  row.className = 'edit-row';

  // Toggle availability
  const toggleBtn = document.createElement('button');
  toggleBtn.className = `avail-toggle ${item.available ? 'on' : 'off'}`;
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
      toggleBtn.className = `avail-toggle ${newVal ? 'on' : 'off'}`;
    } catch {
      alert('Could not update availability.');
    } finally {
      toggleBtn.disabled = false;
    }
  });
  row.appendChild(toggleBtn);

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'btn';
  editBtn.textContent = 'Edit';
  editBtn.style.fontSize = '0.85rem';
  editBtn.style.padding = '6px 14px';

  let editForm = null;
  editBtn.addEventListener('click', () => {
    if (editForm) {
      editForm.remove();
      editForm = null;
      editBtn.textContent = 'Edit';
      return;
    }
    editBtn.textContent = 'Cancel';
    editForm = buildEditForm(item, card, () => {
      editForm = null;
      editBtn.textContent = 'Edit';
    });
    content.appendChild(editForm);
  });
  row.appendChild(editBtn);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', async () => {
    if (!confirm(`Are you sure you want to remove "${item.name}" from the menu?`)) return;
    deleteBtn.disabled = true;
    try {
      const r = await fetch(`/api/admin/menu/${item.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      menuItems = menuItems.filter((m) => m.id !== item.id);
      card.remove();
      if (menuItems.length === 0) renderMenuAdmin();
    } catch {
      alert('Could not delete item. Please try again.');
      deleteBtn.disabled = false;
    }
  });
  row.appendChild(deleteBtn);

  content.appendChild(row);
  card.appendChild(content);
  return card;
}

function buildEditForm(item, card, onDone) {
  const form = document.createElement('form');
  form.className = 'edit-inline-form';

  form.innerHTML = `
    <label style="font-size:.85rem;font-weight:600;">Name
      <input type="text" name="name" value="${escHtml(item.name)}" required>
    </label>
    <label style="font-size:.85rem;font-weight:600;">Price (Rs.)
      <input type="number" name="price" value="${item.price}" min="0" step="0.01" required>
    </label>
    <label class="full" style="font-size:.85rem;font-weight:600;">Category
      <input type="text" name="category" value="${escHtml(item.category || '')}">
    </label>
    <label class="full" style="font-size:.85rem;font-weight:600;">Photo URL
      <input type="url" name="image_url" value="${escHtml(item.image_url || '')}" placeholder="https://images.unsplash.com/...">
    </label>
    <label class="full" style="font-size:.85rem;font-weight:600;">Description
      <input type="text" name="description" value="${escHtml(item.description || '')}">
    </label>
    <div class="btn-row">
      <button type="submit" class="btn primary" style="font-size:.85rem;padding:6px 16px;">Save Changes</button>
      <span class="form-message" style="margin:0;font-size:0.85rem;"></span>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    const msg = form.querySelector('.form-message');
    btn.disabled = true;
    msg.textContent = 'Saving…';
    msg.className = 'form-message';

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
      Object.assign(item, changes);
      const newCard = buildMenuAdminCard(item);
      card.replaceWith(newCard);
      onDone();
    } catch {
      msg.textContent = 'Could not save.';
      msg.className = 'form-message bad';
      btn.disabled = false;
    }
  });

  return form;
}

// Preset photo buttons in Add Item form
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

$$('.preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const imgUrl = btn.dataset.img;
    const cat = btn.dataset.cat;
    if (addImgInput) addImgInput.value = imgUrl;
    if (addCatInput && !addCatInput.value) addCatInput.value = cat;
    updateAddPreview(imgUrl);
  });
});

// ---------- Add menu item form submit ----------
$('#add-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = $('#add-item-msg');
  const btn = form.querySelector('[type=submit]');
  btn.disabled = true;
  msg.className = 'form-message';
  msg.style.display = 'block';
  msg.textContent = 'Adding dish to menu…';

  const payload = {
    name: form.name.value.trim(),
    price: Number(form.price.value),
    category: form.category.value.trim() || 'Mains',
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
    if (!r.ok) throw new Error(data.error || 'Failed to add item');

    msg.className = 'form-message ok';
    msg.textContent = `"${data.name}" added to menu successfully!`;
    form.reset();
    form.available.checked = true;
    if (previewWrap) previewWrap.style.display = 'none';

    // Add to local state & re-render
    menuItems.push(data);
    renderMenuAdmin();
  } catch (ex) {
    msg.className = 'form-message bad';
    msg.textContent = ex.message;
  } finally {
    btn.disabled = false;
  }
});

// ---------- Helper ----------
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
