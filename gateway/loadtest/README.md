# Gateway Search Endpoint Load Test

This folder contains a k6 load test for the gateway `/api/search` endpoint.

## Target SLA

- p50 latency < 200 ms
- p95 latency < 350 ms
- p99 latency < 500 ms
- error rate < 1%

## Script

The script is `search-endpoint-k6.js`.

## Run locally or in staging

Install k6:

```powershell
choco install k6
```

Run the test:

```powershell
cd gateway/loadtest
k6 run search-endpoint-k6.js --env BASE_URL=http://staging.example.com
```

To override search parameters:

```powershell
k6 run search-endpoint-k6.js --env BASE_URL=http://staging.example.com --env ORIGIN=BUEA --env DESTINATION=DOUALA --env DATE=2026-07-10
```

## Notes

- The script ramps from 20 to 100 virtual users and then ramps down.
- It validates that the response status is 200 and the payload contains at least one result.
- If k6 is not installed in the current environment, install it first or run this in a CI/staging environment that includes k6.
