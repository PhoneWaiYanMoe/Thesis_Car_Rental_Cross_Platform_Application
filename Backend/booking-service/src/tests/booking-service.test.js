// Backend/booking-service/src/tests/booking-service.test.js
// Unit tests for Booking Service
// Run with: npm test (requires jest installed: npm install --save-dev jest)

const { v4: uuidv4 } = require("uuid");

// ==================== MOCK SETUP ====================

// Mock database pool
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: mockRelease,
};
mockConnect.mockResolvedValue(mockClient);

jest.mock("../config/database", () => ({
  query: mockQuery,
  connect: mockConnect,
}));

// Mock gRPC clients
jest.mock("../grpc/vehicle_grpc_client", () => ({
  getVehicleInfo: jest.fn(),
  getVehiclesInfo: jest.fn(),
  checkVehicleOwnership: jest.fn(),
  checkAvailability: jest.fn(),
  syncUnavailability: jest.fn(),
  incrementTotalRentals: jest.fn(),
}));

jest.mock("../grpc/payment_grpc_client", () => ({
  createDepositIntent: jest.fn(),
  createFinalPaymentIntent: jest.fn(),
  verifyPaymentStatus: jest.fn(),
  processRefund: jest.fn(),
}));

jest.mock("../grpc/user_grpc_client", () => ({
  getUserProfile: jest.fn(),
}));

// Mock RabbitMQ
jest.mock("../config/rabbitmq", () => ({
  getChannel: jest.fn(() => ({
    publish: jest.fn(() => true),
    assertQueue: jest.fn(),
    bindQueue: jest.fn(),
    consume: jest.fn(),
    ack: jest.fn(),
    nack: jest.fn(),
  })),
  connectRabbitMQ: jest.fn(),
}));

jest.mock("../utils/eventPublisher", () => ({
  bookingCreated: jest.fn(),
  bookingAcceptedByOwner: jest.fn(),
  bookingRejectedByOwner: jest.fn(),
  bookingCompleted: jest.fn(),
  bookingCancelled: jest.fn(),
  contractSigned: jest.fn(),
  pickupConfirmed: jest.fn(),
}));

// ==================== IMPORT MODULES AFTER MOCKS ====================

const vehicleGrpcClient = require("../grpc/vehicle_grpc_client");
const paymentGrpcClient = require("../grpc/payment_grpc_client");
const userGrpcClient = require("../grpc/user_grpc_client");
const pool = require("../config/database");

// ==================== TEST DATA ====================

const MOCK_USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const MOCK_OWNER_ID = "550e8400-e29b-41d4-a716-446655440002";
const MOCK_VEHICLE_ID = "660e8400-e29b-41d4-a716-446655440001";
const MOCK_BOOKING_ID = uuidv4();

const mockVehicle = {
  vehicle_id: MOCK_VEHICLE_ID,
  owner_id: MOCK_OWNER_ID,
  name: "Toyota Camry 2022",
  vehicle_type: "sedan",
  price_per_day: 375000,
  status: "active",
  average_rating: 4.5,
  total_rentals: 20,
};

const mockBooking = {
  booking_id: MOCK_BOOKING_ID,
  customer_id: MOCK_USER_ID,
  vehicle_id: MOCK_VEHICLE_ID,
  owner_id: MOCK_OWNER_ID,
  status: "booking",
  start_date: new Date(Date.now() + 86400000 * 2), // 2 days from now
  end_date: new Date(Date.now() + 86400000 * 5), // 5 days from now
  duration_days: 3,
  rental_price: 1125000,
  insurance_fee: 56250,
  total_amount: 1181250,
  deposit_amount: 354375,
  remaining_payment: 826875,
  deposit_paid: true,
  final_payment_paid: false,
  contract_signed_at: null,
  payment_expiry: new Date(Date.now() + 1800000),
  vehicle_reviewed: false,
  owner_reviewed: false,
  pickup_location: JSON.stringify({ address: "123 Test St" }),
  dropoff_location: JSON.stringify({ address: "123 Test St" }),
};

const mockCustomer = {
  user_id: MOCK_USER_ID,
  full_name: "John Doe",
  email: "john@example.com",
  role: "customer",
};

const mockOwner = {
  user_id: MOCK_OWNER_ID,
  full_name: "Jane Smith",
  email: "jane@example.com",
  role: "owner",
};

// ==================== HELPER: Mock Request/Response ====================

function mockReq(overrides = {}) {
  return {
    user: { userId: MOCK_USER_ID, role: "customer" },
    params: {},
    body: {},
    query: {},
    headers: { authorization: "Bearer mock-token" },
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

const mockNext = jest.fn();

// ==================== TEST SUITES ====================

// ── 1. BookingController ──────────────────────────────────────────────────────

describe("BookingController", () => {
  let bookingController;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module to get fresh instance
    jest.isolateModules(() => {
      bookingController = require("../controllers/booking_controller");
    });
  });

  // ── calculateRefundAmount ──

  describe("calculateRefundAmount()", () => {
    let controller;

    beforeAll(() => {
      jest.isolateModules(() => {
        controller = require("../controllers/booking_controller");
      });
    });

    it("returns full refund when cancelled 3+ days before start", () => {
      const booking = {
        ...mockBooking,
        start_date: new Date(Date.now() + 86400000 * 5), // 5 days away
        deposit_paid: true,
        deposit_amount: 354375,
        final_payment_paid: false,
        remaining_payment: 826875,
      };

      const { refundAmount } = controller.calculateRefundAmount(booking);
      expect(refundAmount).toBe(354375);
    });

    it("returns remaining_payment refund when cancelled 24-72 hours before and final paid", () => {
      const booking = {
        ...mockBooking,
        start_date: new Date(Date.now() + 86400000 * 1.5), // ~36 hours away
        deposit_paid: true,
        deposit_amount: 354375,
        final_payment_paid: true,
        remaining_payment: 826875,
      };

      const { refundAmount } = controller.calculateRefundAmount(booking);
      expect(refundAmount).toBe(826875);
    });

    it("returns 0 refund when cancelled less than 24 hours before start", () => {
      const booking = {
        ...mockBooking,
        start_date: new Date(Date.now() + 3600000 * 10), // 10 hours away
        deposit_paid: true,
        deposit_amount: 354375,
        final_payment_paid: false,
        remaining_payment: 826875,
      };

      const { refundAmount } = controller.calculateRefundAmount(booking);
      expect(refundAmount).toBe(0);
    });

    it("returns 0 when no payment has been made", () => {
      const booking = {
        ...mockBooking,
        start_date: new Date(Date.now() + 86400000 * 10),
        deposit_paid: false,
        deposit_amount: 354375,
        final_payment_paid: false,
        remaining_payment: 826875,
      };

      const { refundAmount } = controller.calculateRefundAmount(booking);
      expect(refundAmount).toBe(0);
    });
  });

  // ── isActionAllowedByDate ──

  describe("isActionAllowedByDate()", () => {
    let controller;

    beforeAll(() => {
      delete process.env.BYPASS_DATE_CHECK;
      jest.isolateModules(() => {
        controller = require("../controllers/booking_controller");
      });
    });

    it("allows sign_contract on or after start date", () => {
      const booking = {
        ...mockBooking,
        start_date: new Date(Date.now() - 3600000), // 1 hour ago
        end_date: new Date(Date.now() + 86400000 * 3),
      };
      const result = controller.isActionAllowedByDate(booking, "sign_contract");
      expect(result.allowed).toBe(true);
    });

    it("denies sign_contract before start date", () => {
      const booking = {
        ...mockBooking,
        start_date: new Date(Date.now() + 86400000 * 3), // 3 days in future
        end_date: new Date(Date.now() + 86400000 * 6),
      };
      const result = controller.isActionAllowedByDate(booking, "sign_contract");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(
        "Cannot sign_contract before booking date",
      );
    });

    it("allows return on or after end date", () => {
      const booking = {
        ...mockBooking,
        start_date: new Date(Date.now() - 86400000 * 5),
        end_date: new Date(Date.now() - 3600000), // 1 hour ago
      };
      const result = controller.isActionAllowedByDate(booking, "return");
      expect(result.allowed).toBe(true);
    });

    it("denies return before end date", () => {
      const booking = {
        ...mockBooking,
        start_date: new Date(Date.now() - 86400000),
        end_date: new Date(Date.now() + 86400000 * 2), // 2 days in future
      };
      const result = controller.isActionAllowedByDate(booking, "return");
      expect(result.allowed).toBe(false);
    });

    it("bypasses date check when BYPASS_DATE_CHECK=true", () => {
      process.env.BYPASS_DATE_CHECK = "true";
      jest.isolateModules(() => {
        const c = require("../controllers/booking_controller");
        const booking = {
          ...mockBooking,
          start_date: new Date(Date.now() + 86400000 * 10),
          end_date: new Date(Date.now() + 86400000 * 15),
        };
        const result = c.isActionAllowedByDate(booking, "sign_contract");
        expect(result.allowed).toBe(true);
      });
      delete process.env.BYPASS_DATE_CHECK;
    });
  });

  // ── getMyVerification ──

  describe("getMyVerification()", () => {
    let controller;

    beforeEach(() => {
      jest.isolateModules(() => {
        controller = require("../controllers/booking_controller");
      });
    });

    it("returns not verified when no record found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const req = mockReq();
      const res = mockRes();

      await controller.getMyVerification(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ isVerified: false, needsVerification: true }),
      );
    });

    it("returns verification details when record found", async () => {
      const verificationRow = {
        is_verified: true,
        license_verified: true,
        selfies_verified: true,
        license_full_name: "John Doe",
        license_number: "ABC123",
        license_expiry_date: new Date(Date.now() + 86400000 * 365),
        license_front_photo: "front.jpg",
        license_back_photo: "back.jpg",
        front_selfie: "front_selfie.jpg",
        left_selfie: "left_selfie.jpg",
        right_selfie: "right_selfie.jpg",
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockQuery.mockResolvedValueOnce({ rows: [verificationRow] });

      const req = mockReq();
      const res = mockRes();

      await controller.getMyVerification(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ isVerified: true }),
      );
    });

    it("calls next with error on DB failure", async () => {
      const error = new Error("DB error");
      mockQuery.mockRejectedValueOnce(error);

      const req = mockReq();
      const res = mockRes();

      await controller.getMyVerification(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ── getMyBookings ──

  describe("getMyBookings()", () => {
    let controller;

    beforeEach(() => {
      jest.isolateModules(() => {
        controller = require("../controllers/booking_controller");
      });
    });

    it("returns paginated bookings list", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockBooking] }) // bookings query
        .mockResolvedValueOnce({ rows: [{ count: "1" }] }); // count query

      vehicleGrpcClient.getVehiclesInfo.mockResolvedValueOnce([mockVehicle]);

      const req = mockReq({ query: { status: "all", page: 1, limit: 10 } });
      const res = mockRes();

      await controller.getMyBookings(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          bookings: expect.any(Array),
          pagination: expect.objectContaining({ total: 1, page: 1, limit: 10 }),
        }),
      );
    });

    it("filters bookings by status", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] });

      vehicleGrpcClient.getVehiclesInfo.mockResolvedValueOnce([]);

      const req = mockReq({
        query: { status: "completed", page: 1, limit: 10 },
      });
      const res = mockRes();

      await controller.getMyBookings(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ bookings: [] }),
      );
    });
  });

  // ── cancelBooking ──

  describe("cancelBooking()", () => {
    let controller;

    beforeEach(() => {
      jest.clearAllMocks();
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          // SELECT booking
          rows: [
            {
              ...mockBooking,
              status: "pending",
              start_date: new Date(Date.now() + 86400000 * 5),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE bookings
        .mockResolvedValueOnce(undefined); // COMMIT

      jest.isolateModules(() => {
        controller = require("../controllers/booking_controller");
      });
    });

    it("cancels a pending booking successfully", async () => {
      vehicleGrpcClient.getVehicleInfo.mockResolvedValueOnce(mockVehicle);
      vehicleGrpcClient.syncUnavailability.mockResolvedValueOnce({
        success: true,
      });
      userGrpcClient.getUserProfile
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce(mockOwner);

      const req = mockReq({
        params: { id: MOCK_BOOKING_ID },
        body: { reason: "Change of plans" },
      });
      const res = mockRes();

      await controller.cancelBooking(req, res, mockNext);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Booking cancelled successfully" }),
      );
    });

    it("returns 404 when booking not found", async () => {
      mockClient.query
        .mockReset()
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT returns empty

      jest.isolateModules(() => {
        controller = require("../controllers/booking_controller");
      });

      const req = mockReq({
        params: { id: "non-existent-id" },
        body: { reason: "Test" },
      });
      const res = mockRes();

      await controller.cancelBooking(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 when trying to cancel a completed booking", async () => {
      mockClient.query
        .mockReset()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [{ ...mockBooking, status: "completed" }],
        });

      jest.isolateModules(() => {
        controller = require("../controllers/booking_controller");
      });

      const req = mockReq({
        params: { id: MOCK_BOOKING_ID },
        body: { reason: "Test" },
      });
      const res = mockRes();

      await controller.cancelBooking(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── payFinalPayment ──

  describe("payFinalPayment()", () => {
    let controller;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.isolateModules(() => {
        controller = require("../controllers/booking_controller");
      });
    });

    it("returns 404 when booking not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const req = mockReq({
        params: { id: MOCK_BOOKING_ID },
        body: { provider: "vnpay" },
      });
      const res = mockRes();

      await controller.payFinalPayment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 when final payment already completed", async () => {
      // FIX: Must include contract_signed_at so the controller reaches
      // the final_payment_paid check (contract check comes first in the code)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...mockBooking,
            contract_signed_at: new Date(), // signed, so we pass that guard
            final_payment_paid: true, // already paid → expect 400
          },
        ],
      });

      const req = mockReq({
        params: { id: MOCK_BOOKING_ID },
        body: { provider: "vnpay" },
      });
      const res = mockRes();

      await controller.payFinalPayment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Final payment already completed" }),
      );
    });

    it("returns 400 when contract not signed", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...mockBooking,
            contract_signed_at: null,
            final_payment_paid: false,
          },
        ],
      });

      const req = mockReq({
        params: { id: MOCK_BOOKING_ID },
        body: { provider: "vnpay" },
      });
      const res = mockRes();

      await controller.payFinalPayment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Contract must be signed before paying final payment",
        }),
      );
    });

    it("creates final payment intent successfully", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...mockBooking,
            contract_signed_at: new Date(),
            final_payment_paid: false,
          },
        ],
      });

      paymentGrpcClient.createFinalPaymentIntent.mockResolvedValueOnce({
        intent_id: "pi_test_123",
        client_secret: "cs_test_123",
        payment_url: "https://vnpay.vn/pay/123",
        status: "pending",
      });

      const req = mockReq({
        params: { id: MOCK_BOOKING_ID },
        body: { provider: "vnpay" },
      });
      const res = mockRes();

      await controller.payFinalPayment(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payment: expect.objectContaining({ intentId: "pi_test_123" }),
        }),
      );
    });
  });
});

// ── 2. OwnerBookingController ─────────────────────────────────────────────────

describe("OwnerBookingController", () => {
  let ownerController;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      ownerController = require("../controllers/owner_booking_controller");
    });
  });

  describe("acceptBooking()", () => {
    it("returns 403 when non-owner tries to accept", async () => {
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [mockBooking] });

      const req = mockReq({
        user: { userId: MOCK_USER_ID, role: "customer" },
        params: { id: MOCK_BOOKING_ID },
      });
      const res = mockRes();

      await ownerController.acceptBooking(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 400 when booking is not in pending status", async () => {
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [{ ...mockBooking, status: "booking" }],
        });

      vehicleGrpcClient.checkVehicleOwnership.mockResolvedValueOnce({
        is_owner: true,
      });

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_BOOKING_ID },
      });
      const res = mockRes();

      await ownerController.acceptBooking(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Cannot accept"),
        }),
      );
    });

    it("accepts a pending booking successfully", async () => {
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ ...mockBooking, status: "pending" }],
        }) // SELECT
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      vehicleGrpcClient.checkVehicleOwnership.mockResolvedValueOnce({
        is_owner: true,
      });
      vehicleGrpcClient.getVehicleInfo.mockResolvedValueOnce(mockVehicle);
      userGrpcClient.getUserProfile.mockResolvedValueOnce(mockCustomer);

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_BOOKING_ID },
      });
      const res = mockRes();

      await ownerController.acceptBooking(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Booking accepted successfully",
          bookingStatus: "booking",
        }),
      );
    });
  });

  describe("rejectBooking()", () => {
    it("returns 400 when reason is missing", async () => {
      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce(undefined); // BEGIN

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_BOOKING_ID },
        body: { reason: "", refundAmount: 0 },
      });
      const res = mockRes();

      await ownerController.rejectBooking(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Please provide a reason for rejection",
        }),
      );
    });

    it("returns 400 when refund exceeds deposit", async () => {
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [{ ...mockBooking, status: "pending", deposit_paid: true }],
        });

      vehicleGrpcClient.checkVehicleOwnership.mockResolvedValueOnce({
        is_owner: true,
      });

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_BOOKING_ID },
        body: { reason: "Not available", refundAmount: 9999999 },
      });
      const res = mockRes();

      await ownerController.rejectBooking(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Refund amount cannot exceed deposit"),
        }),
      );
    });
  });

  describe("confirmReturn()", () => {
    it("returns 400 when fewer than 3 photos provided", async () => {
      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce(undefined); // BEGIN

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_BOOKING_ID },
        body: {
          conditionPhotos: ["photo1.jpg", "photo2.jpg"], // only 2
          conditionNotes: "Good condition",
          damagesReported: false,
          odometerReading: 45500,
          action: "complete",
        },
      });
      const res = mockRes();

      await ownerController.confirmReturn(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for invalid action value", async () => {
      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce(undefined);

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_BOOKING_ID },
        body: {
          conditionPhotos: ["p1.jpg", "p2.jpg", "p3.jpg"],
          conditionNotes: "Good",
          damagesReported: false,
          odometerReading: 45500,
          action: "invalid_action",
        },
      });
      const res = mockRes();

      await ownerController.confirmReturn(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Action must be either 'complete' or 'dispute'",
        }),
      );
    });
  });
});

// ── 3. AdminBookingController ─────────────────────────────────────────────────

describe("AdminBookingController", () => {
  let adminController;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      adminController = require("../controllers/admin_booking_controller");
    });
  });

  describe("getAllBookings()", () => {
    it("returns paginated booking list with default params", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "5" }] }) // count query
        .mockResolvedValueOnce({ rows: [mockBooking] }); // data query

      const req = mockReq({ query: {} });
      const res = mockRes();

      await adminController.getAllBookings(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({ total: 5 }),
        }),
      );
    });

    it("applies status filter correctly", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "2" }] })
        .mockResolvedValueOnce({ rows: [] });

      const req = mockReq({ query: { status: "pending" } });
      const res = mockRes();

      await adminController.getAllBookings(req, res, mockNext);

      expect(mockQuery).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("returns 400 for invalid date range (custom filter without dates)", async () => {
      const req = mockReq({ query: { filter: "custom" } }); // missing startDate/endDate
      const res = mockRes();

      await adminController.getAllBookings(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getBookingDetails()", () => {
    it("returns 404 when booking not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const req = mockReq({ params: { id: "non-existent-id" } });
      const res = mockRes();

      await adminController.getBookingDetails(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Booking not found" }),
      );
    });

    it("returns booking details with vehicle and customer info", async () => {
      const bookingRow = {
        ...mockBooking,
        pickup_location: JSON.stringify({ address: "123 Test" }),
        dropoff_location: JSON.stringify({ address: "456 Test" }),
        platform_contract_url: null,
        owner_contract_url: null,
        signed_contract_url: null,
        contract_signed_at: null,
        owner_approved_at: null,
        pickup_confirmed_at: null,
        return_confirmed_at: null,
      };
      mockQuery.mockResolvedValueOnce({ rows: [bookingRow] });

      vehicleGrpcClient.getVehicleInfo.mockResolvedValueOnce(mockVehicle);
      userGrpcClient.getUserProfile.mockResolvedValueOnce(mockCustomer);

      const req = mockReq({ params: { id: MOCK_BOOKING_ID } });
      const res = mockRes();

      await adminController.getBookingDetails(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          booking: expect.objectContaining({
            id: MOCK_BOOKING_ID,
            status: "booking",
          }),
        }),
      );
    });
  });

  describe("getEnhancedStats()", () => {
    it("returns stats for all_time filter", async () => {
      const statsRow = {
        total_bookings: "100",
        pending_payment: "10",
        pending: "15",
        booking: "20",
        picked_up: "5",
        return_submitted: "3",
        completed: "40",
        cancelled: "7",
        dispute_opened: "0",
        total_revenue: "50000000",
        total_deposits: "15000000",
        avg_duration: "3.5",
        avg_booking_amount: "500000",
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [statsRow] }) // stats
        .mockResolvedValueOnce({ rows: [] }) // top vehicles
        .mockResolvedValueOnce({ rows: [] }); // top customers

      const req = mockReq({ query: { filter: "all_time" } });
      const res = mockRes();

      await adminController.getEnhancedStats(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          overview: expect.objectContaining({
            totalBookings: 100,
            totalRevenue: 50000000,
          }),
          byStatus: expect.objectContaining({
            completed: 40,
            cancelled: 7,
          }),
        }),
      );
    });
  });
});

// ── 4. Pagination Middleware ──────────────────────────────────────────────────

describe("Pagination Middleware", () => {
  const {
    parseDateFilter,
    parseSortParams,
    parseStatusFilter,
    buildPaginationResponse,
  } = require("../middleware/pagination");

  describe("parseDateFilter()", () => {
    it("returns null for all_time filter", () => {
      const result = parseDateFilter("all_time");
      expect(result).toBeNull();
    });

    it("returns today's date range for today filter", () => {
      const result = parseDateFilter("today");
      const today = new Date();
      expect(result).not.toBeNull();
      expect(result.startDate.getDate()).toBe(today.getDate());
      expect(result.endDate.getHours()).toBe(23);
    });

    it("returns this_month range correctly", () => {
      const result = parseDateFilter("this_month");
      const now = new Date();
      expect(result.startDate.getDate()).toBe(1);
      expect(result.startDate.getMonth()).toBe(now.getMonth());
    });

    it("throws when custom filter is missing dates", () => {
      expect(() => parseDateFilter("custom")).toThrow(
        "startDate and endDate are required for custom date range",
      );
    });

    it("throws when startDate > endDate for custom filter", () => {
      expect(() =>
        parseDateFilter("custom", "2025-12-31", "2025-01-01"),
      ).toThrow("startDate must be before endDate");
    });

    it("returns valid range for custom filter with valid dates", () => {
      const result = parseDateFilter("custom", "2025-01-01", "2025-12-31");
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate.getFullYear()).toBe(2025);
    });
  });

  describe("parseSortParams()", () => {
    it("defaults to created_at DESC for unknown sortBy", () => {
      const { field, order } = parseSortParams("invalid");
      expect(field).toBe("created_at");
      expect(order).toBe("DESC");
    });

    it("returns correct field for amount sortBy", () => {
      const { field } = parseSortParams("amount");
      expect(field).toBe("total_amount");
    });

    it("returns ASC when sortOrder is asc", () => {
      const { order } = parseSortParams("recently", "asc");
      expect(order).toBe("ASC");
    });
  });

  describe("parseStatusFilter()", () => {
    it("returns null for all", () => {
      expect(parseStatusFilter("all")).toBeNull();
    });

    it("returns null for empty input", () => {
      expect(parseStatusFilter("")).toBeNull();
    });

    it("expands ongoing to booking and picked_up", () => {
      const result = parseStatusFilter("ongoing");
      expect(result).toContain("booking");
      expect(result).toContain("picked_up");
    });

    it("expands waiting to pending_payment and pending", () => {
      const result = parseStatusFilter("waiting");
      expect(result).toContain("pending_payment");
      expect(result).toContain("pending");
    });

    it("handles comma-separated statuses", () => {
      const result = parseStatusFilter("pending,completed,cancelled");
      expect(result).toContain("pending");
      expect(result).toContain("completed");
      expect(result).toContain("cancelled");
    });

    it("deduplicates statuses", () => {
      const result = parseStatusFilter("ongoing,booking"); // booking appears twice
      const uniqueBookingCount = result.filter((s) => s === "booking").length;
      expect(uniqueBookingCount).toBe(1);
    });
  });

  describe("buildPaginationResponse()", () => {
    it("builds correct pagination metadata", () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = buildPaginationResponse(data, 50, 2, 10);

      expect(result.pagination.total).toBe(50);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(true);
    });

    it("correctly reports no next page on last page", () => {
      const result = buildPaginationResponse([], 20, 2, 10);
      expect(result.pagination.hasNext).toBe(false);
    });

    it("correctly reports no previous page on first page", () => {
      const result = buildPaginationResponse([], 20, 1, 10);
      expect(result.pagination.hasPrevious).toBe(false);
    });
  });
});

// ── 5. Auth Middleware ────────────────────────────────────────────────────────

describe("Auth Middleware", () => {
  const jwt = require("jsonwebtoken");

  let authenticate, requireAdmin, requireOwner;

  beforeEach(() => {
    process.env.JWT_SECRET = "test_secret";
    jest.isolateModules(() => {
      ({
        authenticate,
        requireAdmin,
        requireOwner,
      } = require("../middleware/auth"));
    });
  });

  describe("authenticate()", () => {
    it("returns 401 when no Authorization header provided", () => {
      const req = { headers: {} };
      const res = mockRes();
      authenticate(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 401 when token is invalid", () => {
      const req = { headers: { authorization: "Bearer invalid_token" } };
      const res = mockRes();
      authenticate(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("calls next and sets req.user on valid token", () => {
      const payload = { userId: MOCK_USER_ID, role: "customer" };
      const token = jwt.sign(payload, "test_secret");
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();

      authenticate(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.user).toMatchObject(payload);
    });
  });

  describe("requireAdmin()", () => {
    it("returns 403 when user is not admin", () => {
      const req = { user: { userId: MOCK_USER_ID, role: "customer" } };
      const res = mockRes();
      requireAdmin(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("calls next when user is admin", () => {
      const req = { user: { userId: MOCK_USER_ID, role: "admin" } };
      const res = mockRes();
      requireAdmin(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("returns 401 when user not set", () => {
      const req = {};
      const res = mockRes();
      requireAdmin(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("requireOwner()", () => {
    it("returns 403 when user is a plain customer", () => {
      const req = { user: { userId: MOCK_USER_ID, role: "customer" } };
      const res = mockRes();
      requireOwner(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("calls next when user is owner", () => {
      const req = { user: { userId: MOCK_OWNER_ID, role: "owner" } };
      const res = mockRes();
      requireOwner(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("calls next when user is admin (admin can do owner actions)", () => {
      const req = { user: { userId: MOCK_USER_ID, role: "admin" } };
      const res = mockRes();
      requireOwner(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});

// ── 6. BookingGrpcServer ──────────────────────────────────────────────────────

describe("BookingGrpcServer", () => {
  let grpcServer;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      const BookingGrpcServer = require("../grpc/booking_grpc_server");
      grpcServer = new BookingGrpcServer();
    });
  });

  describe("verifyBookingForReview()", () => {
    it("returns valid=false when booking not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const call = {
        request: { booking_id: "unknown-id", user_id: MOCK_USER_ID },
      };
      const callback = jest.fn();

      await grpcServer.verifyBookingForReview(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ valid: false }),
      );
    });

    it("returns valid=false when booking status is not eligible", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { ...mockBooking, status: "pending", customer_id: MOCK_USER_ID },
        ],
      });

      const call = {
        request: { booking_id: MOCK_BOOKING_ID, user_id: MOCK_USER_ID },
      };
      const callback = jest.fn();

      await grpcServer.verifyBookingForReview(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ valid: false }),
      );
    });

    it("returns valid=true for completed booking by correct customer", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            booking_id: MOCK_BOOKING_ID,
            customer_id: MOCK_USER_ID,
            vehicle_id: MOCK_VEHICLE_ID,
            status: "completed",
          },
        ],
      });

      const call = {
        request: { booking_id: MOCK_BOOKING_ID, user_id: MOCK_USER_ID },
      };
      const callback = jest.fn();

      await grpcServer.verifyBookingForReview(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          valid: true,
          is_customer: true,
          is_completed: true,
        }),
      );
    });
  });

  describe("updateBookingAfterDepositPayment()", () => {
    it("updates booking status to pending after deposit", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            booking_id: MOCK_BOOKING_ID,
            status: "pending",
            deposit_paid: true,
          },
        ],
      });

      const call = {
        request: { booking_id: MOCK_BOOKING_ID, transaction_id: "tx_123" },
      };
      const callback = jest.fn();

      await grpcServer.updateBookingAfterDepositPayment(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          success: true,
          new_status: "pending",
        }),
      );
    });

    it("handles idempotent update when booking already updated", async () => {
      // First query (UPDATE) returns empty - booking already updated
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              booking_id: MOCK_BOOKING_ID,
              status: "pending",
              deposit_paid: true,
            },
          ],
        });

      const call = {
        request: { booking_id: MOCK_BOOKING_ID, transaction_id: "tx_123" },
      };
      const callback = jest.fn();

      await grpcServer.updateBookingAfterDepositPayment(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ success: true }),
      );
    });
  });
});

// ── 7. EventPublisher ─────────────────────────────────────────────────────────

describe("EventPublisher", () => {
  // The top-level jest.mock("../utils/eventPublisher") replaced it with a fake.
  // We need the REAL implementation here, so use jest.requireActual.
  // We also need the SAME rabbitmq mock instance that the real eventPublisher
  // will use internally — that's the one registered by the top-level jest.mock.
  const rabbitmq = require("../config/rabbitmq");
  const eventPublisher = jest.requireActual("../utils/eventPublisher");

  const sharedChannel = {
    publish: jest.fn(() => true),
    assertQueue: jest.fn(),
    bindQueue: jest.fn(),
    consume: jest.fn(),
    ack: jest.fn(),
    nack: jest.fn(),
  };

  beforeEach(() => {
    sharedChannel.publish.mockClear();
    rabbitmq.getChannel.mockReturnValue(sharedChannel);
  });

  it("publishes booking.created event with correct data", async () => {
    await eventPublisher.bookingCreated(mockBooking, mockVehicle, mockCustomer);

    expect(sharedChannel.publish).toHaveBeenCalledWith(
      "wiz.events",
      "booking.created",
      expect.any(Buffer),
      expect.objectContaining({ persistent: true }),
    );
  });

  it("returns false when RabbitMQ channel is not available", async () => {
    rabbitmq.getChannel.mockReturnValueOnce(null);

    const result = await eventPublisher.bookingCreated(
      mockBooking,
      mockVehicle,
      mockCustomer,
    );
    expect(result).toBeFalsy();
  });
});
