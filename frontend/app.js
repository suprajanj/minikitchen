/**
 * MINIKITCHEN — LUXURY HOSPITALITY EXPERIENCE ENGINE
 * Orchestrates dynamic fine-dining gastronomy curation, reservation requests,
 * and the digital guest concierge suite.
 */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// Helper to create elements with classes and text
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Curated Michelin / Luxury Hotel food photography library
const FOOD_IMAGES = {
  // Negombo Lagoon Catch & Ocean Gastronomy
  crab: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=900&q=88',
  prawn: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=88',
  cuttlefish: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=900&q=88',
  squid: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=900&q=88',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=88',
  seafood: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=900&q=88',

  // Artisanal Kottu & Hand-Crafted Flatbreads
  kottu: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=88',
  roti: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=88',
  hopper: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=88',

  // Clay-Pot Curries & Saffron Rice
  curry: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=900&q=88',
  rice: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=88',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=88',
  chicken: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=88',
  beef: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=88',
  mutton: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=88',
  dhal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=88',

  // Starters & Greens
  starter: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=88',
  salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=88',
  soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=88',

  // Confections, Ceylon Tea & Elixirs
  dessert: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=88',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=88',
  pudding: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=88',
  watalappam: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=88',
  juice: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=88',
  drink: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=88',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=88',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=88',

  // Signature Default Culinary Spread
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=88',
};

// Luxury SVG Placeholder in case of offline/network drop
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

// ---------- Glassmorphic Header Scroll Listener ----------
const siteHeader = $('#site-header');
window.addEventListener('scroll', () => {
  if (!siteHeader) return;
  if (window.scrollY > 40) {
    siteHeader.classList.add('scrolled');
  } else {
    siteHeader.classList.remove('scrolled');
  }
}, { passive: true });

// Mobile Navigation Toggle
const mobileMenuBtn = $('#mobile-menu-btn');
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    const navLinks = $('.nav-links');
    if (navLinks) {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'rgba(15, 36, 32, 0.98)';
        navLinks.style.padding = '24px 0';
        navLinks.style.borderBottom = '1px solid rgba(197, 168, 128, 0.2)';
      }
    }
  });
}

// ---------- Estate Information ----------
async function loadInfo() {
  try {
    const res = await fetch('/api/info');
    if (!res.ok) return;
    const info = await res.json();
    if ($('#info-hours')) $('#info-hours').textContent = info.hours;
    if ($('#info-phone')) {
      $('#info-phone').innerHTML = `<a href="tel:${info.phone.replace(/\s+/g, '')}">${info.phone}</a>`;
    }
    if ($('#info-email')) {
      $('#info-email').innerHTML = `<a href="mailto:${info.email}">${info.email}</a>`;
    }
    if ($('#info-address')) $('#info-address').textContent = info.address;
  } catch (e) {
    console.error('Could not load estate details', e);
  }
}

// ---------- Gastronomy Collection & Dynamic Filtering ----------
let allMenuItems = [];
let activeCategory = 'all';

async function loadMenu() {
  const container = $('#menu-list');
  try {
    const res = await fetch('/api/menu?t=' + Date.now());
    if (!res.ok) throw new Error('Could not retrieve gastronomy collection');
    allMenuItems = await res.json();

    if (!Array.isArray(allMenuItems) || allMenuItems.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
          <p class="font-serif" style="font-size:1.6rem;color:var(--color-primary);margin-bottom:8px;">The Culinary Atelier is Preparing Today's Menu</p>
          <p class="muted">Please consult the guest concierge or inquire directly for seasonal creations.</p>
        </div>
      `;
      return;
    }

    renderCategoryTabs();
    renderFilteredMenu();
  } catch (e) {
    console.error('Failed to load menu collection', e);
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <p style="color:var(--color-danger);font-weight:600;">Unable to connect to the Gastronomy Collection. Please refresh the page.</p>
      </div>
    `;
  }
}

function renderCategoryTabs() {
  const tabsWrap = $('#category-tabs');
  if (!tabsWrap) return;

  const categories = ['all'];
  for (const item of allMenuItems) {
    const cat = item.category || 'Specialties';
    if (!categories.includes(cat)) categories.push(cat);
  }

  tabsWrap.innerHTML = '';
  for (const cat of categories) {
    const label = cat === 'all' ? 'All Offerings' : cat;
    const btn = el('button', 'curation-pill' + (cat === activeCategory ? ' active' : ''), label);
    btn.dataset.category = cat;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      $$('.curation-pill').forEach((b) => b.classList.remove('active'));
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
    : allMenuItems.filter((item) => (item.category || 'Specialties') === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;">
        <p class="font-serif" style="font-size:1.3rem;color:var(--color-text-muted);">No dishes currently active in this category.</p>
      </div>
    `;
    return;
  }

  // Group by category when viewing all offerings
  if (activeCategory === 'all') {
    const groups = {};
    for (const item of filtered) {
      const cat = item.category || 'Specialties';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    for (const [categoryName, items] of Object.entries(groups)) {
      const section = el('div', 'menu-category-section');
      section.appendChild(el('h3', 'menu-category-heading', categoryName));
      const grid = el('div', 'gastronomy-grid');
      for (const item of items) {
        grid.appendChild(createDishCard(item));
      }
      section.appendChild(grid);
      container.appendChild(section);
    }
  } else {
    const grid = el('div', 'gastronomy-grid');
    for (const item of filtered) {
      grid.appendChild(createDishCard(item));
    }
    container.appendChild(grid);
  }
}

function createDishCard(item) {
  const card = el('article', 'dish-card' + (item.available ? '' : ' soldout'));

  // Image Media
  const media = el('div', 'dish-media');
  const img = document.createElement('img');
  img.className = 'dish-img';
  img.src = getMenuItemImage(item);
  img.alt = item.name ? `${item.name} — MiniKitchen Fine Dining` : 'Gastronomy Dish';
  img.loading = 'lazy';
  img.onerror = () => {
    img.onerror = null;
    img.src = LUXURY_FALLBACK_SVG;
  };
  media.appendChild(img);

  // Overlaid Luxury Badges
  const badgesWrap = el('div', 'dish-badges');
  badgesWrap.appendChild(el('span', 'dish-tag', item.category || 'Specialty'));
  badgesWrap.appendChild(
    el('span', 'dish-status ' + (item.available ? 'available' : 'unavailable'), item.available ? 'Available' : 'Sold Out')
  );
  media.appendChild(badgesWrap);
  card.appendChild(media);

  // Content Details
  const details = el('div', 'dish-details');
  const headerRow = el('div', 'dish-header-row');
  headerRow.appendChild(el('h4', 'dish-name', item.name));
  headerRow.appendChild(el('span', 'dish-price', 'Rs. ' + Number(item.price).toLocaleString()));
  details.appendChild(headerRow);

  const descText = item.description && item.description.trim()
    ? item.description.trim()
    : 'Prepared fresh to order using artisanal spices and pristine coastal ingredients.';
  details.appendChild(el('p', 'dish-desc', descText));

  card.appendChild(details);
  return card;
}

// ---------- Exclusive Reservation Suite Form ----------
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
    const button = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const name = (data.name || '').trim();
    const contact = (data.contact || '').trim();
    const date = (data.date || '').trim();
    const time = (data.time || '').trim();
    const guests = parseInt(data.guests, 10);

    // Validation with instant feedback
    if (!name || !contact || !date || !time || isNaN(guests) || guests < 1 || guests > 20) {
      if (msg) {
        msg.className = 'reservation-feedback error';
        msg.style.display = 'block';
        msg.textContent = 'Please fill in all required fields (1 to 20 guests permitted).';
        msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Submitting Request…';
    }
    if (msg) {
      msg.className = 'reservation-feedback';
      msg.style.display = 'none';
      msg.innerHTML = '';
    }

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          date,
          time,
          guests,
          seating: data.seating || 'veranda'
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Unable to submit reservation request');
      }

      if (msg) {
        msg.className = 'reservation-feedback success';
        msg.style.display = 'block';
        msg.innerHTML = `
          <strong class="font-serif" style="font-size:1.3rem;display:block;margin-bottom:6px;">✦ Reservation Request Received</strong>
          Thank you, <strong>${name}</strong>. Your request for a table of <strong>${guests} ${guests === 1 ? 'guest' : 'guests'}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been registered with <strong>PENDING</strong> status.<br><br>
          Our maître d' will review seating availability and contact you directly at <strong>${contact}</strong> to confirm your reservation.
        `;
        msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      form.reset();
      if (dateInput) {
        const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        dateInput.value = today;
      }
      const timeInput = $('#time-input');
      if (timeInput) timeInput.value = '19:30';
      const guestInput = $('#guest-count');
      if (guestInput) guestInput.value = '2';
    } catch (err) {
      if (msg) {
        msg.className = 'reservation-feedback error';
        msg.style.display = 'block';
        msg.textContent = err.message || 'We could not submit your request. Please call our guest line directly.';
        msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Submit Reservation Request';
      }
    }
  });
}

// ---------- AI Guest Concierge Suite ----------
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

const conciergeToggle = $('#chat-toggle');
const conciergeWindow = $('#chat-panel');
const conciergeClose = $('#chat-close');
const conciergeStream = $('#chat-messages');
const conciergeForm = $('#chat-form');
const conciergeInput = $('#chat-input');
const conciergeSuggestions = $('#chat-suggestions');
const conciergeLinkTrigger = $('#concierge-link-trigger');

function addChatMessage(text, sender) {
  const bubble = el('div', 'chat-bubble ' + (sender === 'bot' ? 'concierge' : 'guest'), text);
  conciergeStream.appendChild(bubble);
  conciergeStream.scrollTop = conciergeStream.scrollHeight;
  return bubble;
}

function addConciergeTyping() {
  const bubble = el('div', 'chat-bubble concierge');
  const indicator = el('div', 'concierge-typing-indicator');
  indicator.appendChild(el('span'));
  indicator.appendChild(el('span'));
  indicator.appendChild(el('span'));
  bubble.appendChild(indicator);
  conciergeStream.appendChild(bubble);
  conciergeStream.scrollTop = conciergeStream.scrollHeight;
  return bubble;
}

function setConciergeOpen(isOpen) {
  if (!conciergeWindow) return;
  conciergeWindow.classList.toggle('active', isOpen);
  conciergeWindow.setAttribute('aria-hidden', String(!isOpen));
  if (isOpen) {
    setTimeout(() => conciergeInput && conciergeInput.focus(), 160);
    conciergeStream.scrollTop = conciergeStream.scrollHeight;
  }
}

if (conciergeToggle) {
  conciergeToggle.addEventListener('click', () => {
    const isCurrentlyOpen = conciergeWindow.classList.contains('active');
    setConciergeOpen(!isCurrentlyOpen);
  });
}
if (conciergeClose) {
  conciergeClose.addEventListener('click', () => setConciergeOpen(false));
}
if (conciergeLinkTrigger) {
  conciergeLinkTrigger.addEventListener('click', () => setConciergeOpen(true));
}

// Initial Concierge Hospitality Greeting
addChatMessage(
  'Welcome to MiniKitchen. I am your personal digital concierge. I would be delighted to assist you with our gastronomy collection, table reservations, or private dining inquiries.',
  'bot'
);

async function handleConciergeInquiry(text) {
  if (!text || !text.trim()) return;
  const inquiry = text.trim();

  addChatMessage(inquiry, 'guest');
  if (conciergeInput) conciergeInput.value = '';

  const sendBtn = conciergeForm ? conciergeForm.querySelector('button') : null;
  if (sendBtn) sendBtn.disabled = true;

  const typingBubble = addConciergeTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: inquiry }),
    });
    const data = await res.json();
    typingBubble.innerHTML = '';
    typingBubble.textContent = data.reply || 'Thank you for your inquiry. Our hospitality team will be delighted to assist you.';
  } catch {
    typingBubble.innerHTML = '';
    typingBubble.textContent = 'Our digital concierge is currently attending to other inquiries. Please call our guest line at +94 77 123 4567 for immediate assistance.';
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    conciergeStream.scrollTop = conciergeStream.scrollHeight;
  }
}

if (conciergeForm) {
  conciergeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (conciergeInput && conciergeInput.value) {
      handleConciergeInquiry(conciergeInput.value);
    }
  });
}

// Quick Prompt Chips
if (conciergeSuggestions) {
  conciergeSuggestions.addEventListener('click', (e) => {
    const chip = e.target.closest('.prompt-chip');
    if (!chip) return;
    const promptMsg = chip.dataset.msg;
    if (promptMsg) handleConciergeInquiry(promptMsg);
  });
}

// ---------- Initialize Sanctuary Experience ----------
loadInfo();
loadMenu();
