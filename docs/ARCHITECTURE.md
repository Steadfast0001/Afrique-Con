# 🏛️ TransitFlow Architecture & System Design

This document details the high-level architecture, state management paradigms, database schema, and resilience strategies powering the **TransitFlow (TransitHub)** platform.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                                                                                   |
|   +-----------------------+   +------------------------+   +------------------+   |
|   |   Passenger Portal    |   |   Operations Console   |   |   Agent Desk     |   |
|   | (Search, Seats, Pay)  |   | (Fleet, Routes, Admin) |   | (Terminal Cash)  |   |
|   +-----------+-----------+   +-----------+------------+   +--------+---------+   |
+---------------|---------------------------|-------------------------|-------------+
                |                           |                         |
+---------------v---------------------------v-------------------------v-------------+
|                                 STATE LAYER                                       |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                                AppContext                                 |   |
|   |         (Unified Root Provider delegating to Domain Sub-contexts)         |   |
|   +---------+--------------------+---------------------+----------------------+   |
|             |                    |                     |                          |
|   +---------v--------+  +--------v-------+   +---------v--------+                 |
|   |   AuthContext    |  |  FleetContext  |   |  BookingContext  |                 |
|   | (RBAC, Google,   |  | (Buses, Routes |   | (Cart, SeatMap,  |                 |
|   |  Profiles)       |  |  Schedule Rules|   |  Payment Poller) |                 |
|   +---------+--------+  +--------+-------+   +---------+--------+                 |
|             |                    |                     |                          |
|             +--------------------+---------------------+                          |
|                                  |                                                |
|                      +-----------v------------+                                   |
|                      | Offline Mutation Queue |                                   |
|                      |  (IndexedDB / Local)   |                                   |
|                      +-----------+------------+                                   |
+----------------------------------|------------------------------------------------+
                                   |
+----------------------------------v------------------------------------------------+
|                             INTEGRATION LAYER                                     |
|                                                                                   |
|   +--------------------------+       +----------------------------------------+   |
|   |      Supabase API        |       |        CamPay Gateway (via Proxy)      |   |
|   | (PostgreSQL + RLS + Auth)|       |    (MTN MoMo & Orange Money USSD)      |   |
|   +--------------------------+       +----------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Domain-Driven Context Separation

Rather than storing all global state in a monolithic context, TransitFlow separates responsibilities across isolated domains:

### 2.1 `AuthContext` (`src/context/AuthContext.jsx`)
* Manages session lifecycle, active user profiles, and permission roles (`admin` vs `passenger`).
* Interacts with Supabase Auth (email/password & Google OAuth 2.0).
* Automatically upserts `public.profiles` records on login.
* Restricts sensitive operations (like "Pay at Terminal" transactions) based on JWT claims and administrative email identifiers (`nkengsteadbeks@gmail.com`).

### 2.2 `FleetContext` (`src/context/FleetContext.jsx`)
* Manages fleet vehicles (registration plates, capacity, models, status: `active` / `maintenance` / `standby`).
* Handles route origins, destinations, estimated travel durations, and cross-border flags.
* **Enforces Afrique Con Nigeria Departure Rules**:
  * Evaluates `isNigeriaDestination(dest)` for destinations like `Ikom`, `Calabar`, `Lagos`, `Enugu`, `Onitsha`.
  * Restricts Nigeria departure dates to **Tuesdays** (`day === 2`) and **Fridays** (`day === 5`).
* Exposes schedule dispatchers and inventory calculations.

### 2.3 `BookingContext` (`src/context/BookingContext.jsx`)
* Controls active booking session, seat cart selection (`<SeatMap />`), and passenger information forms.
* Coordinates payment method dispatch (Mobile Money, Cards, Bank Transfer, Admin Terminal Cash).
* Runs the `usePaymentPolling` custom hook to monitor CamPay transaction confirmation status in real time.

### 2.4 `LanguageContext` (`src/context/LanguageContext.jsx`)
* Provides reactive localization for English (`en`), French (`fr`), and Cameroon Pidgin English (`pcm`).

---

## 3. Database Schema (Supabase PostgreSQL)

TransitFlow utilizes 6 core relational tables in Supabase:

### `public.profiles`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid PRIMARY KEY` | References `auth.users.id` |
| `name` | `text` | Passenger or staff full name |
| `email` | `text UNIQUE` | Account email address |
| `role` | `text` | Access role (`'admin'` or `'passenger'`) |
| `created_at` | `timestamptz` | Record creation timestamp |

### `public.buses`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid / text PRIMARY KEY`| Unique bus identifier |
| `plate` | `text` | Vehicle license plate (e.g. `LT-982-AA`) |
| `model` | `text` | Vehicle model (e.g. `Yutong Luxury Coach`) |
| `capacity` | `int` | Number of passenger seats (e.g. 50, 70) |
| `type` | `text` | Seat category (`'Classic'` or `'Gold / VIP'`) |
| `status` | `text` | Operational status (`'active'`, `'maintenance'`, `'standby'`) |
| `branch` | `text` | Assigned base terminal (e.g. `Douala Akwa`) |

### `public.routes`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid / text PRIMARY KEY`| Unique route identifier |
| `origin` | `text` | Departure city / terminal |
| `destination` | `text` | Arrival city / terminal |
| `distance` | `text` | Distance estimate (e.g. `245 km`) |
| `duration` | `text` | Travel duration estimate (e.g. `3.5h`) |
| `cross_border` | `boolean` | Flag for international routes |

### `public.schedules`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid / text PRIMARY KEY`| Unique departure schedule identifier |
| `route_id` | `text` | Foreign key referencing `routes.id` |
| `bus_id` | `text` | Foreign key referencing `buses.id` |
| `departure_date` | `date` | Scheduled departure date (`YYYY-MM-DD`) |
| `departure_time` | `text` | Scheduled departure time (`HH:MM`) |
| `base_fare` | `numeric` | Price in FCFA (XAF) |
| `available_seats` | `int` | Remaining seat capacity |

### `public.bookings`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid / text PRIMARY KEY`| Unique booking code (e.g. `TF-178731`) |
| `user_id` | `uuid` | References `profiles.id` (or guest identifier) |
| `schedule_id` | `text` | References `schedules.id` |
| `passenger_name`| `text` | Passenger's official travel name |
| `passenger_phone`| `text` | Passenger's contact phone number |
| `seat_numbers` | `jsonb / text` | Selected seat numbers (e.g. `["A1", "A2"]`) |
| `total_price` | `numeric` | Total paid fare in FCFA |
| `payment_method`| `text` | `'momo'`, `'orange'`, `'card'`, `'bank'`, `'terminal'` |
| `payment_status`| `text` | `'completed'`, `'pending'`, `'failed'` |
| `booking_date` | `timestamptz` | Transaction timestamp |

### `public.support_tickets`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid / text PRIMARY KEY`| Ticket reference ID |
| `customer_name` | `text` | Inquiring customer name |
| `customer_email`| `text` | Customer email |
| `subject` | `text` | Inquiry subject |
| `message` | `text` | Inquiry details |
| `status` | `text` | `'open'`, `'in-progress'`, `'resolved'` |

---

## 4. Row-Level Security (RLS) & JWT Authorization

To ensure data integrity, write permissions on fleet inventory, routes, and schedules are locked to verified administrators via Supabase JWT claims:

```sql
-- Restrict write operations on buses to administrators
create policy "Admin only manage buses" on public.buses
for all using (
  auth.jwt() ->> 'email' in ('nkengsteadbeks@gmail.com')
  or (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Restrict route management to administrators
create policy "Admin only manage routes" on public.routes
for all using (
  auth.jwt() ->> 'email' in ('nkengsteadbeks@gmail.com')
  or (select role from public.profiles where id = auth.uid()) = 'admin'
);
```

---

## 5. Offline Mutation Queue Strategy

In low-connectivity environments (such as remote transit terminals), TransitFlow utilizes an **Offline Mutation Queue**:

1. **Interception**: When a network mutation (e.g., ticket booking or schedule adjustment) fails due to lack of connectivity, the payload is serialized and appended to IndexedDB / localStorage.
2. **Listener**: The application listens to window `online` events.
3. **Replay Engine**: Upon connectivity resumption, the queued mutations are processed sequentially with exponential backoff and optimistic state reconciliation.
