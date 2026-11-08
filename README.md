# MiniKitchen

A simple restaurant web application built with Node.js / Express, Supabase, and an optional n8n AI chatbot.

## Features

- **Public website** — menu, reservation form, opening hours & contact
- **Admin dashboard** — login, view & update reservations, add/edit menu items
- **AI chatbot** — answers questions about the restaurant and can book a table (routed through n8n → Gemini)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML / CSS / JS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | JWT stored in `httpOnly` cookie |
| AI / Automation | n8n + Google Gemini (optional) |

---

## Supabase setup

Create the following two tables in your Supabase project (SQL editor):

```sql
-- Menu items
create table menu_items (
  id          bigint generated always as identity primary key,
  name        text not null,
  description text,
  price       numeric(10,2) not null,
  category    text,
  available   boolean default true,
  created_at  timestamptz default now()
);

-- Reservations
create table reservations (
  id         bigint generated always as identity primary key,
  name       text not null,
  contact    text not null,
  date       date not null,
  time       time not null,
  guests     int not null,
  status     text default 'Pending',
  source     text default 'web',
  created_at timestamptz default now()
);
```

---

## Running locally

```bash
cd backend
npm install
# copy the template and fill in your values
cp .env.example .env
npm start
```

Open `http://localhost:3000` for the public site and `http://localhost:3000/admin.html` for the admin dashboard.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | ✅ | Supabase service-role secret key |
| `JWT_SECRET` | ✅ | Any long random string for signing admin tokens |
| `ADMIN_USER` | ✅ | Admin login username |
| `ADMIN_PASSWORD` | ✅ | Admin login password |
| `CHATBOT_API_KEY` | ✅ | Secret key n8n uses when calling `/api/chat-reservations` |
| `N8N_WEBHOOK_URL` | optional | Paste the n8n webhook URL here to enable the AI chatbot |

---

## n8n chatbot setup (optional)

The file `n8n-workflow.json` in this repo contains a ready-to-import n8n workflow.

### Quick start

1. Sign up at [n8n.io](https://n8n.io) (14-day cloud trial) or run n8n locally.
2. In n8n → **Workflows** → **Import from file** → select `n8n-workflow.json`.
3. Configure credentials inside n8n:
   - **Google Gemini API** — add your Gemini API key under *Credentials → Google Gemini API*.
   - **HTTP Header Auth** — name it `MiniKitchen API Key`, header name `x-api-key`, value = the `CHATBOT_API_KEY` from your `.env`.
4. Set the environment variable `MINIKITCHEN_API_URL` in n8n to your backend URL (e.g. `http://localhost:3000` for local dev, or your deployed URL).
5. **Activate** the workflow.
6. Copy the **Webhook production URL** from the Webhook node.
7. Paste it into your backend `.env` as `N8N_WEBHOOK_URL=<url>` and restart the server.

### How it works

```
User types in chat → /api/chat (Express)
  → n8n Webhook trigger
  → AI Agent (Gemini Flash + window memory)
     ├─ answers questions about menu / hours / contact
     └─ when it has name + contact + date + time + guests
        → saveReservation tool → POST /api/chat-reservations (Express)
          → Supabase: insert reservation with status = Pending
  → reply JSON sent back to user
```

The chatbot **never** marks a booking as Confirmed — only an admin can do that in the dashboard.

---

## Project structure

```
minikitchen/
├── backend/
│   ├── server.js          # Express API
│   ├── package.json
│   └── .env               # (git-ignored)
├── frontend/
│   ├── index.html         # Public website
│   ├── admin.html         # Admin dashboard
│   ├── style.css          # Shared styles
│   ├── admin.css          # Admin-only styles
│   ├── app.js             # Public site JS
│   └── admin.js           # Admin dashboard JS
├── n8n-workflow.json      # Import this into n8n
└── README.md
```

