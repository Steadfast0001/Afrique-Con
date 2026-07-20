# Frontend

This directory contains the user interface and client-facing web application.

Local dev
```
cd frontend
npm install
npm run dev
```

Features implemented:
- Admin login form (calls `/gateway/login` and stores JWT in localStorage)
- Session logout and token helpers
- Simple protected dashboard route

Notes:
- The frontend expects the auth gateway to expose `/gateway/login` that returns JSON `{ access_token: "..." }` on success.
- For production integrate secure cookie-based refresh flows and secure storage for tokens.
