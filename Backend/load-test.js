import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// =====================================================================
// WIZ CAR RENTAL — K6 LOAD TEST  (v3 — aligned with actual source code)
//
// Architecture insight:
//   • /auth/register → sends OTP email → requires /auth/verify-email-otp
//     before login works. So registration can't be automated without a
//     real mailbox. Instead we use ONE pre-seeded test account for login.
//   • Vehicle search  → GET /vehicles/search   (public, no auth needed)
//   • Vehicle detail  → GET /vehicles/:id      (public)
//   • My bookings     → GET /bookings/my-bookings (requires auth)
//
//  ⚠️  BEFORE RUNNING: create a verified test account once:
//       curl -X POST http://206.189.147.242/auth/register \
//         -H "Content-Type: application/json" \
//         -d '{"email":"loadtest@wiz-test.com","fullName":"Load Tester","password":"Test@12345"}'
//      Then verify OTP in your email, then confirm TEST_EMAIL/TEST_PASSWORD below.
//
// Usage:
//   Sanity check : k6 run --vus 1 --iterations 1 load-test.js
//   Baseline     : k6 run load-test.js 2>&1 | tee summary-before.txt
//   After scale  : k6 run load-test.js 2>&1 | tee summary-after.txt
//
// Scale commands:
//   docker service scale wiz_user-service=6 wiz_vehicle-service=6 wiz_booking-service=6
// =====================================================================

const BASE_URL = "http://206.189.147.242";
const TEST_EMAIL = "loadtest@wiz-test.com"; // ← pre-verified account
const TEST_PASS = "Test@12345";

// ---------- Custom Metrics ----------
const errorRate = new Rate("error_rate");
const loginDuration = new Trend("login_duration", true);
const vehicleDuration = new Trend("vehicle_duration", true);
const myBookingsDuration = new Trend("my_bookings_duration", true);
const loginFails = new Counter("login_fails");
const vehicleFails = new Counter("vehicle_fails");

// ---------- Scenario selector ----------
const SCENARIO = __ENV.SCENARIO || "all";

const scenarios = {};

// 1. GRADUAL RAMP-UP
if (SCENARIO === "rampup" || SCENARIO === "all") {
  scenarios["gradual_rampup"] = {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "1m", target: 10 },
      { duration: "2m", target: 50 },
      { duration: "3m", target: 100 },
      { duration: "2m", target: 100 },
      { duration: "1m", target: 0 },
    ],
    gracefulRampDown: "30s",
    exec: "carRentalFlow",
    tags: { scenario: "rampup" },
  };
}

// 2. SPIKE TEST
if (SCENARIO === "spike" || SCENARIO === "all") {
  scenarios["spike_test"] = {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "30s", target: 10 },
      { duration: "10s", target: 200 },
      { duration: "1m", target: 200 },
      { duration: "10s", target: 10 },
      { duration: "30s", target: 0 },
    ],
    gracefulRampDown: "30s",
    exec: "carRentalFlow",
    tags: { scenario: "spike" },
    startTime: SCENARIO === "all" ? "10m" : "0s",
  };
}

// 3. STRESS TEST
if (SCENARIO === "stress" || SCENARIO === "all") {
  scenarios["stress_test"] = {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2m", target: 100 },
      { duration: "3m", target: 200 },
      { duration: "3m", target: 300 },
      { duration: "2m", target: 400 },
      { duration: "2m", target: 0 },
    ],
    gracefulRampDown: "30s",
    exec: "carRentalFlow",
    tags: { scenario: "stress" },
    startTime: SCENARIO === "all" ? "22m" : "0s",
  };
}

export const options = {
  scenarios,
  thresholds: {
    error_rate: ["rate<0.05"],
    login_duration: ["p(95)<2000"],
    vehicle_duration: ["p(95)<3000"],
    my_bookings_duration: ["p(95)<3000"],
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.05"],
    "http_req_duration{scenario:rampup}": ["p(95)<2500"],
    "http_req_duration{scenario:spike}": ["p(95)<4000"],
    "http_req_duration{scenario:stress}": ["p(95)<5000"],
  },
};

// =====================================================================
// HELPERS
// =====================================================================

/**
 * Login with the pre-verified test account.
 * auth_controller.js login() response:
 *   { token, refreshToken, user: { id, email, fullName, phone, avatarUrl, role } }
 */
function login() {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
    { headers: { "Content-Type": "application/json" } },
  );
  loginDuration.add(Date.now() - start);

  const ok = check(res, {
    "login: status 200": (r) => r.status === 200,
    "login: has token": (r) => {
      try {
        return !!JSON.parse(r.body).token;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(ok ? 0 : 1);
  if (!ok) {
    console.error(`Login failed [${res.status}]: ${res.body}`);
    loginFails.add(1);
    return null;
  }

  // Response: { token, refreshToken, user }
  return JSON.parse(res.body).token;
}

/**
 * Search vehicles.
 * vehicle_controller.js searchVehicles() -> GET /vehicles/search (public)
 * Response: { vehicles: [...], pagination: {...} }
 * Each vehicle: { id, name, vehicleType, pricePerDay, rating, ... }
 */
function searchVehicles(token) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 3);

  const params = new URLSearchParams({
    startDate: tomorrow.toISOString().split("T")[0],
    endDate: dayAfter.toISOString().split("T")[0],
    page: "1",
    limit: "10",
  });

  const start = Date.now();
  const res = http.get(`${BASE_URL}/vehicles/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  vehicleDuration.add(Date.now() - start);

  const ok = check(res, {
    "vehicle search: status 200": (r) => r.status === 200,
    "vehicle search: has vehicles": (r) => {
      try {
        const b = JSON.parse(r.body);
        return Array.isArray(b.vehicles); // confirmed from vehicle_controller.js
      } catch {
        return false;
      }
    },
  });

  errorRate.add(ok ? 0 : 1);
  if (!ok) {
    console.error(`Vehicle search failed [${res.status}]: ${res.body}`);
    vehicleFails.add(1);
    return null;
  }

  try {
    const list = JSON.parse(res.body).vehicles || [];
    return list.length > 0 ? list[0].id : null; // vehicle.id confirmed in controller
  } catch {
    return null;
  }
}

/**
 * Get vehicle detail.
 * GET /vehicles/:id  (public)
 * Response: { vehicle: { id, name, specifications, photos, ... } }
 */
function getVehicleDetail(token, vehicleId) {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/vehicles/${vehicleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  vehicleDuration.add(Date.now() - start);

  const ok = check(res, {
    "vehicle detail: status 200": (r) => r.status === 200,
    "vehicle detail: has vehicle obj": (r) => {
      try {
        return !!JSON.parse(r.body).vehicle;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(ok ? 0 : 1);
  return ok;
}

/**
 * Get my bookings (authenticated).
 * GET /bookings/my-bookings
 * Response: { bookings: [...], pagination: {...} }
 */
function getMyBookings(token) {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/bookings/my-bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  myBookingsDuration.add(Date.now() - start);

  const ok = check(res, {
    "my-bookings: status 200": (r) => r.status === 200,
    "my-bookings: has bookings array": (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).bookings);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(ok ? 0 : 1);
  if (!ok) {
    console.error(`My-bookings failed [${res.status}]: ${res.body}`);
  }
  return ok;
}

// =====================================================================
// MAIN FLOW:  login → vehicle search → vehicle detail → my bookings
// Covers:     user-service, vehicle-service, booking-service
// =====================================================================
export function carRentalFlow() {
  let token = null;
  let vehicleId = null;

  // Step 1: Login (user-service)
  group("1_login", () => {
    token = login();
  });
  if (!token) {
    sleep(1);
    return;
  }
  sleep(0.5);

  // Step 2: Search vehicles (vehicle-service, public)
  group("2_vehicle_search", () => {
    vehicleId = searchVehicles(token);
  });
  sleep(0.5);

  // Step 3: Vehicle detail (vehicle-service, public)
  if (vehicleId) {
    group("3_vehicle_detail", () => {
      getVehicleDetail(token, vehicleId);
    });
    sleep(0.5);
  }

  // Step 4: My bookings (booking-service, authenticated)
  group("4_my_bookings", () => {
    getMyBookings(token);
  });

  sleep(Math.random() * 2 + 1);
}

export default function () {
  carRentalFlow();
}

// =====================================================================
// SUMMARY
// =====================================================================
export function handleSummary(data) {
  const metrics = data.metrics;

  const fmt = (m, stat) =>
    m?.values?.[stat] !== undefined ? `${m.values[stat].toFixed(0)} ms` : "N/A";

  const pct = (m, key) =>
    m?.values?.[key] !== undefined
      ? `${(m.values[key] * 100).toFixed(2)}%`
      : "N/A";

  const summary = `
================================================================
  WIZ CAR RENTAL — LOAD TEST SUMMARY
================================================================
  Total Requests      : ${metrics.http_reqs?.values?.count ?? "N/A"}
  Request Rate        : ${metrics.http_reqs?.values?.rate?.toFixed(2) ?? "N/A"} req/s
  Error Rate          : ${pct(metrics.error_rate, "rate")}
  HTTP Failures       : ${pct(metrics.http_req_failed, "rate")}

  ── Response Times (p95) ──────────────────────────────────────
  Login               : ${fmt(metrics.login_duration, "p(95)")}
  Vehicle Search      : ${fmt(metrics.vehicle_duration, "p(95)")}
  My Bookings         : ${fmt(metrics.my_bookings_duration, "p(95)")}
  Overall             : ${fmt(metrics.http_req_duration, "p(95)")}

  ── Failures ──────────────────────────────────────────────────
  Login Fails         : ${metrics.login_fails?.values?.count ?? 0}
  Vehicle Fails       : ${metrics.vehicle_fails?.values?.count ?? 0}

  ── VUs ───────────────────────────────────────────────────────
  Peak VUs            : ${metrics.vus_max?.values?.max ?? "N/A"}
================================================================
  NOTE: Run this BEFORE scaling, then AFTER scaling, and compare:
    docker service scale wiz_user-service=6
    docker service scale wiz_vehicle-service=6
    docker service scale wiz_booking-service=6
================================================================`;

  console.log(summary);
  return { stdout: summary };
}
