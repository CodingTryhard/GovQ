# 🏛️ GovQ — Smart Queue & Token Management System

GovQ is a modern, real-time token booking and queue management system designed for government offices, banks, and service centers. It eliminates physical queues by allowing citizens to book time slots online, pay service fees, and receive digital QR-code tickets.

The system features a live-updating Display Board powered by WebSockets, and a comprehensive Admin Panel for counter staff to manage the queue effortlessly.

---

## ✨ Key Features

### 👤 Citizen Portal
- **Online Booking**: Citizens can browse services, pick available dates, and lock time slots.
- **Payment Gateway Integration**: Secure fee collection via Razorpay.
- **Digital Tickets**: Auto-generated QR codes upon successful booking.

### 🏢 Counter / Staff Portal
- **Real-time Queue Management**: "Call Next", "Mark Served", "No-Show", and "Skip" functionality.
- **QR Scanner**: Instantly scan a citizen's digital ticket to pull up their details.
- **Live Sync**: All actions instantly reflect on the public Display Board.

### 📺 Public Display Board
- **WebSocket Powered**: Instantly updates without refreshing the page.
- **Current Status**: Displays which tokens are currently being served at which counter.
- **Next in Line**: Shows upcoming tokens to keep citizens informed.

---

## 🛠️ Technology Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- Axios (API Client)
- React Router DOM
- React-QR-Code / HTML5-QRCode

**Backend:**
- Python / Django 
- Django REST Framework (DRF)
- Django Channels & Daphne (WebSockets)
- Redis (Message Broker)
- SQLite (Local) / PostgreSQL (Production)
- Razorpay Python SDK

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/YourUsername/GovQ.git
cd GovQ
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your keys
echo "RAZORPAY_KEY_ID=your_test_key" > .env
echo "RAZORPAY_KEY_SECRET=your_test_secret" >> .env

# Run migrations and start the server
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

*Note: For the live Display Board to work locally, ensure you have Redis installed and running on `localhost:6379`, or use a cloud Redis URL.*

---

## 🌍 Production Deployment

This project includes a `render.yaml` Blueprint for 100% automated backend deployment on Render.

### Backend (Render)
1. Go to **Render.com** and click **New -> Blueprint**.
2. Connect this repository.
3. Render will automatically provision a free PostgreSQL database, a free Redis instance, and build your Daphne web server.
4. Go to your new Web Service on Render, click **Environment**, and add your Razorpay keys:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

### Frontend (Vercel)
1. Import the `frontend` folder into **Vercel**.
2. In the Vercel project settings, add the following Environment Variable:
   - `VITE_API_URL` = `https://your-render-url.onrender.com` (No trailing slash)
3. Deploy!

---

## 🔒 Security Notes
- Ensure your `SECRET_KEY` and Razorpay Secrets are never committed to version control.
- In production, Django `DEBUG` is strictly set to `False`.

---

**Built with ❤️ for better queue management.**
