const $ = (selector) => document.querySelector(selector);

// Small helper to build elements safely (uses textContent, never raw HTML)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---------- Restaurant info ----------
async function loadInfo() {
  try {
    const info = await (await fetch('/api/info')).json();
    $('#info-hours').textContent = info.hours;
    $('#info-phone').textContent = info.phone;
    $('#info-email').textContent = info.email;
    $('#info-address').textContent = info.address;
  } catch (e) {
    console.error('Could not load info', e);
  }
}

// ---------- Menu ----------
async function loadMenu() {
  const box = $('#menu-list');
  try {
    const res = await fetch('/api/menu');
    if (!res.ok) throw new Error('bad response');
    const items = await res.json();

    box.textContent = '';
    if (items.length === 0) {
      box.textContent = 'The menu is empty right now.';
      return;
    }

    // Group items by category
    const groups = {};
    for (const item of items) {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    for (const [category, list] of Object.entries(groups)) {
      box.appendChild(el('h3', 'menu-category', category));
      const grid = el('div', 'menu-grid');

      for (const item of list) {
        const card = el('div', 'menu-card' + (item.available ? '' : ' soldout'));

        const top = el('div', 'menu-top');
        top.appendChild(el('span', '', item.name));
        top.appendChild(el('span', 'menu-price', 'Rs. ' + Number(item.price).toLocaleString()));
        card.appendChild(top);

        if (item.description) card.appendChild(el('p', 'menu-desc', item.description));

        card.appendChild(
          el('span', 'badge ' + (item.available ? 'ok' : 'out'), item.available ? 'Available' : 'Sold out')
        );
        grid.appendChild(card);
      }
      box.appendChild(grid);
    }
  } catch (e) {
    box.textContent = 'Sorry, the menu could not be loaded. Please refresh the page.';
  }
}

// ---------- Reservation form ----------
// Stop people picking a date in the past
const dateInput = $('#date-input');
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.min = today;

$('#reservation-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const msg = $('#form-message');
  const button = form.querySelector('button');
  const data = Object.fromEntries(new FormData(form).entries());

  button.disabled = true;
  msg.className = 'form-message';
  msg.textContent = 'Sending...';

  try {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Something went wrong');

    msg.className = 'form-message ok';
    msg.textContent = 'Request received! Your reservation is Pending. We will contact you to confirm.';
    form.reset();
    form.guests.value = 2;
  } catch (err) {
    msg.className = 'form-message bad';
    msg.textContent = err.message;
  } finally {
    button.disabled = false;
  }
});

// ---------- Chat widget ----------
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

const chatPanel = $('#chat-panel');
const chatMessages = $('#chat-messages');
const chatForm = $('#chat-form');
const chatInput = $('#chat-input');

function addMessage(text, who) {
  const bubble = el('div', 'msg ' + who, text);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

$('#chat-toggle').addEventListener('click', () => {
  chatPanel.classList.toggle('open');
  if (chatPanel.classList.contains('open')) chatInput.focus();
});

addMessage('Hi! I can answer questions about our menu and hours, or help you book a table.', 'bot');

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  chatInput.value = '';
  const sendButton = chatForm.querySelector('button');
  sendButton.disabled = true;
  const typing = addMessage('Typing...', 'bot');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message: text }),
    });
    const data = await res.json();
    typing.textContent = data.reply || 'Sorry, something went wrong.';
  } catch {
    typing.textContent = 'Sorry, I could not reach the assistant. Please try again.';
  } finally {
    sendButton.disabled = false;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

// ---------- Start ----------
loadInfo();
loadMenu();