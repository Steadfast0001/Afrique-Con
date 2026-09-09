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
    case
      when lower(new.email) in ('nkengsteadbeks@gmail.com', 'admin@transitflow.com') then 'admin'
      else coalesce(new.raw_user_meta_data->>'role', 'passenger')
    end
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

-- 5.1 Anti-Double-Booking Trigger Function (ACID Concurrency Protection)
create or replace function public.prevent_seat_double_booking()
returns trigger as $$
declare
  conflict_seat text;
begin
  -- Search for overlapping active seat reservations on this departure schedule
  select s into conflict_seat
  from (
    select unnest(seats) as s
    from public.bookings
    where schedule_id = new.schedule_id
      and check_in_status != 'Cancelled'
      and id != new.id
  ) booked
  where booked.s = any(new.seats)
  limit 1;

  if conflict_seat is not null then
    raise exception 'SEAT_ALREADY_BOOKED: Seat % is already reserved for this departure schedule.', conflict_seat;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_seat_double_booking on public.bookings;
create trigger trg_prevent_seat_double_booking
  before insert or update of seats, schedule_id, check_in_status on public.bookings
  for each row execute function public.prevent_seat_double_booking();



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

-- Helper function to verify Admin privilege
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('nkengsteadbeks@gmail.com', 'admin@transitflow.com')
    or exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
end;
$$ language plpgsql security definer;

-- 1. Buses Policies: Public read, Admin write
drop policy if exists "Allow public read access to buses" on public.buses;
drop policy if exists "Admin only manage buses" on public.buses;
drop policy if exists "Allow all access to buses" on public.buses;

create policy "Allow public read access to buses" 
  on public.buses for select using (true);

create policy "Admin only manage buses" 
  on public.buses for all 
  using (public.is_admin()) 
  with check (public.is_admin());

-- 2. Routes Policies: Public read, Admin write
drop policy if exists "Allow public read access to routes" on public.routes;
drop policy if exists "Admin only manage routes" on public.routes;
drop policy if exists "Allow all access to routes" on public.routes;

create policy "Allow public read access to routes" 
  on public.routes for select using (true);

create policy "Admin only manage routes" 
  on public.routes for all 
  using (public.is_admin()) 
  with check (public.is_admin());

-- 3. Schedules Policies: Public read, Admin write
drop policy if exists "Allow public read access to schedules" on public.schedules;
drop policy if exists "Admin only manage schedules" on public.schedules;
drop policy if exists "Allow all access to schedules" on public.schedules;

create policy "Allow public read access to schedules" 
  on public.schedules for select using (true);

create policy "Admin only manage schedules" 
  on public.schedules for all 
  using (public.is_admin()) 
  with check (public.is_admin());

-- 4. Bookings Policies: Public can create, Owners & Admins view/update
drop policy if exists "Allow users to read and manage bookings" on public.bookings;
drop policy if exists "Allow all access to bookings" on public.bookings;
drop policy if exists "Allow public to create bookings" on public.bookings;
drop policy if exists "Allow users and admins to view bookings" on public.bookings;
drop policy if exists "Allow admins to manage all bookings" on public.bookings;

create policy "Allow public to create bookings" 
  on public.bookings for insert with check (true);

create policy "Allow users and admins to view bookings" 
  on public.bookings for select 
  using (
    public.is_admin() 
    or (auth.uid() is not null and auth.uid() = user_id) 
    or (auth.jwt() ->> 'email' is not null and lower(passenger_email) = lower(auth.jwt() ->> 'email'))
  );

create policy "Allow admins and owners to update bookings" 
  on public.bookings for update 
  using (public.is_admin() or (auth.uid() is not null and auth.uid() = user_id))
  with check (public.is_admin() or (auth.uid() is not null and auth.uid() = user_id));

-- 4.1 Secure RPC for unauthenticated guest passenger ticket verification (requires Booking ID + phone or email)
create or replace function public.lookup_guest_booking(
  p_booking_id text,
  p_identifier text
)
returns setof public.bookings as $$
begin
  return query
  select * from public.bookings
  where id = trim(p_booking_id)
    and (
      lower(passenger_email) = lower(trim(p_identifier))
      or replace(replace(phone, ' ', ''), '-', '') = replace(replace(trim(p_identifier), ' ', ''), '-', '')
    );
end;
$$ language plpgsql security definer;

-- 5. Profiles Policies: Users manage own profile, Admins view all
drop policy if exists "Allow users to read and update their own profile" on public.profiles;
drop policy if exists "Allow all access to profiles" on public.profiles;
drop policy if exists "Allow users and admins to view profiles" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;

create policy "Allow users and admins to view profiles" 
  on public.profiles for select 
  using (public.is_admin() or auth.uid() = id);

create policy "Allow users to update own profile" 
  on public.profiles for update 
  using (auth.uid() = id) with check (auth.uid() = id);

-- 6. Support Tickets Policies: Public create, Users view own, Admins manage all
drop policy if exists "Allow users to read and create support tickets" on public.support_tickets;
drop policy if exists "Allow all access to support_tickets" on public.support_tickets;
drop policy if exists "Allow public and users to create tickets" on public.support_tickets;
drop policy if exists "Allow users and admins to view tickets" on public.support_tickets;
drop policy if exists "Allow admins to update tickets" on public.support_tickets;

create policy "Allow public and users to create tickets" 
  on public.support_tickets for insert with check (true);

create policy "Allow users and admins to view tickets" 
  on public.support_tickets for select 
  using (public.is_admin() or auth.uid() = user_id);

create policy "Allow admins to update tickets" 
  on public.support_tickets for update 
  using (public.is_admin()) with check (public.is_admin());

