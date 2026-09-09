# 🔌 TransitFlow API & Integrations

This guide explains how TransitFlow interfaces with third-party payment gateways, authentication providers, and customer communication channels.

---

## 1. CamPay Mobile Money Gateway

TransitFlow integrates directly with **CamPay** for automated MTN Mobile Money (MoMo) and Orange Money payments across Cameroon.

### 1.1 Payment Architecture

```
+----------------+      +-------------------+      +-------------------+      +------------------+
|   Passenger    |      |    TransitFlow    |      |    Vite Dev /     |      |   CamPay Cloud   |
|   (Browser)    |      |  BookingContext   |      |  Production Proxy |      |    REST API      |
+--------+-------+      +---------+---------+      +---------+---------+      +--------+---------+
         |                        |                          |                         |
         | Select MoMo / Orange   |                          |                         |
         | Enter Phone Number     |                          |                         |
         | Click "Pay with Mobile"|                          |                         |
         +----------------------->|                          |                         |
         |                        | POST /api/campay-collect |                         |
         |                        | (amount, from, ref)      |                         |
         |                        +------------------------->|                         |
         |                        |                          | POST /api/token/        |
         |                        |                          | (username, password)    |
         |                        |                          +------------------------>|
         |                        |                          | < Token {token}         |
         |                        |                          |<------------------------+
         |                        |                          | POST /api/collect/      |
         |                        |                          | (Bearer Token + Payload)|
         |                        |                          +------------------------>|
         |                        |                          | < 200 {reference}       |
         |                        | < 200 {reference}        |<------------------------+
         |                        |<-------------------------+                         |
         |                        |                          |                         |
         | Phone receives USSD    |                          |                         |
         | Prompt (Enter PIN)     |                          |                         |
         |                        | Poll GET /api/campay-    |                         |
         |                        | status?ref={reference}   |                         |
         |                        +------------------------->| GET /api/transaction/   |
         |                        |                          +------------------------>|
         |                        |                          | < {status: 'SUCCESSFUL'}|
         |                        | < {status: 'SUCCESSFUL'} |<------------------------+
         |                        |<-------------------------+                         |
         | Show QR Ticket E-Pass  |                          |                         |
         |<-----------------------+                          |                         |
```

### 1.2 Environment Variables
```ini
CAMPAY_USERNAME=your_campay_app_username
CAMPAY_PASSWORD=your_campay_app_password
CAMPAY_ENV=dev # Options: 'dev' (demo sandbox) or 'prod' (live transactions)
```

### 1.3 Vite Middleware Endpoints (`vite.config.js`)
* `POST /api/campay-collect`: Authenticates server-side, requests USSD prompt push to passenger's device, and returns transaction reference.
* `GET /api/campay-status?ref={reference}`: Polls transaction status (`PENDING`, `SUCCESSFUL`, `FAILED`).

---

## 2. Supabase Integration (Auth & PostgreSQL)

### 2.1 Configuration
Client initialization is managed in `src/context/supabaseClient.js`:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://local-demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-demo-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2.2 Google OAuth 2.0 Integration
TransitFlow supports Google Social Login. When a user authenticates via Google:
1. `supabase.auth.signInWithOAuth({ provider: 'google' })` redirects to Google's consent screen.
2. Upon return to `/`, the session listener in `AuthContext.jsx` captures the user's Google profile metadata and upserts their record into `public.profiles`.

---

## 3. Customer Communication & Live Support

TransitFlow features multi-channel support directly inside the user experience via `<TransitBot />`:

### 3.1 Tawk.to Live Chat Widget
* Loaded dynamically through script injection to keep initial bundle size lean.
* Automatically minimized on initialization and invoked on demand when passenger clicks *"Live Chat Support"*.

### 3.2 WhatsApp Direct Escalation
* Configured in Platform Settings.
* Formats an encoded pre-filled booking inquiry message and opens passenger's native WhatsApp app to chat with Afrique Con / TransitFlow dispatchers.
