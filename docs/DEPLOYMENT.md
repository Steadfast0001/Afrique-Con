# 🚀 TransitFlow Deployment Guide

This document provides step-by-step instructions for deploying TransitFlow into production environments.

---

## 1. Production Build

TransitFlow uses Vite to create an optimized production bundle:

```bash
# Build the frontend artifacts
npm run build

# Preview the production build locally
npm run preview
```

The output artifacts will be written to the `dist/` directory.

---

## 2. Supabase SQL Database Migration

Execute the following SQL script inside your Supabase SQL Editor to establish all tables and security policies:

```sql
-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text unique,
  role text default 'passenger',
  created_at timestamptz default now()
);

-- 2. Create Buses Table
create table if not exists public.buses (
  id text primary key,
  plate text not null,
  model text not null,
  capacity int not null,
  type text default 'Classic',
  status text default 'active',
  branch text default 'Douala',
  created_at timestamptz default now()
);

-- 3. Create Routes Table
create table if not exists public.routes (
  id text primary key,
  origin text not null,
  destination text not null,
  distance text,
  duration text,
  cross_border boolean default false,
  created_at timestamptz default now()
);

-- 4. Create Schedules Table
create table if not exists public.schedules (
  id text primary key,
  route_id text references public.routes(id) on delete cascade,
  bus_id text references public.buses(id) on delete cascade,
  departure_date date not null,
  departure_time text not null,
  base_fare numeric not null,
  available_seats int not null,
  created_at timestamptz default now()
);

-- 5. Create Bookings Table
create table if not exists public.bookings (
  id text primary key,
  user_id uuid,
  schedule_id text references public.schedules(id) on delete cascade,
  passenger_name text not null,
  passenger_phone text not null,
  seat_numbers jsonb not null,
  total_price numeric not null,
  payment_method text not null,
  payment_status text default 'completed',
  booking_date timestamptz default now()
);

-- 6. Create Support Tickets Table
create table if not exists public.support_tickets (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  subject text not null,
  message text not null,
  status text default 'open',
  created_at timestamptz default now()
);

-- 7. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.buses enable row level security;
alter table public.routes enable row level security;
alter table public.schedules enable row level security;
alter table public.bookings enable row level security;
alter table public.support_tickets enable row level security;

-- 8. Public Read Policies
create policy "Allow public read on buses" on public.buses for select using (true);
create policy "Allow public read on routes" on public.routes for select using (true);
create policy "Allow public read on schedules" on public.schedules for select using (true);
create policy "Allow public insert on bookings" on public.bookings for insert with check (true);
create policy "Allow users to read their own bookings" on public.bookings for select using (true);

-- 9. Admin Manage Policies
create policy "Admin only manage buses" on public.buses
for all using (auth.jwt() ->> 'email' in ('nkengsteadbeks@gmail.com'));

create policy "Admin only manage routes" on public.routes
for all using (auth.jwt() ->> 'email' in ('nkengsteadbeks@gmail.com'));
```

---

## 3. Deployment Options

### Option A: Vercel (Recommended)
1. Import your repository into [Vercel](https://vercel.com).
2. Set Build Command to `npm run build` and Output Directory to `dist`.
3. Configure Environment Variables in Project Settings.
4. For CamPay API routes in serverless environments, add a `vercel.json` rewrite or Vercel Serverless Function under `/api`.

### Option B: Netlify
1. Connect repository in [Netlify](https://netlify.com).
2. Configure build settings:
   * Build command: `npm run build`
   * Publish directory: `dist`
3. Add SPA fallback rule in `public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Option C: Docker Container
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. Environment Variables Checklist

Ensure these variables are set in your hosting platform dashboard:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY`| Supabase Public Anon Key | `eyJhbGciOi...` |
| `CAMPAY_USERNAME` | CamPay Merchant App Username | `my_campay_user` |
| `CAMPAY_PASSWORD` | CamPay Merchant App Password | `my_campay_pass` |
| `CAMPAY_ENV` | Mode (`dev` or `prod`) | `prod` |
