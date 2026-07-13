-- TransitFlow Database Seeding Script
-- Run this in your Supabase SQL Editor to populate buses, routes, and a schedule calendar of trips

-- 1. Insert Cameroon Buses (Fleet)
insert into public.buses (name, plate, type, capacity, status, branch) values
('Toyota Coaster Standard', 'LT-1092-A', 'Silver', 51, 'Active', 'Douala'),
('Toyota Coaster Standard', 'LT-9821-B', 'Silver', 51, 'Active', 'Yaoundé'),
('Mercedes O500 VIP', 'CE-4432-C', 'Gold VIP+', 28, 'Active', 'Douala'),
('King Long Coach VIP', 'NW-7782-D', 'Gold VIP+', 28, 'Active', 'Bamenda'),
('Yutong Luxury VIP', 'LT-8812-E', 'Gold VIP+', 28, 'Active', 'Douala'),
('Yutong Standard Coach', 'CE-9021-F', 'Silver', 70, 'Active', 'Yaoundé'),
('Toyota Coaster Standard', 'NW-1122-G', 'Silver', 51, 'Active', 'Bamenda'),
('Mercedes O500 VIP Coach', 'CE-1234-H', 'Gold VIP+', 28, 'Active', 'Yaoundé'),
('King Long Premium Coach', 'SW-3321-I', 'Silver', 70, 'Active', 'Buea'),
('Toyota Coaster Standard', 'LT-5544-J', 'Silver', 51, 'Active', 'Bafoussam')
on conflict (plate) do nothing;

-- 2. Insert Routes
insert into public.routes (origin, destination, price, duration, distance, type, passport_required) values
('Douala', 'Yaoundé', 6000, '3h 30m', '245 km', 'Inter-city', false),
('Yaoundé', 'Douala', 6000, '3h 30m', '245 km', 'Inter-city', false),
('Yaoundé', 'Bamenda', 8000, '5h 00m', '366 km', 'Inter-city', false),
('Bamenda', 'Yaoundé', 8000, '5h 00m', '366 km', 'Inter-city', false),
('Douala', 'Bafoussam', 5000, '3h 00m', '195 km', 'Inter-city', false),
('Bafoussam', 'Douala', 5000, '3h 00m', '195 km', 'Inter-city', false),
('Douala', 'Buea', 3000, '1h 30m', '75 km', 'Inter-city', false),
('Buea', 'Douala', 3000, '1h 30m', '75 km', 'Inter-city', false),
('Bamenda', 'Enugu', 20000, '8h 00m', '350 km', 'Cross-Border', true),
('Douala', 'Calabar', 25000, '6h 00m', '280 km', 'Cross-Border', true)
on conflict do nothing;

-- 3. Dynamic PL/pgSQL calendar scheduling script
-- Generates daily departure trips from July 13th to July 30th, 2026
do $$
declare
  r_id uuid;
  b_id uuid;
  d_date date;
begin
  -- Loop through dates
  for d_date in select generate_series('2026-07-13'::date, '2026-07-30'::date, '1 day'::interval)::date loop
    
    -- Trip 1: Douala -> Yaoundé (Morning, Silver)
    select id into r_id from public.routes where origin = 'Douala' and destination = 'Yaoundé' limit 1;
    select id into b_id from public.buses where branch = 'Douala' and type = 'Silver' order by random() limit 1;
    if r_id is not null and b_id is not null then
      insert into public.schedules (route_id, bus_id, departure_time, departure_date, arrival_time, status)
      values (r_id, b_id, '07:30:00', d_date, '11:00:00', 'Scheduled');
    end if;

    -- Trip 2: Yaoundé -> Douala (Morning, Silver)
    select id into r_id from public.routes where origin = 'Yaoundé' and destination = 'Douala' limit 1;
    select id into b_id from public.buses where branch = 'Yaoundé' and type = 'Silver' order by random() limit 1;
    if r_id is not null and b_id is not null then
      insert into public.schedules (route_id, bus_id, departure_time, departure_date, arrival_time, status)
      values (r_id, b_id, '08:30:00', d_date, '12:00:00', 'Scheduled');
    end if;

    -- Trip 3: Douala -> Yaoundé (Afternoon VIP, Gold VIP+)
    select id into r_id from public.routes where origin = 'Douala' and destination = 'Yaoundé' limit 1;
    select id into b_id from public.buses where branch = 'Douala' and type = 'Gold VIP+' order by random() limit 1;
    if r_id is not null and b_id is not null then
      insert into public.schedules (route_id, bus_id, departure_time, departure_date, arrival_time, status)
      values (r_id, b_id, '14:30:00', d_date, '18:00:00', 'Scheduled');
    end if;

    -- Trip 4: Yaoundé -> Douala (Afternoon VIP, Gold VIP+)
    select id into r_id from public.routes where origin = 'Yaoundé' and destination = 'Douala' limit 1;
    select id into b_id from public.buses where branch = 'Yaoundé' and type = 'Gold VIP+' order by random() limit 1;
    if r_id is not null and b_id is not null then
      insert into public.schedules (route_id, bus_id, departure_time, departure_date, arrival_time, status)
      values (r_id, b_id, '15:30:00', d_date, '19:00:00', 'Scheduled');
    end if;

    -- Trip 5: Yaoundé -> Bamenda
    select id into r_id from public.routes where origin = 'Yaoundé' and destination = 'Bamenda' limit 1;
    select id into b_id from public.buses where branch = 'Yaoundé' order by random() limit 1;
    if r_id is not null and b_id is not null then
      insert into public.schedules (route_id, bus_id, departure_time, departure_date, arrival_time, status)
      values (r_id, b_id, '10:00:00', d_date, '15:00:00', 'Scheduled');
    end if;

    -- Trip 6: Bamenda -> Yaoundé
    select id into r_id from public.routes where origin = 'Bamenda' and destination = 'Yaoundé' limit 1;
    select id into b_id from public.buses where branch = 'Bamenda' order by random() limit 1;
    if r_id is not null and b_id is not null then
      insert into public.schedules (route_id, bus_id, departure_time, departure_date, arrival_time, status)
      values (r_id, b_id, '09:00:00', d_date, '14:00:00', 'Scheduled');
    end if;

    -- Trip 7: Douala -> Buea
    select id into r_id from public.routes where origin = 'Douala' and destination = 'Buea' limit 1;
    select id into b_id from public.buses where branch = 'Douala' order by random() limit 1;
    if r_id is not null and b_id is not null then
      insert into public.schedules (route_id, bus_id, departure_time, departure_date, arrival_time, status)
      values (r_id, b_id, '17:00:00', d_date, '18:30:00', 'Scheduled');
    end if;

    -- Trip 8: Bamenda -> Enugu (Cross-border - Runs on even calendar days)
    if extract(day from d_date)::int % 2 = 0 then
      select id into r_id from public.routes where origin = 'Bamenda' and destination = 'Enugu' limit 1;
      select id into b_id from public.buses where branch = 'Bamenda' order by random() limit 1;
      if r_id is not null and b_id is not null then
        insert into public.schedules (route_id, bus_id, departure_time, departure_date, arrival_time, status)
        values (r_id, b_id, '06:00:00', d_date, '14:00:00', 'Scheduled');
      end if;
    end if;

  end loop;
end;
$$;
