require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Fallback persistent image storage (in case image_url column has not been added to Supabase yet)
const MENU_IMAGES_FILE = path.join(__dirname, 'menu_images.json');

function getLocalImages() {
  try {
    if (fs.existsSync(MENU_IMAGES_FILE)) {
      return JSON.parse(fs.readFileSync(MENU_IMAGES_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveLocalImage(id, url) {
  try {
    const map = getLocalImages();
    if (url && typeof url === 'string' && url.trim()) {
      map[String(id)] = url.trim();
    } else {
      delete map[String(id)];
    }
    fs.writeFileSync(MENU_IMAGES_FILE, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local image mapping:', err);
  }
}

function deleteLocalImage(id) {
  try {
    const map = getLocalImages();
    delete map[String(id)];
    fs.writeFileSync(MENU_IMAGES_FILE, JSON.stringify(map, null, 2), 'utf8');
  } catch {}
}

// ---------- Helpers ----------
function adminOnly(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const token = req.cookies.token || bearerToken;

    if (!token) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
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
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanContact = typeof contact === 'string' ? contact.trim() : '';
  const cleanDate = typeof date === 'string' ? date.trim() : '';
  const cleanTime = typeof time === 'string' ? time.trim() : '';

  if (!cleanName || !cleanContact || !cleanDate || !cleanTime || !Number.isInteger(g) || g < 1 || g > 20) {
    throw new Error('Please fill in all fields correctly (1 to 20 guests permitted).');
  }

  const payload = {
    name: cleanName,
    contact: cleanContact,
    date: cleanDate,
    time: cleanTime,
    guests: g,
    status: 'Pending',
  };
  if (source) {
    payload.source = source;
  }

  let result = await supabase
    .from('reservations')
    .insert(payload)
    .select()
    .single();

  // If source column is missing in Supabase, retry without source column
  if (result.error && payload.source) {
    console.warn('[reservation] Insert with source failed, retrying without source column:', result.error.message);
    delete payload.source;
    result = await supabase
      .from('reservations')
      .insert(payload)
      .select()
      .single();
  }

  if (result.error) {
    console.error('[reservation] Supabase insert error:', result.error);
    throw new Error(result.error.message || 'Could not save reservation');
  }

  return result.data;
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name');
  if (error) return res.status(500).json({ error: 'Could not load menu' });

  const localImages = getLocalImages();
  const enriched = (data || []).map((item) => ({
    ...item,
    image_url: item.image_url || localImages[String(item.id)] || null,
  }));

  res.json(enriched);
});

app.post('/api/reservations', async (req, res) => {
  try {
    const r = await createReservation(req.body, 'web');
    res.status(201).json({ ok: true, id: r.id, status: r.status });
  } catch (err) {
    console.error('[reservations] Error creating reservation:', err);
    res.status(400).json({ error: err.message || 'Please fill in all fields correctly.' });
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
    const token = jwt.sign({ role: 'admin', user: username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    return res.json({ ok: true, token });
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
  const { name, description, price, category, available, image_url } = req.body;
  if (!name || price === undefined || isNaN(Number(price))) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const payload = {
    name,
    description: description || '',
    price: Number(price),
    category: category || 'Mains',
    available: available !== false,
  };

  const cleanImageUrl = image_url && typeof image_url === 'string' && image_url.trim() ? image_url.trim() : null;
  if (cleanImageUrl) {
    payload.image_url = cleanImageUrl;
  }

  let result = await supabase.from('menu_items').insert(payload).select().single();

  // Graceful fallback if image_url column has not been added to Supabase yet
  if (result.error && payload.image_url) {
    delete payload.image_url;
    result = await supabase.from('menu_items').insert(payload).select().single();
  }

  if (result.error) return res.status(400).json({ error: result.error.message || 'Could not add item' });

  // Save to persistent local image mapping so it is always served
  if (cleanImageUrl && result.data && result.data.id) {
    saveLocalImage(result.data.id, cleanImageUrl);
  }

  const responseData = {
    ...result.data,
    image_url: cleanImageUrl || result.data.image_url || null,
  };

  res.status(201).json(responseData);
});

app.patch('/api/admin/menu/:id', adminOnly, async (req, res) => {
  const allowed = ['name', 'description', 'price', 'category', 'available', 'image_url'];
  const changes = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) changes[key] = req.body[key];
  }

  const cleanImageUrl = changes.image_url !== undefined && typeof changes.image_url === 'string'
    ? changes.image_url.trim()
    : null;
  const hadImageUrlChange = changes.image_url !== undefined;

  let result = await supabase
    .from('menu_items')
    .update(changes)
    .eq('id', req.params.id)
    .select()
    .single();

  // Graceful fallback if image_url column is missing in Supabase
  if (result.error && changes.image_url !== undefined) {
    delete changes.image_url;
    result = await supabase
      .from('menu_items')
      .update(changes)
      .eq('id', req.params.id)
      .select()
      .single();
  }

  if (result.error) return res.status(400).json({ error: result.error.message || 'Could not update item' });

  // Update local image mapping
  if (hadImageUrlChange) {
    saveLocalImage(req.params.id, cleanImageUrl);
  }

  const localImages = getLocalImages();
  const responseData = {
    ...result.data,
    image_url: result.data.image_url || cleanImageUrl || localImages[String(req.params.id)] || null,
  };

  res.json(responseData);
});

app.delete('/api/admin/menu/:id', adminOnly, async (req, res) => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message || 'Could not delete item' });
  deleteLocalImage(req.params.id);
  res.json({ ok: true });
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

    const raw = await r.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    // Handle double-stringified JSON (e.g. from JSON.stringify inside n8n expressions)
    if (typeof data === 'string') {
      try {
        const nested = JSON.parse(data);
        if (nested && typeof nested === 'object') {
          data = nested;
        }
      } catch {
        // keep data as string
      }
    }

    // Handle array responses (e.g. n8n returning incoming items array [{ output: ... }])
    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }

    let reply;
    if (typeof data === 'object' && data !== null) {
      reply = data.reply || data.output || data.text || data.message || data.response || data.result;
    } else if (typeof data === 'string' && data.trim()) {
      reply = data.trim();
    }

    if (!reply && !r.ok) {
      console.error(`[chat] n8n error (status ${r.status}):`, raw);
      return res.status(502).json({ reply: 'Sorry, the assistant encountered an error.' });
    }

    res.json({ reply: reply || 'Sorry, I could not answer that.' });
  } catch (err) {
    console.error('[chat] Failed to reach n8n webhook:', err);
    res.status(502).json({ reply: 'Sorry, the assistant is unavailable right now.' });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use by another running process.`);
    console.error(`To fix this, stop the existing server running on port ${PORT}:`);
    console.error(`   kill -9 $(lsof -t -i :${PORT})\n`);
    console.error(`Or specify a different PORT in backend/.env (e.g. PORT=3001)\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});