const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// Helper to create elements with classes and text
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Curated high quality food photography for dishes & categories
const FOOD_IMAGES = {
  // Seafood
  crab: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=700&q=85',
  prawn: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=700&q=85',
  cuttlefish: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=85',
  squid: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=85',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=700&q=85',
  seafood: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=700&q=85',

  // Sri Lankan staples
  kottu: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=85',
  roti: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=700&q=85',
  hopper: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85',
  curry: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=700&q=85',
  rice: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=85',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=85',
  chicken: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=700&q=85',
  beef: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=85',
  mutton: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=85',
  dhal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=85',

  // Starters & Sides
  starter: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85',
  salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=85',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=700&q=85',
  noodle: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=85',

  // Desserts & Drinks
  dessert: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=85',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=85',
  pudding: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=85',
  ice: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=700&q=85',
  watalappam: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=85',
  juice: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=85',
  drink: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=85',
  beverage: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=85',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=85',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=700&q=85',
  lime: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=85',

  // General default
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=85',
};

const FALLBACK_IMAGE_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <rect width="400" height="240" fill="#fcf4eb"/>
  <circle cx="200" cy="105" r="50" fill="#fae8d4"/>
  <text x="200" y="115" font-size="38" text-anchor="middle">🥘</text>
  <text x="200" y="175" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#d9480f" text-anchor="middle">MiniKitchen Special</text>
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

// ---------- Restaurant info ----------
async function loadInfo() {
  try {
    const info = await (await fetch('/api/info')).json();
    if ($('#info-hours')) $('#info-hours').textContent = info.hours;
    if ($('#info-phone')) {
      $('#info-phone').innerHTML = `<a href="tel:${info.phone.replace(/\s+/g, '')}">${info.phone}</a>`;
    }
    if ($('#info-email')) {
      $('#info-email').innerHTML = `<a href="mailto:${info.email}">${info.email}</a>`;
    }
    if ($('#info-address')) $('#info-address').textContent = info.address;
  } catch (e) {
    console.error('Could not load restaurant info', e);
  }
}

// ---------- Menu & Categories ----------
let allMenuItems = [];
let activeCategory = 'all';

async function loadMenu() {
  const container = $('#menu-list');
  try {
    const res = await fetch('/api/menu');
    if (!res.ok) throw new Error('Bad response from server');
    allMenuItems = await res.json();

    if (!Array.isArray(allMenuItems) || allMenuItems.length === 0) {
      container.innerHTML = '<p class="muted" style="text-align:center;padding:40px;">No menu items available right now. Please check back shortly!</p>';
      return;
    }

    renderCategoryTabs();
    renderFilteredMenu();
  } catch (e) {
    console.error('Could not load menu', e);
    container.innerHTML = '<p class="form-message bad" style="display:block;text-align:center;">Sorry, the menu could not be loaded. Please refresh the page.</p>';
  }
}

function renderCategoryTabs() {
  const tabsWrap = $('#category-tabs');
  if (!tabsWrap) return;

  const categories = ['all'];
  for (const item of allMenuItems) {
    const cat = item.category || 'Mains';
    if (!categories.includes(cat)) categories.push(cat);
  }

  tabsWrap.innerHTML = '';
  for (const cat of categories) {
    const btn = el('button', 'cat-tab' + (cat === activeCategory ? ' active' : ''), cat === 'all' ? 'All Dishes' : cat);
    btn.dataset.category = cat;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      $$('.cat-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderFilteredMenu();
    });
    tabsWrap.appendChild(btn);
  }
}

function renderFilteredMenu() {
  const container = $('#menu-list');
  container.innerHTML = '';

  const filtered = activeCategory === 'all'
    ? allMenuItems
    : allMenuItems.filter((item) => (item.category || 'Mains') === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="muted" style="text-align:center;padding:30px;">No dishes found in this category.</p>';
    return;
  }

  // If "all", group by category
  if (activeCategory === 'all') {
    const groups = {};
    for (const item of filtered) {
      const cat = item.category || 'Mains';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    for (const [categoryName, items] of Object.entries(groups)) {
      container.appendChild(el('h3', 'menu-category-title', categoryName));
      const grid = el('div', 'menu-grid');
      for (const item of items) {
        grid.appendChild(createMenuCard(item));
      }
      container.appendChild(grid);
    }
  } else {
    const grid = el('div', 'menu-grid');
    for (const item of filtered) {
      grid.appendChild(createMenuCard(item));
    }
    container.appendChild(grid);
  }
}

function createMenuCard(item) {
  const card = el('div', 'menu-card' + (item.available ? '' : ' soldout'));

  // Image Media Header
  const media = el('div', 'menu-card-media');
  const img = document.createElement('img');
  img.className = 'menu-card-img';
  img.src = getMenuItemImage(item);
  img.alt = item.name || 'Dish';
  img.loading = 'lazy';
  img.onerror = () => {
    img.onerror = null;
    img.src = FALLBACK_IMAGE_SVG;
  };
  media.appendChild(img);

  // Badges (Category + Availability)
  const badgesWrap = el('div', 'menu-card-badges');
  if (item.category) {
    badgesWrap.appendChild(el('span', 'menu-cat-pill', item.category));
  } else {
    badgesWrap.appendChild(el('span', 'menu-cat-pill', 'Special'));
  }

  badgesWrap.appendChild(
    el('span', 'badge ' + (item.available ? 'ok' : 'out'), item.available ? 'Available' : 'Sold out')
  );
  media.appendChild(badgesWrap);
  card.appendChild(media);

  // Body: Name, Price, Description
  const body = el('div', 'menu-card-body');
  const top = el('div', 'menu-top');
  top.appendChild(el('span', 'menu-name', item.name));
  top.appendChild(el('span', 'menu-price', 'Rs. ' + Number(item.price).toLocaleString()));
  body.appendChild(top);

  if (item.description) {
    body.appendChild(el('p', 'menu-desc', item.description));
  } else {
    body.appendChild(el('p', 'menu-desc', 'Freshly prepared with authentic Sri Lankan coastal seasonings.'));
  }

  card.appendChild(body);
  return card;
}

// ---------- Reservation Form ----------
const dateInput = $('#date-input');
if (dateInput) {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = today;
  if (!dateInput.value) dateInput.value = today;
}

const reservationForm = $('#reservation-form');
if (reservationForm) {
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const msg = $('#form-message');
    const button = form.querySelector('button');
    const data = Object.fromEntries(new FormData(form).entries());

    button.disabled = true;
    msg.className = 'form-message';
    msg.style.display = 'block';
    msg.textContent = 'Sending your reservation request...';

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Something went wrong');

      msg.className = 'form-message ok';
      msg.innerHTML = `
        <strong>🎉 Request Received!</strong><br>
        Thank you, ${data.name}! Your table for <strong>${data.guests} guests</strong> on <strong>${data.date}</strong> at <strong>${data.time}</strong> is saved with <strong>Pending</strong> status.<br>
        Our team will contact you shortly at <strong>${data.contact}</strong> to confirm your reservation.
      `;
      form.reset();
      if (dateInput) {
        const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        dateInput.value = today;
      }
    } catch (err) {
      msg.className = 'form-message bad';
      msg.textContent = err.message || 'Could not submit reservation. Please try again.';
    } finally {
      button.disabled = false;
    }
  });
}

// ---------- Chat Widget ----------
let sessionId;
try {
  sessionId = localStorage.getItem('mk_session');
  if (!sessionId) {
    sessionId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();
    localStorage.setItem('mk_session', sessionId);
  }
} catch {
  sessionId = String(Date.now()) + Math.random();
}

const chatToggle = $('#chat-toggle');
const chatPanel = $('#chat-panel');
const chatClose = $('#chat-close');
const chatMessages = $('#chat-messages');
const chatForm = $('#chat-form');
const chatInput = $('#chat-input');
const chatSuggestions = $('#chat-suggestions');

function addMessage(text, who) {
  const bubble = el('div', 'msg ' + who, text);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function addTypingIndicator() {
  const bubble = el('div', 'msg bot');
  const dots = el('div', 'typing-dots');
  dots.appendChild(el('span'));
  dots.appendChild(el('span'));
  dots.appendChild(el('span'));
  bubble.appendChild(dots);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function toggleChat(open) {
  const isOpen = open !== undefined ? open : !chatPanel.classList.contains('open');
  chatPanel.classList.toggle('open', isOpen);
  const icon = chatToggle.querySelector('.chat-toggle-icon');
  const close = chatToggle.querySelector('.chat-toggle-close');
  if (icon && close) {
    icon.style.display = isOpen ? 'none' : 'block';
    close.style.display = isOpen ? 'block' : 'none';
  }
  if (isOpen) {
    setTimeout(() => chatInput && chatInput.focus(), 150);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

if (chatToggle) {
  chatToggle.addEventListener('click', () => toggleChat());
}
if (chatClose) {
  chatClose.addEventListener('click', () => toggleChat(false));
}

// Initial welcome message
addMessage('Hello! 🥘 Welcome to MiniKitchen Negombo. I can answer questions about our menu, specials, hours, or help you book a table right here.', 'bot');

async function handleSendMessage(text) {
  if (!text) return;

  addMessage(text, 'user');
  if (chatInput) chatInput.value = '';

  const sendButton = chatForm ? chatForm.querySelector('button') : null;
  if (sendButton) sendButton.disabled = true;

  const typingBubble = addTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: text }),
    });
    const data = await res.json();
    typingBubble.innerHTML = '';
    typingBubble.textContent = data.reply || 'Sorry, something went wrong.';
  } catch {
    typingBubble.innerHTML = '';
    typingBubble.textContent = 'Sorry, I could not reach the assistant. Please try again.';
  } finally {
    if (sendButton) sendButton.disabled = false;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) handleSendMessage(text);
  });
}

// Quick action chips
if (chatSuggestions) {
  chatSuggestions.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const msg = chip.dataset.msg;
    if (msg) handleSendMessage(msg);
  });
}

// ---------- Initialize ----------
loadInfo();
loadMenu();
