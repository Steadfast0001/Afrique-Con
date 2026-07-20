import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

export const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 20 },
    { duration: "3m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: [
      "p(50)<200",
      "p(95)<350",
      "p(99)<500",
    ],
    errors: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:8001";
const ORIGIN = __ENV.ORIGIN || "BUEA";
const DESTINATION = __ENV.DESTINATION || "DOUALA";
const DATE = __ENV.DATE || new Date().toISOString().split("T")[0];

export default function () {
  const url = `${BASE_URL}/api/search?origin=${ORIGIN}&destination=${DESTINATION}&date=${DATE}`;
  const res = http.get(url);

  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "has at least one result": (r) => {
      try {
        return Array.isArray(r.json("results")) && r.json("results").length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);
  sleep(1);
}
