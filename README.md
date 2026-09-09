# 🚍 TransitFlow (TransitHub)

> **Enterprise Transport Management & Cross-Border Booking SaaS Platform**  
> Streamlining inter-city ticketing, live seat reservations, cross-border manifests, and fleet logistics across Central and West Africa.

---

## 🌟 Executive Overview

**TransitFlow** (also branded as **TransitHub**) is a full-stack, cloud-native transport management and ticketing SaaS designed specifically for African transport operators, passengers, and terminal staff. 

The platform supports domestic inter-city lines within Cameroon as well as direct cross-border lines operated by **Afrique Con** connecting Cameroon with Nigeria (Ikom, Calabar, Lagos, Enugu, Onitsha) and extended transit connections across West Africa (Benin, Togo, Ghana, Ivory Coast, Mali, Senegal).

---

## 🚀 Key Features

### 👤 Passenger Experience
* **Real-time Route Search**: Search domestic and international trips with date filtering, seat availability, and fare calculation.
* **Interactive Live Seat Map**: Real-time interactive seat layout selection (`<SeatMap />`) preventing double-booking.
* **Seamless Payment Options**:
  * **MTN MoMo & Orange Money**: Automated USSD prompt collection and polling via **CamPay API**.
  * **Credit / Debit Cards & Bank Transfer**.
  * *(Pay at Terminal is restricted to authorized operations staff).*
* **Digital QR Tickets**: Instant e-ticket generation with scannable QR code verification and print/PDF download.
* **Multilingual UI**: Native support for **English**, **French (Français)**, and **Cameroon Pidgin English (Kamtok)**.
* **Support Hub**: Integrated live chat (**Tawk.to**) and 1-click **WhatsApp** agent escalation.

### 🛡️ Operations & Staff Console (`/admin`)
* **Role-Based Access Control (RBAC)**: Secure Supabase Auth with JWT claims (`admin` vs `passenger`).
* **Fleet Management**: Track active, maintenance, and standby buses with Gold/Classic seat tiers.
* **Route & Schedule Dispatcher**:
  * Enforces the **Afrique Con Nigeria Departure Rule**: Bus lines from Cameroon to Nigeria operate exclusively on **Tuesdays and Fridays**.
* **Passenger Manifests**: Real-time manifest roster export with passenger contact details, seat assignments, and luggage quotas.
* **Agent / Terminal Cashier Desk**: Authorized staff can issue tickets and accept "Pay at Terminal" transactions.
* **Support Desk & Inquiries**: Management of passenger support requests and operational tickets.
* **Platform Configuration**: Dynamic currency rates, Gold ticket multiplier, and SMS/Email notification toggles.

### ⚡ Performance & Offline Resilience
* **Domain-Driven Context Separation**: Decoupled state into `AuthContext`, `FleetContext`, `BookingContext`, and `LanguageContext`.
* **Offline Mutation Queue**: IndexedDB persistence that records transactions during network drops and replays pending actions upon reconnection.
* **Modern UI Aesthetics**: Glowing animated boundary wrappers (`ElectricBorder`), password visibility toggle icons, and mobile-optimized viewports.

---

## 🗺️ Afrique Con Route Network

| Destination | Hubs / Terminals | Schedule Policy | Cross-Border |
| :--- | :--- | :--- | :---: |
| **Cameroon (Domestic)** | Douala (Akwa, Bonabéri), Yaoundé (Quartier Fouda), Buea (Mile 17), Limbe | Daily Departures | No |
| **Nigeria (Direct)** | Ikom, Calabar, Enugu, Onitsha, Lagos | **Tuesdays & Fridays Only** | **Yes** |
| **Benin** | Cotonou | Scheduled Weekly Express | **Yes** |
| **Togo** | Lomé | Scheduled Weekly Express | **Yes** |
| **Ghana** | Accra | Scheduled Weekly Express | **Yes** |
| **Ivory Coast (Côte d'Ivoire)** | Abidjan | Scheduled Weekly Express | **Yes** |
| **Mali & Senegal** | Bamako, Dakar | Transit Hub Connections | **Yes** |

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
* **Routing**: [React Router DOM v7](https://reactrouter.com/)
* **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) + CSS Grid & Flexbox
* **Icons**: [Lucide React](https://lucide.dev/)
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Row-Level Security + Google OAuth)
* **Mobile Money Gateway**: [CamPay API](https://www.campay.net/) (MTN MoMo & Orange Money)
* **Live Chat & Support**: [Tawk.to](https://www.tawk.to/) & WhatsApp API
* **State & Resilience**: React Context API + LocalStorage / IndexedDB Offline Sync Queue

---

## 📁 Directory Structure

```
transitflow/
├── public/                  # Static assets (favicons, hero images, SVG icons)
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── booking/         # SeatMap, PaymentGatewaySelector, PassengerForm
│   │   ├── ElectricBorder.jsx # Glowing Canvas animated border
│   │   ├── Navbar.jsx       # Responsive navigation bar
│   │   └── TransitBot.jsx   # Live chat & WhatsApp floating widget
│   ├── context/             # Domain state management
│   │   ├── AppContext.jsx   # Unified root provider
│   │   ├── AuthContext.jsx  # Supabase Auth, Google OAuth & RBAC
│   │   ├── BookingContext.jsx # Cart, seat reservation & payment polling
│   │   ├── FleetContext.jsx # Buses, routes, and Nigeria Tuesday/Friday validation
│   │   ├── LanguageContext.jsx # EN / FR / PCM localization
│   │   └── supabaseClient.js # Supabase client initialization
│   ├── pages/               # Application views
│   │   ├── admin/           # Admin Console views (Dashboard, Fleet, Schedules, Bookings, etc.)
│   │   ├── Auth.jsx         # Login, Register & Password Reset with ElectricBorder
│   │   ├── Book.jsx         # Booking flow & checkout
│   │   ├── Home.jsx         # Landing page & trip search
│   │   ├── MyTrips.jsx      # Passenger booking history
│   │   ├── Search.jsx       # Search results & route filtering
│   │   └── Ticket.jsx       # QR e-ticket verification & printable receipt
│   ├── utils/               # Helper utilities & offline mutation queue
│   ├── App.jsx              # Route definitions & layouts
│   ├── index.css            # Tailwind directives & global viewport rules
│   └── main.jsx             # React DOM entrypoint
├── docs/                    # In-depth architectural & operational documentation
│   ├── ARCHITECTURE.md      # System design, state domains & database schema
│   ├── API_AND_INTEGRATIONS.md # CamPay, Supabase, & Tawk.to API integration
│   ├── DEPLOYMENT.md        # Production build & cloud deployment guide
│   └── USER_GUIDE.md         # Passenger & administrator operational guide
├── vite.config.js           # Vite config with integrated CamPay dev proxy
└── package.json             # Dependencies & scripts
```

---

## ⚡ Getting Started

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone repository
git clone https://github.com/numforbrandy/transitflow.git

# Navigate into project directory
cd transitflow

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```

Configure your environment keys:
```ini
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# CamPay Mobile Money Gateway
CAMPAY_USERNAME=your_campay_username
CAMPAY_PASSWORD=your_campay_password
CAMPAY_ENV=dev # 'dev' for sandbox, 'prod' for live
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 🔑 Administrative Access

To access the Staff / Operations Console:
1. Navigate to `/login` or click **Sign In**.
2. Authorized Admin Email: `nkengsteadbeks@gmail.com`
3. Upon authentication, users with the admin role are granted access to `/admin`.

---

## 📚 Detailed Documentation

* 🏛️ **[System Architecture & Database Design](docs/ARCHITECTURE.md)**
* 💳 **[API & Payment Gateway Integrations](docs/API_AND_INTEGRATIONS.md)**
* 🚀 **[Production Deployment Guide](docs/DEPLOYMENT.md)**
* 📖 **[Passenger & Administrator Operations Manual](docs/USER_GUIDE.md)**

---

## 📄 License
TransitFlow is proprietary software. All rights reserved © 2026.
