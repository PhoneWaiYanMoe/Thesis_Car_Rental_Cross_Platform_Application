import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { randomString } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// =====================================================================
// WIZ CAR RENTAL — K6 LOAD TEST
// Tests: user-service → vehicle-service → booking-service
//
// Usage:
//   Ramp-up:  k6 run --env SCENARIO=rampup  load-test.js
//   Spike:    k6 run --env SCENARIO=spike    load-test.js
//   Stress:   k6 run --env SCENARIO=stress   load-test.js
//   All:      k6 run load-test.js
//
// After scaling up replicas:
//   docker service scale wiz_user-service=6
//   docker service scale wiz_vehicle-service=6
//   docker service scale wiz_booking-service=6
// Then re-run the same script and compare results.
// =====================================================================

const BASE_URL = "http://206.189.147.242";

// ---------- Custom Metrics ----------
const errorRate         = new Rate("error_rate");
const loginDuration     = new Trend("login_duration",    true);
const vehicleDuration   = new Trend("vehicle_duration",  true);
const bookingDuration   = new Trend("booking_duration",  true);
const registrationFails = new Counter("registration_fails");
const bookingFails      = new Counter("booking_fails");

// ---------- Scenario Selector ----------
const SCENARIO = __ENV.SCENARIO || "all";

// =====================================================================
// SCENARIOS
// =====================================================================
const scenarios = {};

// 1. GRADUAL RAMP-UP — realistic traffic growth
if (SCENARIO === "rampup" || SCENARIO === "all") {
  scenarios["gradual_rampup"] = {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "1m",  target: 10  }, // warm up
      { duration: "2m",  target: 50  }, // ramp to moderate load
      { duration: "3m",  target: 100 }, // ramp to high load
      { duration: "2m",  target: 100 }, // hold at peak
      { duration: "1m",  target: 0   }, // cool down
    ],
    gracefulRampDown: "30s",
    exec: "carRentalFlow",
    tags: { scenario: "rampup" },
  };
}

// 2. SPIKE TEST — sudden burst of traffic
if (SCENARIO === "spike" || SCENARIO === "all") {
  scenarios["spike_test"] = {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "30s", target: 10  }, // baseline
      { duration: "10s", target: 200 }, // sudden spike
      { duration: "1m",  target: 200 }, // hold spike
      { duration: "10s", target: 10  }, // drop back
      { duration: "30s", target: 0   }, // cool down
    ],
    gracefulRampDown: "30s",
    exec: "carRentalFlow",
    tags: { scenario: "spike" },
    startTime: SCENARIO === "all" ? "10m" : "0s", // offset when running all
  };
}

// 3. STRESS TEST — push beyond breaking point
if (SCENARIO === "stress" || SCENARIO === "all") {
  scenarios["stress_test"] = {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2m",  target: 100 }, // ramp up
      { duration: "3m",  target: 200 }, // above normal
      { duration: "3m",  target: 300 }, // stress zone
      { duration: "2m",  target: 400 }, // breaking point
      { duration: "2m",  target: 0   }, // recovery
    ],
    gracefulRampDown: "30s",
    exec: "carRentalFlow",
    tags: { scenario: "stress" },
    startTime: SCENARIO === "all" ? "22m" : "0s", // offset when running all
  };
}

// =====================================================================
// OPTIONS
// =====================================================================
export const options = {
  scenarios,
  thresholds: {
    // Overall error rate must stay below 5%
    "error_rate":                        ["rate<0.05"],
    // 95th percentile response times
    "login_duration":                    ["p(95)<2000"],
    "vehicle_duration":                  ["p(95)<3000"],
    "booking_duration":                  ["p(95)<3000"],
    // HTTP request thresholds
    "http_req_duration":                 ["p(95)<3000"],
    "http_req_failed":                   ["rate<0.05"],
    // Per-scenario thresholds
    "http_req_duration{scenario:rampup}":["p(95)<2500"],
    "http_req_duration{scenario:spike}": ["p(95)<4000"],
    "http_req_duration{scenario:stress}":["p(95)<5000"],
  },
};

// =====================================================================
// HELPERS
// =====================================================================

/** Register a brand-new user, return { token, userId } or null on failure */
function registerAndLogin() {
  const email    = `testuser_${randomString(8)}@wiz-test.com`;
  const password = "Test@12345";
  const phone    = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

  // --- Register ---
  const regRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email,
      password,
      confirmPassword: password,
      firstName: "Load",
      lastName:  "Tester",
      phoneNumber: phone,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const regOk = check(regRes, {
    "register: status 200/201": (r) => r.status === 200 || r.status === 201,
  });

  if (!regOk) {
    registrationFails.add(1);
    errorRate.add(1);
    return null;
  }

  // --- Login ---
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );
  loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    "login: status 200":    (r) => r.status === 200,
    "login: has token":     (r) => {
      try { return !!JSON.parse(r.body).data?.accessToken; } catch { return false; }
    },
  });

  errorRate.add(!loginOk ? 1 : 0);
  if (!loginOk) return null;

  const body  = JSON.parse(loginRes.body);
  const token = body.data?.accessToken || body.accessToken || body.token;
  const userId = body.data?.user?.id || body.data?.userId;
  return { token, userId };
}

/** Search available vehicles, return a vehicleId or null */
function searchVehicles(token) {
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 3);

  const params = new URLSearchParams({
    startDate:  tomorrow.toISOString().split("T")[0],
    endDate:    dayAfter.toISOString().split("T")[0],
    page:       "1",
    limit:      "10",
  });

  const start = Date.now();
  const res   = http.get(
    `${BASE_URL}/vehicles?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  vehicleDuration.add(Date.now() - start);

  const ok = check(res, {
    "vehicles: status 200":       (r) => r.status === 200,
    "vehicles: returns results":  (r) => {
      try {
        const b = JSON.parse(r.body);
        return (b.data?.vehicles?.length > 0) || (b.data?.length > 0) || (b.vehicles?.length > 0);
      } catch { return false; }
    },
  });

  errorRate.add(!ok ? 1 : 0);
  if (!ok) return null;

  try {
    const b    = JSON.parse(res.body);
    const list = b.data?.vehicles || b.data || b.vehicles || [];
    return list.length > 0 ? list[0].id || list[0]._id : null;
  } catch {
    return null;
  }
}

/** Create a booking, return true/false */
function createBooking(token, vehicleId) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  const start = Date.now();
  const res   = http.post(
    `${BASE_URL}/bookings`,
    JSON.stringify({
      vehicleId,
      startDate:       tomorrow.toISOString(),
      endDate:         dayAfter.toISOString(),
      pickupLocation:  "Yangon International Airport",
      dropoffLocation: "Yangon International Airport",
      paymentMethod:   "mock",
    }),
    {
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${token}`,
      },
    }
  );
  bookingDuration.add(Date.now() - start);

  const ok = check(res, {
    "booking: status 200/201": (r) => r.status === 200 || r.status === 201,
    "booking: has bookingId":  (r) => {
      try {
        const b = JSON.parse(r.body);
        return !!(b.data?.id || b.data?.bookingId || b.bookingId);
      } catch { return false; }
    },
  });

  errorRate.add(!ok ? 1 : 0);
  if (!ok) bookingFails.add(1);
  return ok;
}

// =====================================================================
// MAIN FLOW  (user registers → logs in → searches vehicles → books)
// =====================================================================
export function carRentalFlow() {
  let token     = null;
  let vehicleId = null;

  // ── Step 1: Register & Login ──────────────────────────────────────
  group("1_auth", () => {
    const result = registerAndLogin();
    if (result) token = result.token;
  });

  if (!token) {
    sleep(1);
    return; // abort this VU iteration if auth failed
  }
  sleep(1);

  // ── Step 2: Search Vehicles ───────────────────────────────────────
  group("2_vehicle_search", () => {
    vehicleId = searchVehicles(token);
  });

  if (!vehicleId) {
    sleep(1);
    return; // no vehicles found, skip booking
  }
  sleep(1);

  // ── Step 3: Create Booking ────────────────────────────────────────
  group("3_booking", () => {
    createBooking(token, vehicleId);
  });

  sleep(Math.random() * 2 + 1); // 1–3s think time between iterations
}

// =====================================================================
// SUMMARY  (printed at end of each run)
// =====================================================================
export function handleSummary(data) {
  const metrics = data.metrics;

  const fmt = (m, stat) =>
    m && m.values && m.values[stat] !== undefined
      ? `${m.values[stat].toFixed(0)} ms`
      : "N/A";

  const pct = (m, key) =>
    m && m.values && m.values[key] !== undefined
      ? `${(m.values[key] * 100).toFixed(2)}%`
      : "N/A";

  const summary = `
================================================================
  WIZ CAR RENTAL — LOAD TEST SUMMARY
================================================================
  Total Requests      : ${metrics.http_reqs?.values?.count      ?? "N/A"}
  Request Rate        : ${metrics.http_reqs?.values?.rate?.toFixed(2) ?? "N/A"} req/s
  Error Rate          : ${pct(metrics.error_rate, "rate")}
  HTTP Failures       : ${pct(metrics.http_req_failed, "rate")}

  ── Response Times (p95) ──────────────────────────────────────
  Login               : ${fmt(metrics.login_duration,   "p(95)")}
  Vehicle Search      : ${fmt(metrics.vehicle_duration, "p(95)")}
  Booking Creation    : ${fmt(metrics.booking_duration, "p(95)")}
  Overall             : ${fmt(metrics.http_req_duration, "p(95)")}

  ── Failures ──────────────────────────────────────────────────
  Registration Fails  : ${metrics.registration_fails?.values?.count  ?? 0}
  Booking Fails       : ${metrics.booking_fails?.values?.count        ?? 0}

  ── VUs ───────────────────────────────────────────────────────
  Peak VUs            : ${metrics.vus_max?.values?.max ?? "N/A"}
================================================================
  NOTE: Run this BEFORE scaling, then AFTER scaling, and compare:
    docker service scale wiz_user-service=6
    docker service scale wiz_vehicle-service=6
    docker service scale wiz_booking-service=6
================================================================
`;

  console.log(summary);

  return {
    "stdout":             summary,
    "summary-before.txt": summary, // rename to summary-after.txt on second run
  };
}