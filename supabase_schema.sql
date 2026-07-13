-- TransitFlow Supabase Database Schema
-- Run this in your Supabase SQL Editor to create all tables and relationships

-- 1. Profiles Table (Linked to Supabase Auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text unique not null,
  role text not null default 'passenger' check (role in ('admin', 'passenger')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to automatically copy new auth.users into profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'passenger')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Buses Table
create table public.buses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  plate text unique not null,
  type text not null check (type in ('Silver', 'Gold', 'Gold VIP+')),
  capacity integer not null default 70,
  status text not null default 'Active' check (status in ('Active', 'Maintenance', 'Inactive')),
  branch text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 3. Routes Table
create table public.routes (
  id uuid default gen_random_uuid() primary key,
  origin text not null,
  destination text not null,
  price numeric not null,
  duration text not null,
  distance text not null,
  type text not null check (type in ('Inter-city', 'Cross-Border')),
  passport_required boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 4. Schedules Table
create table public.schedules (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references public.routes(id) on delete cascade not null,
  bus_id uuid references public.buses(id) on delete set null,
  departure_time time not null,
  departure_date date not null,
  arrival_time time not null,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Delayed', 'Completed', 'Cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 5. Bookings Table
create table public.bookings (
  id text primary key, -- Custom reference generated e.g. TH-12277325
  schedule_id uuid references public.schedules(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  passenger_name text not null,
  passenger_email text not null,
  phone text not null,
  seats text[] not null, -- Array of seat strings e.g. {'D3', 'F2'}
  travel_class text not null check (travel_class in ('Silver', 'Gold VIP+')),
  total_amount numeric not null,
  payment_method text not null,
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Refunded', 'Failed')),
  check_in_status text not null default 'Pending' check (check_in_status in ('Pending', 'Checked-In', 'Boarded', 'Cancelled')),
  passport_number text,
  booking_date timestamp with time zone default timezone('utc'::text, now()) not null,
  passengers jsonb -- Detailed JSON passenger list: [{seat, name, passport}]
);


-- 6. Support Tickets Table
create table public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  message text not null,
  status text not null default 'Open' check (status in ('Open', 'In-Progress', 'Resolved', 'Closed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) & Policies
alter table public.profiles enable row level security;
alter table public.buses enable row level security;
alter table public.routes enable row level security;
alter table public.schedules enable row level security;
alter table public.bookings enable row level security;
alter table public.support_tickets enable row level security;

-- Create basic access policies
create policy "Allow public read access to buses" on public.buses for select using (true);
create policy "Allow public read access to routes" on public.routes for select using (true);
create policy "Allow public read access to schedules" on public.schedules for select using (true);

create policy "Allow users to read their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Allow users to read their own bookings" on public.bookings for select using (auth.uid() = user_id or passenger_email = auth.email());
create policy "Allow users to create bookings" on public.bookings for insert with check (true);
create policy "Allow users to read their own support tickets" on public.support_tickets for select using (auth.uid() = user_id);
create policy "Allow users to create support tickets" on public.support_tickets for insert with check (auth.uid() = user_id);
