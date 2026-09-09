# 📘 TransitFlow (TransitHub) — Comprehensive User & Operations Manual

> **Version**: 2.0.0  
> **Target Audience**: Passengers, Station Cashiers, Dispatchers, Bus Conductors, and System Administrators.  
> **Coverage**: Domestic Cameroon Lines & Afrique Con International Transit Network.

---

## 📑 Table of Contents

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Passenger User Guide](#2-passenger-user-guide)
   * 2.1 [Finding & Searching for Trips](#21-finding--searching-for-trips)
   * 2.2 [Afrique Con Route Network & Nigeria Schedule Policy](#22-afrique-con-route-network--nigeria-schedule-policy)
   * 2.3 [Interactive Seat Map & Tier Selection](#23-interactive-seat-map--tier-selection)
   * 2.4 [Checkout & Mobile Money (MoMo / Orange) Payment](#24-checkout--mobile-money-momo--orange-payment)
   * 2.5 [E-Ticket Inspection, QR Verification & Printing](#25-e-ticket-inspection-qr-verification--printing)
   * 2.6 [Managing Booking History & My Trips](#26-managing-booking-history--my-trips)
   * 2.7 [Multilingual Interface (English, French, Pidgin)](#27-multilingual-interface-english-french-pidgin)
3. [Station Cashier & Terminal Agent Guide](#3-station-cashier--terminal-agent-guide)
   * 3.1 [Walk-In Counter Bookings](#31-walk-in-counter-bookings)
   * 3.2 [Pay at Terminal Cash Transactions](#32-pay-at-terminal-cash-transactions)
   * 3.3 [Ticket Lookup & Re-Issuance](#33-ticket-lookup--re-issuance)
4. [Dispatcher & Fleet Operations Guide](#4-dispatcher--fleet-operations-guide)
   * 4.1 [Fleet Inventory & Maintenance Management](#41-fleet-inventory--maintenance-management)
   * 4.2 [Route Management & Cross-Border Configuration](#42-route-management--cross-border-configuration)
   * 4.3 [Schedule Dispatching & Tuesday/Friday Nigeria Rules](#43-schedule-dispatching--tuesdayfriday-nigeria-rules)
5. [Conductor & Boarding Controller Guide](#5-conductor--boarding-controller-guide)
   * 5.1 [QR Code Verification & Passenger Check-In](#51-qr-code-verification--passenger-check-in)
   * 5.2 [Exporting & Printing Bus Manifests](#52-exporting--printing-bus-manifests)
6. [Administrator & Operations Manager Guide](#6-administrator--operations-manager-guide)
   * 6.1 [Operations Dashboard & Real-Time Analytics](#61-operations-dashboard--real-time-analytics)
   * 6.2 [User Role Management & Permissions](#62-user-role-management--permissions)
   * 6.3 [Platform Settings, Currencies & Notifications](#63-platform-settings-currencies--notifications)
   * 6.4 [Support Desk & Live Chat Management](#64-support-desk--live-chat-management)
7. [Afrique Con Network Terminal Directory](#7-afrique-con-network-terminal-directory)
8. [Frequently Asked Questions (FAQ) & Troubleshooting](#8-frequently-asked-questions-faq--troubleshooting)

---

## 1. System Overview & Architecture

TransitFlow connects passengers, terminal ticket booths, fleet managers, and vehicle conductors in a unified ecosystem:

```
+-----------------------------------------------------------------------------------------+
|                                    TRANSITFLOW PORTAL                                   |
+--------------------------+------------------------------+-------------------------------+
|     PASSENGER WEB        |       STATION AGENT          |        ADMIN CONSOLE          |
|  - Route Search          |  - Walk-In Ticket Counter    |  - Fleet & Bus Maintenance    |
|  - Live Seat Selection   |  - "Pay at Terminal" Cash    |  - Tuesday/Friday Validation  |
|  - MoMo / Orange Payment |  - Ticket Re-Printing        |  - Boarding Manifest Export   |
|  - QR Code E-Ticket      |  - Passenger Phone Lookup    |  - Financial & Support Desk   |
+--------------------------+------------------------------+-------------------------------+
                                          |
+-----------------------------------------v-----------------------------------------------+
|                                CORE BACKEND SERVICES                                    |
|  - Supabase PostgreSQL (Row-Level Security & Role-Based Access Control)                 |
|  - CamPay API Integration (Automated MTN & Orange Mobile Money USSD Push)               |
|  - Offline Mutation Queue (IndexedDB Caching for Remote Terminals)                      |
|  - Multilingual Engine (English, Français, Kamtok Pidgin)                               |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Passenger User Guide

### 2.1 Finding & Searching for Trips
1. Open **[http://localhost:5173/](http://localhost:5173/)** (or your production URL).
2. On the **Hero Search Card**:
   * **From**: Select your departure city / terminal (e.g., `Douala (Akwa)` or `Buea (Mile 17)`).
   * **To**: Select your arrival destination (e.g., `Yaoundé (Quartier Fouda)` or `Ikom (Nigeria)`).
   * **Travel Date**: Pick your desired travel date.
3. Click **Search Trips**.

---

### 2.2 Afrique Con Route Network & Nigeria Schedule Policy

> ⚠️ **CRITICAL SCHEDULE POLICY FOR NIGERIA TRAVEL**:  
> Express buses from Cameroon to any part of **Nigeria** (Ikom, Calabar, Lagos, Enugu, Onitsha) depart exclusively on **Tuesdays** and **Fridays**.

* When searching for Nigeria lines on a non-departure day (e.g., Wednesday or Sunday), the system will indicate that departures occur on Tuesdays and Fridays and offer the closest available dates.
* Extended West African destinations (Benin, Togo, Ghana, Ivory Coast, Mali, Senegal) operate regular scheduled weekly connections through regional transit hubs.

---

### 2.3 Interactive Seat Map & Tier Selection

When you click **Book Seats** on a trip:
1. You are presented with the **Interactive Bus Seat Map (`<SeatMap />`)**.
2. **Legend**:
   * 🟩 **Available Seat** (White / Light border): Click to select.
   * 🟥 **Occupied / Reserved Seat** (Dark Gray / Strikethrough): Cannot be selected.
   * 🔴 **Your Selected Seat** (Bright Red / Orange): Your chosen seats.
3. **Bus Classes**:
   * **Classic Coach**: Standard 2x2 air-conditioned seating.
   * **Gold / VIP Coach**: Ultra-wide reclining 2x1 seating with complimentary Wi-Fi, snacks, and extra legroom.

---

### 2.4 Checkout & Mobile Money (MoMo / Orange) Payment

```
Step 1: Enter Passenger Information (Name, Phone Number, Email)
                   |
Step 2: Choose Payment Gateway
   ├── MTN MoMo / Orange Money (Automated CamPay USSD)
   ├── Credit / Debit Card (Visa, Mastercard)
   └── Direct Bank Transfer
                   |
Step 3: Click "Pay with Mobile Money"
                   |
Step 4: Passenger receives USSD Push on Mobile Phone ("Authorize XAF...")
                   |
Step 5: Enter MoMo / Orange PIN -> Transaction Confirmed!
                   |
Step 6: Instant Digital QR Ticket Generated!
```

#### How to Pay with MTN MoMo or Orange Money:
1. Select **Mobile Money (MTN / Orange)**.
2. Enter your Cameroon mobile number (format: `6XXXXXXXX`).
3. Click **Pay with Mobile Money**.
4. Check your mobile phone for the automated network prompt:
   * **MTN Cameroon**: Prompt appears immediately; enter your PIN.
   * **Orange Money**: Approve via prompt or dial `#150*50#` if USSD is delayed.
5. The TransitFlow browser screen automatically detects approval in real time and issues your ticket.

---

### 2.5 E-Ticket Inspection, QR Verification & Printing

Upon successful checkout, you are redirected to the **Digital Ticket Screen (`/ticket/:id`)**:

```
+-------------------------------------------------------------+
|  🚍 TRANSITHUB OFFICIAL BOARDING PASS                       |
|  Ticket No: TF-847291             Date: 2026-08-28          |
+-------------------------------------------------------------+
|  Passenger: JOHN DOE              Bus Plate: LT-982-AA      |
|  Route: Douala (Akwa) -> Yaoundé  Departure: 07:30 AM       |
|  Seats: A1, A2                    Class: VIP Luxury         |
|                                                             |
|         [  QR CODE  ]            Status: VERIFIED & PAID    |
|         [  SCANNER  ]            Total: 15,000 FCFA         |
+-------------------------------------------------------------+
|      [ Print Boarding Pass ]       [ Download PDF ]         |
+-------------------------------------------------------------+
```

* **Print Boarding Pass**: Click to send the formatted ticket to your thermal receipt printer or desktop printer.
* **Mobile Presentation**: You can display the digital QR pass directly on your smartphone screen to the bus conductor at the boarding gate.

---

### 2.6 Managing Booking History & My Trips
* Click **My Trips** in the navigation header.
* Enter your booking reference or view your authenticated trip history.
* Review departure countdowns, download past receipts, and view live itinerary details.

---

### 2.7 Multilingual Interface (English, French, Pidgin)
Click the globe icon in the navigation bar to toggle between:
* 🇬🇧 **English** (Default)
* 🇫🇷 **Français** (Complete French translation)
* 🇨🇲 **Cameroon Pidgin / Kamtok** (Colloquial local dialect: *"Choose comot place and reach place"*)

---

## 3. Station Cashier & Terminal Agent Guide

Station cashiers operate at physical bus terminal ticket counters in Douala, Yaoundé, Buea, Limbe, and Ikom.

### 3.1 Walk-In Counter Bookings
1. Navigate to `/admin/agent-console` or click **Agent Console** in the staff menu.
2. Select the passenger's desired departure from the active schedule board.
3. Help the walk-in customer pick their seats on the interactive screen.
4. Enter the passenger's name and contact phone number.

### 3.2 Pay at Terminal Cash Transactions
* **Security Rule**: The **"Pay at Terminal (Cash)"** payment gateway is exclusively unlocked for authenticated staff members with the `admin` role.
* Collect the physical cash from the passenger.
* Select **Pay at Terminal (Cash)**.
* The ticket is instantly booked and issued with `payment_status: 'completed'`.

### 3.3 Ticket Lookup & Re-Issuance
* If a passenger loses their printed receipt, enter their phone number or ticket ID into the search bar at `/admin/bookings`.
* Click **Re-Print Ticket** to generate a fresh boarding pass.

---

## 4. Dispatcher & Fleet Operations Guide

### 4.1 Fleet Inventory & Maintenance Management (`/admin/fleet`)
* **Add Vehicle**: Enter the bus registration plate (e.g. `NW-304-BA`), coach model, total seat capacity, class tier (`Classic` or `Gold / VIP`), and assigned home branch.
* **Vehicle Status**:
  * 🟢 **Active**: Available for daily trip dispatch.
  * 🟡 **Standby**: Reserve bus for peak holiday periods or backup.
  * 🔴 **Maintenance**: Withdrawn from the scheduling pool for mechanical service.

---

### 4.2 Route Management & Cross-Border Configuration (`/admin/routes`)
* Configure origin and destination terminal pairs.
* Set standard travel durations (e.g., `Douala -> Yaoundé: 3.5h`) and distance milestones.
* Mark international routes with the **Cross-Border** flag to require passenger passport / travel ID registration.

---

### 4.3 Schedule Dispatching & Tuesday/Friday Nigeria Rules (`/admin/schedules`)

1. Click **Create Departure Schedule**.
2. Select the **Route** and an **Active Bus**.
3. Set the **Departure Date** and **Departure Time**.
4. Set the **Base Ticket Fare (FCFA)**.
5. **Validation Safeguard**:
   * If the selected route is destined for **Nigeria** (Ikom, Calabar, Lagos, Enugu, Onitsha), the system performs automated calendar day verification (`isTuesdayOrFriday()`).
   * If an operator inadvertently chooses a Monday or Thursday, the system displays an alert:  
     *"Afrique Con bus lines to Nigeria only operate on Tuesdays and Fridays. Please adjust the departure date."*

---

## 5. Conductor & Boarding Controller Guide

### 5.1 QR Code Verification & Passenger Check-In
1. Conductors can open the **Boarding Scanner** on their mobile tablet or phone.
2. Scan the passenger's printed ticket or smartphone screen QR code.
3. The scanner displays:
   * Passenger Name
   * Seat Number(s)
   * Payment Verification (`PAID`)
   * Luggage Allocation Allowance
4. Click **Check In** to mark the passenger as boarded.

---

### 5.2 Exporting & Printing Bus Manifests (`/admin/manifests`)
Before departure, transport regulations require a verified passenger manifest:
1. Open `/admin/manifests`.
2. Select the trip schedule ID.
3. The manifest automatically aggregates:
   * Vehicle License Plate & Driver ID
   * Full Passenger Roster sorted by Seat Number
   * Emergency Contact Phone Numbers
   * Luggage Piece Counts
4. Click **Print Manifest** to generate the official hard copy for border control and highway checkpoints.

---

## 6. Administrator & Operations Manager Guide

### 6.1 Operations Dashboard & Real-Time Analytics (`/admin`)
* **Revenue Metrics**: Real-time revenue tracking across MoMo, Orange Money, Cards, and Terminal Cash.
* **Load Factor**: Average seat occupancy percentages across domestic vs cross-border lines.
* **Active Trips**: Live counters of buses currently on route, arrived, or boarding.

---

### 6.2 User Role Management & Permissions
* **Passenger Role**: Standard access to booking, searching, viewing personal e-tickets.
* **Admin Role (`nkengsteadbeks@gmail.com`)**: Full administrative control over fleet, routes, schedules, pricing, cash acceptance, and manifests.

---

### 6.3 Platform Settings, Currencies & Notifications (`/admin/settings`)
* **Company Profile**: Update official company name, tax registration number, and central headquarters.
* **Currency Multipliers**: Set exchange rates for cross-border ticketing (FCFA / XAF, Nigerian Naira NGN, Ghanaian Cedi GHS, West African CFA XOF).
* **Automated Notifications**: Toggle SMS boarding reminders and email booking receipts.

---

### 6.4 Support Desk & Live Chat Management (`/admin/support`)
* Real-time triage of customer support tickets.
* Direct integration with the **Tawk.to agent dashboard** and centralized **WhatsApp inquiries**.

---

## 7. Afrique Con Network Terminal Directory

| City | Terminal / Station Location | Phone Contact | Operations |
| :--- | :--- | :--- | :--- |
| **Douala** | Akwa Central Terminal (Boulevard de la Liberté) | +237 6 86 52 59 44 | Domestic & Cross-Border Hub |
| **Douala** | Bonabéri West Coast Terminal | +237 6 86 52 59 45 | Buea, Limbe & Cross-Border |
| **Yaoundé** | Quartier Fouda Central Agency | +237 6 86 52 59 46 | Domestic Capital Express |
| **Buea** | Mile 17 Junction Station | +237 6 86 52 59 47 | Regional & Nigeria Transit |
| **Limbe** | Half Mile Seaside Terminal | +237 6 86 52 59 48 | Regional Express |
| **Ikom (Nigeria)**| Four Corners International Border Hub | +234 80 1234 5678 | **Tuesdays & Fridays Arrival/Dep** |
| **Calabar / Lagos**| Trans-African Transit Express Hubs | +234 80 8765 4321 | Direct Connection Lines |

---

## 8. Frequently Asked Questions (FAQ) & Troubleshooting

### Q1: My Mobile Money was deducted, but my screen did not refresh. What should I do?
* **Answer**: TransitFlow's background polling engine verifies transactions with CamPay within 5 to 15 seconds. If network latency occurs, click **Check Status** or visit `/my-trips` and enter your phone number. Your ticket is stored in Supabase as soon as the carrier confirms the deduction.

### Q2: Why can't I select "Pay at Terminal"?
* **Answer**: "Pay at Terminal" is restricted to authorized counter staff to prevent uncollected seat hoarding. Passengers booking online can pay instantly with MTN MoMo, Orange Money, or credit cards.

### Q3: How do I book a trip to Nigeria for next Wednesday?
* **Answer**: Afrique Con express coaches to Nigeria operate exclusively on **Tuesdays** and **Fridays**. Please select either the preceding Tuesday or following Friday during date selection.

### Q4: What happens if the terminal internet goes offline?
* **Answer**: TransitFlow features an **Offline Mutation Queue**. Terminal agents can continue issuing tickets in local mode; transactions are stored in browser IndexedDB and automatically synchronized to the cloud when internet connectivity resumes.

### Q5: How do I change the language to French or Pidgin?
* **Answer**: Click the language switcher button (labeled `EN`, `FR`, or `PCM`) in the top right corner of the navigation bar at any time.

---

*TransitFlow Documentation Suite — All Rights Reserved © 2026.*
