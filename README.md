# MiniKitchen — Luxury Coastal Dining & Hospitality Sanctuary

An exclusive digital experience for **MiniKitchen**, a premier fine-dining destination and culinary sanctuary situated on Beach Road in Negombo, Sri Lanka.

Engineered with the visual sophistication of five-star boutique resorts and Michelin-starred establishments: deep nocturne emerald, warm champagne gold accents, pearl alabaster, and refined editorial typography (`Cormorant Garamond` serif and `Plus Jakarta Sans`).

---

## Architectural Highlights

- **Cinematic Guest Experience**:
  - Full-screen cinematic hero with ambient lighting, estate credential badges, and atmospheric storytelling.
  - Asymmetric editorial narrative showcasing Negombo's coastal heritage and sustainable lagoon sourcing.
  - Interactive Gastronomy Collection with dynamic category curation, dish photography, allergen/spice indicators, and SVG culinary fallbacks.
  - Bespoke Table Reservation Suite with seating preferences (Oceanfront Verandah, Sanctuary Dining Room, Chef's Counter), real-time validation, and two-tier pending review notices.
  - Digital Guest Concierge Suite with gold crest insignia, animated concierge typing indicators, curated inquiry chips, and intelligent fallback handling.
- **Executive Management Portal**:
  - Discreet, secure executive access authenticated via signed JWT (`httpOnly` secure cookies with Bearer token fallback).
  - 5 Live Operational Metric Cards: Total Inquiries, Active Pending Requests, Confirmed Reservations, Today's Bookings/Covers, and Active Culinary Creations.
  - Multi-Criteria Reservation Ledger with real-time text search (guest name, contact, reservation ID), date picker filtering, status dropdowns, and instant reset.
  - Dynamic Dish Management with real-time image preview, curated luxury photography presets, inline editing, availability toggling, and instant removal.
- **Resilient Dual-Tier Photo Persistence**:
  - Native Supabase `image_url` column integration paired with an automatic server-side JSON fallback (`menu_images.json`) and cache-busting headers (`Cache-Control: no-store`) ensuring instant dish image updates across both public and admin interfaces.
- **AI Guest Concierge**:
  - n8n LangChain workflow integrating Google Gemini with conversational memory, estate knowledge retrieval, and direct table reservation booking via secure API authentication.

---

## Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | Vanilla HTML5 / Modern CSS3 / ES6+ JS | Zero heavy frontend dependencies; high-performance CSS custom properties, glassmorphism, responsive micro-interactions |
| **Typography** | Google Fonts | `Cormorant Garamond` (editorial serif) & `Plus Jakarta Sans` (refined sans-serif) |
| **Backend** | Node.js + Express 5 | RESTful API, cookie parsing, CORS, resilient error handling, port collision guard |
| **Database** | Supabase (PostgreSQL) | Managed cloud relational database with row-level queries and auto-incrementing identity keys |
| **Authentication**| JSON Web Tokens (JWT) | Secure 8-hour session tokens stored in `httpOnly`, `sameSite: 'lax'` cookies with `Bearer` header support |
| **AI Concierge** | n8n + Google Gemini Flash | Conversational AI guest concierge with structured reservation tool calling |

---

## Supabase Database Schema

Execute the following SQL commands in your **Supabase SQL Editor**:

```sql
-- 1. Gastronomy Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  category    TEXT DEFAULT 'Mains',
  available   BOOLEAN DEFAULT TRUE,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure image_url column is present on existing tables
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Table Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  contact    TEXT NOT NULL,
  date       DATE NOT NULL,
  time       TEXT NOT NULL,
  guests     INT NOT NULL CHECK (guests >= 1 AND guests <= 20),
  seating    TEXT DEFAULT 'Ocean Breeze Veranda',
  status     TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Cancelled')),
  source     TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure seating column is present on existing tables
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS seating TEXT DEFAULT 'Ocean Breeze Veranda';

-- Optional: Seed initial fine-dining dishes
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Lagoon Jumbo Prawns', 'Negombo lagoon jumbo prawns chargrilled over coconut husk with garlic emulsion and tempered curry leaves.', 3800.00, 'Ocean Catch', true, 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=88'),
('Negombo Mud Crab Curry', 'Freshly landed mud crab simmered in roasted Jaffna spices, thick coconut cream, and wild murunga leaves.', 4500.00, 'Ocean Catch', true, 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=900&q=88'),
('Wagyu Beef Roti Kottu', 'Hand-chopped godamba flatbread tossed with slow-braised Australian wagyu, organic greens, and spiced egg ribbons.', 2900.00, 'Artisanal Kottu', true, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=88'),
('Crispy Egg Hopper Symphony', 'Crisp-edged rice-flour bowl with organic egg yolk, paired with seenu sambol and fresh coconut pol sambol.', 1600.00, 'Clay-Pot Curries', true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=88'),
('Royal Coconut Watalappam', 'Silky steamed coconut custard infused with organic kithul jaggery, cardamom pod elixir, and toasted cashews.', 1400.00, 'Confections & Elixirs', true, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=88');
```

---

## Critical Business Logic: Reservation Lifecycle

All table reservations submitted through the website or requested via the digital guest concierge are strictly initialized with:

$$\text{status} = \textbf{'Pending'}$$

- **Guest Guarantee**: Guests receive an immediate confirmation that their request has been logged and that our guest relations team will contact them directly to finalize availability.
- **Admin Authorization**: Only authenticated administrators logged into the **Executive Portal** can elevate a reservation to `Confirmed` or `Cancelled`.
- This policy guarantees reservations are never accidentally overbooked without human host review.

---

## Local Installation & Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/suprajanj/minikitchen.git
cd minikitchen/backend
npm install
```

### 2. Configure Environment Variables

Create your environment configuration file:

```bash
cp .env.example .env
```

Populate `backend/.env` with your credentials:

```ini
# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOi...

# Admin Security & JWT
ADMIN_USER=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=super_secret_jwt_random_key_min_32_chars

# Chatbot Integration
CHATBOT_API_KEY=minikitchen_secret_chatbot_token
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/minikitchen-chat

# Server
PORT=3000
```

### 3. Launch the Application

```bash
npm start
```

The application will be live at:
- **Public Guest Experience**: `http://localhost:3000`
- **Executive Management Portal**: `http://localhost:3000/admin.html`

*(If port 3000 is occupied, the server prints a clear error with the command to release the port or specify an alternative `PORT` in `.env`)*.

---

## Verifying JWT Authentication

Admin authentication uses signed JSON Web Tokens (HS256) valid for 8 hours.

### How to verify:

1. **Browser Inspection**:
   - Navigate to `http://localhost:3000/admin.html`.
   - Log in using your `ADMIN_USER` and `ADMIN_PASSWORD`.
   - Open Developer Tools (`F12` or `Cmd+Option+I`) → **Application** tab → **Cookies** → `http://localhost:3000`.
   - Verify the `token` cookie exists with `HttpOnly` and `SameSite: Lax` flags active.

2. **Terminal / cURL Verification**:

```bash
# 1. Log in and capture JWT cookie in a cookie jar
curl -i -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_secure_password"}' \
  -c cookies.txt

# 2. Access protected reservations ledger using the cookie jar
curl -i -X GET http://localhost:3000/api/admin/reservations \
  -b cookies.txt

# 3. Test unauthenticated request rejection (returns 401 Unauthorized)
curl -i -X GET http://localhost:3000/api/admin/reservations

# 4. Log out (clears token cookie)
curl -i -X POST http://localhost:3000/api/admin/logout \
  -b cookies.txt
```

---

## AI Guest Concierge Setup (n8n + Gemini)

The repository includes a production-ready workflow template: [`n8n-workflow.json`](n8n-workflow.json).

### Workflow Setup:

1. Open your [n8n instance](https://n8n.io) (Cloud or self-hosted).
2. Go to **Workflows** → **Import from File** → select `n8n-workflow.json`.
3. Set up the two credentials inside n8n:
   - **Google Gemini API**: Add your Gemini API Key.
   - **Header Auth**: Create a credential named `MiniKitchen API Key`:
     - Header Name: `x-api-key`
     - Header Value: Value matching `CHATBOT_API_KEY` from `backend/.env`.
4. Set the workflow variable `MINIKITCHEN_API_URL` to your backend URL (e.g., `http://localhost:3000` or production URL).
5. **Activate** the workflow.
6. Copy the **Production Webhook URL** and set `N8N_WEBHOOK_URL` in `backend/.env`.

---

## Repository Structure

```
minikitchen/
├── backend/
│   ├── server.js              # Express 5 REST API, Supabase client, JWT auth & n8n bridge
│   ├── menu_images.json       # Resilient local fallback storage for custom dish imagery
│   ├── package.json           # Backend dependencies and run scripts
│   └── .env.example           # Reference environment variables template
├── frontend/
│   ├── index.html             # Luxury guest-facing single-page experience
│   ├── admin.html             # Executive Hospitality Management Portal
│   ├── style.css              # Design system: variables, typography, layouts & animations
│   ├── admin.css              # Executive portal dashboard & ledger styling
│   ├── app.js                 # Gastronomy curation, reservation engine, guest concierge
│   └── admin.js               # Dashboard metrics, multi-criteria filter, dish manager
├── n8n-workflow.json          # Ready-to-import n8n LangChain AI concierge workflow
└── README.md                  # Comprehensive architectural and operational guide
```

---

## Brand Standards & Design Principles

- **Palette**: Deep Nocturne Emerald (`#0f2420`), Warm Champagne Gold (`#c5a880`), Sun-drenched Limestone (`#f4ede2`), Pearl Alabaster (`#fbf8f3`).
- **Typography Hierarchy**: High-contrast editorial titles set in `Cormorant Garamond` combined with clean, legible interface text in `Plus Jakarta Sans`.
- **Understated Hospitality**: Warm, welcoming, and reassuring language that honors guests while reflecting five-star boutique hospitality standards.
