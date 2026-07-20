-- Seed localized_bookings with sample test bookings per branch. Use -v branch_origin='BUEA' or 'DOUALA'

-- For BUEA journeys
INSERT INTO public.localized_bookings (journey_id, booking_code, momo_reference_id, passenger_name, phone, amount, currency, status)
SELECT j.id, 'BUEA-B001', 'MOMO-BUEA-001', 'Alice Mbua', '+237600000001', 2500.00, 'XAF', 'confirmed'
FROM public.localized_journeys j
WHERE j.journey_code = 'BUEA-J001' AND :'branch_origin' = 'BUEA'
ON CONFLICT (booking_code) DO NOTHING;

INSERT INTO public.localized_bookings (journey_id, booking_code, momo_reference_id, passenger_name, phone, amount, currency, status)
SELECT j.id, 'BUEA-B002', 'MOMO-BUEA-002', 'Paul Etienne', '+237600000002', 1800.00, 'XAF', 'confirmed'
FROM public.localized_journeys j
WHERE j.journey_code = 'BUEA-J002' AND :'branch_origin' = 'BUEA'
ON CONFLICT (booking_code) DO NOTHING;

-- For DOUALA journeys
INSERT INTO public.localized_bookings (journey_id, booking_code, momo_reference_id, passenger_name, phone, amount, currency, status)
SELECT j.id, 'DOUALA-B001', 'MOMO-DOUALA-001', 'Dieudonné', '+237600000003', 3000.00, 'XAF', 'confirmed'
FROM public.localized_journeys j
WHERE j.journey_code = 'DOUALA-J001' AND :'branch_origin' = 'DOUALA'
ON CONFLICT (booking_code) DO NOTHING;

INSERT INTO public.localized_bookings (journey_id, booking_code, momo_reference_id, passenger_name, phone, amount, currency, status)
SELECT j.id, 'DOUALA-B002', 'MOMO-DOUALA-002', 'Chantal', '+237600000004', 2200.00, 'XAF', 'confirmed'
FROM public.localized_journeys j
WHERE j.journey_code = 'DOUALA-J002' AND :'branch_origin' = 'DOUALA'
ON CONFLICT (booking_code) DO NOTHING;
