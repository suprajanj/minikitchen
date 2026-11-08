require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// ---------- Helpers ----------
function adminOnly(req, res, next) {
  try {
    jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Not logged in' });
  }
}

function chatbotOnly(req, res, next) {
  if (req.headers['x-api-key'] !== process.env.CHATBOT_API_KEY) {
    return res.status(401).json({ error: 'Bad API key' });
  }
  next();
}

// Status is ALWAYS Pending when created. Nobody can create a Confirmed booking.
async function createReservation(body, source) {
  const { name, contact, date, time, guests } = body;
  const g = Number(guests);
  if (!name || !contact || !date || !time || !Number.isInteger(g) || g < 1 || g > 20) {
    throw new Error('invalid');
  }
  const { data, error } = await supabase
    .from('reservations')
    .insert({ name, contact, date, time, guests: g, status: 'Pending', source })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- Public API ----------
app.get('/api/info', (req, res) => {
  res.json({
    name: 'MiniKitchen',
    hours: 'Mon-Sun 11:00 AM - 10:00 PM',
    phone: '+94 77 123 4567',
    email: 'hello@minikitchen.example',
    address: '12 Beach Road, Negombo',
  });
});

app.get('/api/menu', async (req, res) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name');
  if (error) return res.status(500).json({ error: 'Could not load menu' });
  res.json(data);
});

app.post('/api/reservations', async (req, res) => {
  try {
    const r = await createReservation(req.body, 'web');
    res.status(201).json({ ok: true, id: r.id, status: r.status });
  } catch {
    res.status(400).json({ error: 'Please fill in all fields correctly.' });
  }
});

// ---------- Chatbot endpoint (used by n8n) ----------
app.post('/api/chat-reservations', chatbotOnly, async (req, res) => {
  try {
    const r = await createReservation(req.body, 'chat');
    res.status(201).json({
      ok: true,
      id: r.id,
      status: 'Pending',
      note: 'Saved as Pending. The restaurant must confirm it.',
    });
  } catch {
    res.status(400).json({
      error: 'Missing or invalid details: name, contact, date (YYYY-MM-DD), time, guests are all required.',
    });
  }
});

// ---------- Admin API ----------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Wrong username or password' });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/admin/check', adminOnly, (req, res) => res.json({ ok: true }));

app.get('/api/admin/reservations', adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Could not load reservations' });
  res.json(data);
});

app.patch('/api/admin/reservations/:id', adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: 'Could not update' });
  res.json(data);
});

app.post('/api/admin/menu', adminOnly, async (req, res) => {
  const { name, description, price, category, available } = req.body;
  if (!name || price === undefined || isNaN(Number(price))) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ name, description, price: Number(price), category, available: available !== false })
    .select()
    .single();
  if (error) return res.status(400).json({ error: 'Could not add item' });
  res.status(201).json(data);
});

app.patch('/api/admin/menu/:id', adminOnly, async (req, res) => {
  const allowed = ['name', 'description', 'price', 'category', 'available'];
  const changes = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) changes[key] = req.body[key];
  }
  const { data, error } = await supabase
    .from('menu_items')
    .update(changes)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: 'Could not update item' });
  res.json(data);
});

// ---------- Chat (forwards to n8n) ----------
app.post('/api/chat', async (req, res) => {
  if (!process.env.N8N_WEBHOOK_URL) {
    return res.json({ reply: 'The assistant is not connected yet. Please use the reservation form.' });
  }
  try {
    const r = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: req.body.sessionId, message: req.body.message }),
    });
    const data = await r.json();
    res.json({ reply: data.reply || data.output || 'Sorry, I could not answer that.' });
  } catch {
    res.status(502).json({ reply: 'Sorry, the assistant is unavailable right now.' });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));