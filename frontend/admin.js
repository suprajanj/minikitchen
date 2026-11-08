const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

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
    if (!r.ok) throw new Error((await r.json()).error || 'Login failed');
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
  await fetch('/api/admin/logout', { method: 'POST' });
  showLogin();
});

// ---------- Reservations ----------
let allReservations = [];

async function loadReservations() {
  const wrap = $('#reservations-table-wrap');
  wrap.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const r = await fetch('/api/admin/reservations');
    if (!r.ok) throw new Error();
    allReservations = await r.json();
    renderReservations();
  } catch {
    wrap.innerHTML = '<p class="form-message bad">Could not load reservations.</p>';
  }
}

function renderReservations() {
  const filter = $('#status-filter').value;
  const list = filter ? allReservations.filter(r => r.status === filter) : allReservations;
  const wrap = $('#reservations-table-wrap');

  if (list.length === 0) {
    wrap.innerHTML = '<p class="muted">No reservations found.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'res-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Contact</th>
        <th>Date</th>
        <th>Time</th>
        <th>Guests</th>
        <th>Source</th>
        <th>Status</th>
        <th>Update</th>
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
      <td>${res.id}</td>
      <td>${escHtml(res.name)}</td>
      <td>${escHtml(res.contact)}</td>
      <td>${escHtml(dateStr)}</td>
      <td>${escHtml(timeStr)}</td>
      <td>${res.guests}</td>
      <td><span class="source-badge">${escHtml(res.source || 'web')}</span></td>
      <td><span class="status-badge ${escHtml(res.status)}">${escHtml(res.status)}</span></td>
      <td></td>
    `;

    // Status change select
    const sel = document.createElement('select');
    sel.className = 'action-select';
    ['Pending', 'Confirmed', 'Cancelled'].forEach(s => {
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
        // Update local cache & badge
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
  wrap.innerHTML = '<p class="muted">Loading menu…</p>';
  try {
    const r = await fetch('/api/menu');
    if (!r.ok) throw new Error();
    menuItems = await r.json();
    renderMenuAdmin();
  } catch {
    wrap.innerHTML = '<p class="form-message bad">Could not load menu.</p>';
  }
}

function renderMenuAdmin() {
  const wrap = $('#menu-admin-list');
  if (menuItems.length === 0) {
    wrap.innerHTML = '<p class="muted">No menu items yet.</p>';
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
  card.appendChild(top);

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = item.description;
    card.appendChild(desc);
  }

  // Badge showing category
  if (item.category) {
    const cat = document.createElement('span');
    cat.className = 'badge ok';
    cat.textContent = item.category;
    cat.style.marginBottom = '10px';
    card.appendChild(cat);
  }

  // Action row
  const row = document.createElement('div');
  row.className = 'edit-row';

  // Toggle availability
  const toggleBtn = document.createElement('button');
  toggleBtn.className = `avail-toggle ${item.available ? 'on' : 'off'}`;
  toggleBtn.textContent = item.available ? 'Available' : 'Unavailable';
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
      toggleBtn.textContent = newVal ? 'Available' : 'Unavailable';
      toggleBtn.className = `avail-toggle ${newVal ? 'on' : 'off'}`;
    } catch {
      alert('Could not update availability.');
    } finally {
      toggleBtn.disabled = false;
    }
  });
  row.appendChild(toggleBtn);

  // Edit button — reveals inline form
  const editBtn = document.createElement('button');
  editBtn.className = 'btn';
  editBtn.textContent = 'Edit';
  editBtn.style.fontSize = '0.85rem';
  editBtn.style.padding = '5px 14px';

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
    card.appendChild(editForm);
  });
  row.appendChild(editBtn);

  card.appendChild(row);
  return card;
}

function buildEditForm(item, card, onDone) {
  const form = document.createElement('form');
  form.className = 'edit-inline-form';

  form.innerHTML = `
    <label style="font-size:.85rem;font-weight:600;">Name
      <input type="text" name="name" value="${escHtml(item.name)}" required>
    </label>
    <label style="font-size:.85rem;font-weight:600;">Price
      <input type="number" name="price" value="${item.price}" min="0" step="0.01" required>
    </label>
    <label class="full" style="font-size:.85rem;font-weight:600;">Category
      <input type="text" name="category" value="${escHtml(item.category || '')}">
    </label>
    <label class="full" style="font-size:.85rem;font-weight:600;">Description
      <input type="text" name="description" value="${escHtml(item.description || '')}">
    </label>
    <div class="btn-row">
      <button type="submit" class="btn primary" style="font-size:.85rem;padding:5px 14px;">Save</button>
      <p class="form-message" style="margin:0;align-self:center;"></p>
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
    };

    try {
      const r = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!r.ok) throw new Error();
      Object.assign(item, changes);
      // Rebuild the card in-place
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

// ---------- Add menu item ----------
$('#add-item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = $('#add-item-msg');
  const btn = form.querySelector('[type=submit]');
  btn.disabled = true;
  msg.className = 'form-message';
  msg.textContent = 'Adding…';

  const payload = {
    name: form.name.value.trim(),
    price: Number(form.price.value),
    category: form.category.value.trim(),
    description: form.description.value.trim(),
    available: form.available.checked,
  };

  try {
    const r = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Error');
    msg.className = 'form-message ok';
    msg.textContent = `"${data.name}" added to menu.`;
    form.reset();
    form.available.checked = true;
    // Add to list without full reload
    menuItems.push(data);
    renderMenuAdmin();
  } catch (ex) {
    msg.className = 'form-message bad';
    msg.textContent = ex.message;
  } finally {
    btn.disabled = false;
  }
});

// ---------- Helpers ----------
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

