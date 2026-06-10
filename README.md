# GovQ -- Queue Management System

GovQ is a token booking and queue management system built for government offices, banks, and service centers. The idea is simple: instead of people showing up and waiting in a physical line, they book a time slot online, pay any applicable fee, and get a QR code ticket that tells them exactly when to show up. Counter staff call tokens from a dashboard, and a public display board shows the live queue status on a screen in the waiting area.

The whole thing runs in real time over WebSockets. When a counter staff member calls the next token, the display board updates immediately without anyone refreshing a page.

---

## Features

**Citizen Portal**

Citizens can browse available services, pick a date, and lock in a time slot. Payments go through Razorpay. Once a booking is confirmed, the system generates a QR code ticket that the citizen can show at the counter or have scanned by staff.

**Counter Dashboard**

Staff get a clean interface to manage the queue. They can call the next token, mark one as served, skip a slot, or flag a no-show. There is also a built-in QR scanner that pulls up the full booking details when a citizen presents their ticket. Every action on the dashboard reflects on the public display board immediately.

**Public Display Board**

A dedicated screen meant to be shown in the waiting area. It displays which tokens are currently being served at each counter and what is coming up next. It stays in sync with the counter dashboard over a persistent WebSocket connection, so there is no lag and no need to refresh.

---

## Stack

**Frontend:** React (Vite), Tailwind CSS, Axios, React Router DOM, React-QR-Code, HTML5-QRCode

**Backend:** Django, Django REST Framework, Django Channels + Daphne, Redis, PostgreSQL (production) / SQLite (local), Razorpay Python SDK

---

## Local Setup

```bash
git clone https://github.com/CodingTryhard/GovQ.git
cd GovQ

# Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

echo "RAZORPAY_KEY_ID=your_test_key" > .env
echo "RAZORPAY_KEY_SECRET=your_test_secret" >> .env

python manage.py migrate
python manage.py runserver

# Frontend (open a separate terminal)
cd frontend
npm install
npm run dev
```

The display board requires a Redis instance running on `localhost:6379` for WebSockets to work locally. If you do not have Redis installed, you can point `REDIS_URL` in your `.env` to a free cloud Redis instance instead.

---

## Deployment

The repo includes a `render.yaml` blueprint that handles the backend infrastructure automatically. Connect the repo on Render via New > Blueprint and it provisions a PostgreSQL database, a Redis instance, and a Daphne server without any manual configuration.

After the services are created, go to your web service on Render, open the Environment tab, and add the following:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

For the frontend, import the `frontend` folder into Vercel as a separate project and add one environment variable:

- `VITE_API_URL` set to your Render backend URL, with no trailing slash

---

## Notes

Keep `SECRET_KEY`, Razorpay credentials, and any database URLs out of version control. Use environment variables for all of these in production. `DEBUG` is set to `False` in the production settings.

---

Built with love for better queue management.
