-- Seed localized_journeys with sample test journeys for pilot branches.
\echo Seeding localized_journeys for branch_origin=':branch_origin'

INSERT INTO public.localized_journeys (
    journey_code,
    origin_location,
    destination_location,
    departure_at,
    arrival_at,
    localized_description,
    status
)
SELECT journey_code, origin_location, destination_location, departure_at, arrival_at, localized_description, status
FROM (VALUES
    ('BUEA-J001', 'BUEA', 'DOUALA', '2026-07-15T08:00:00Z'::timestamptz, '2026-07-15T12:00:00Z'::timestamptz, 'Morning pilot route from Buea to Douala', 'scheduled'),
    ('BUEA-J002', 'BUEA', 'YAOUNDE', '2026-07-16T09:30:00Z'::timestamptz, '2026-07-16T13:45:00Z'::timestamptz, 'Day route from Buea to Yaoundé', 'scheduled')
) AS t(journey_code, origin_location, destination_location, departure_at, arrival_at, localized_description, status)
WHERE :'branch_origin' = 'BUEA';

INSERT INTO public.localized_journeys (
    journey_code,
    origin_location,
    destination_location,
    departure_at,
    arrival_at,
    localized_description,
    status
)
SELECT journey_code, origin_location, destination_location, departure_at, arrival_at, localized_description, status
FROM (VALUES
    ('DOUALA-J001', 'DOUALA', 'IKOM', '2026-07-15T07:00:00Z'::timestamptz, '2026-07-15T10:30:00Z'::timestamptz, 'Pilot route from Douala to Ikom', 'scheduled'),
    ('DOUALA-J002', 'DOUALA', 'BUEA', '2026-07-16T14:00:00Z'::timestamptz, '2026-07-16T18:00:00Z'::timestamptz, 'Return route from Douala to Buea', 'scheduled')
) AS t(journey_code, origin_location, destination_location, departure_at, arrival_at, localized_description, status)
WHERE :'branch_origin' = 'DOUALA';
