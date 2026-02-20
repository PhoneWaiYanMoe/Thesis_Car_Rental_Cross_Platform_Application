// Backend/vehicle-service/src/tests/vehicle-service.test.js
// Unit tests for Vehicle Service
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
jest.mock("../grpc/user_grpc_client", () => ({
  getUserProfile: jest.fn(),
  getUserProfiles: jest.fn(),
  getUserProfileSafe: jest.fn(),
  getUserProfilesSafe: jest.fn(),
}));

// Mock event emitter
jest.mock("../utils/eventEmitter", () => ({
  emit: jest.fn().mockResolvedValue(true),
  connect: jest.fn().mockResolvedValue(true),
  subscribe: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
}));

// ==================== IMPORT MODULES AFTER MOCKS ====================

const userGrpcClient = require("../grpc/user_grpc_client");
const pool = require("../config/database");
const eventEmitter = require("../utils/eventEmitter");

// ==================== TEST DATA ====================

const MOCK_OWNER_ID = "550e8400-e29b-41d4-a716-446655440010";
const MOCK_ADMIN_ID = "550e8400-e29b-41d4-a716-446655440099";
const MOCK_VEHICLE_ID = uuidv4();
const MOCK_VERIFICATION_ID = uuidv4();

const mockVehicleRow = {
  vehicle_id: MOCK_VEHICLE_ID,
  owner_id: MOCK_OWNER_ID,
  name: "Toyota Camry 2022",
  description: "Brand new sedan with low mileage",
  vehicle_type: "sedan",
  transmission: "automatic",
  fuel_type: "gasoline",
  seats: 5,
  year: 2022,
  mileage: 12000,
  license_plate: "51B-67890",
  price_per_day: 375000,
  location: JSON.stringify({
    address: "456 Nguyen Hue, District 1",
    city: "Ho Chi Minh City",
    district: "District 1",
    coordinates: { lat: 10.7752, lng: 106.7003 },
  }),
  features: JSON.stringify(["AC", "GPS", "USB"]),
  rules: JSON.stringify({}),
  driver_supported: false,
  instant_booking: false,
  delivery_available: false,
  total_rentals: 5,
  average_rating: 4.5,
  review_count: 5,
  status: "active",
  verification_status: "approved",
  verification_notes: null,
  last_verified_at: new Date(),
  next_verification_due: new Date(Date.now() + 86400000 * 60),
  total_revenue_earned: 1875000,
  rejection_reason: null,
  banned_reason: null,
  created_at: new Date(),
  updated_at: new Date(),
  photos: JSON.stringify([{ url: "car.jpg", isPrimary: true, order: 1 }]),
  unavailable_periods: null,
  primary_photo: "car.jpg",
};

const mockOwnerProfile = {
  user_id: MOCK_OWNER_ID,
  full_name: "Jane Smith",
  email: "jane@example.com",
  avatar_url: "avatar.jpg",
  role: "owner",
};

// ==================== HELPER: Mock Request/Response ====================

function mockReq(overrides = {}) {
  return {
    user: { userId: MOCK_OWNER_ID, role: "owner" },
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

// ── 1. VehicleController (Public) ────────────────────────────────────────────

describe("VehicleController", () => {
  // Load the controller ONCE at the top level using the module registry mock
  // (no resetModules/isolateModules so the jest.mock() factories stay active)
  let vehicleController;

  beforeAll(() => {
    vehicleController = require("../controllers/vehicle_controller");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    // Reset queued mock return values so stale mocks don't bleed into subsequent tests
    userGrpcClient.getUserProfiles.mockReset();
    userGrpcClient.getUserProfile.mockReset();
  });

  describe("searchVehicles()", () => {
    it("returns vehicles without date filter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockVehicleRow] }) // search query
        .mockResolvedValueOnce({ rows: [{ count: "1" }] }); // count query

      // getUserProfiles resolves with an array of profiles directly
      // (the real client does: resolve(response.users || []) )
      userGrpcClient.getUserProfiles.mockResolvedValueOnce([mockOwnerProfile]);

      const req = mockReq({ query: {} });
      const res = mockRes();

      await vehicleController.searchVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicles: expect.arrayContaining([
            expect.objectContaining({
              id: MOCK_VEHICLE_ID,
              name: "Toyota Camry 2022",
              ownerName: "Jane Smith",
            }),
          ]),
          pagination: expect.objectContaining({ total: 1, page: 1, limit: 20 }),
        }),
      );
    });

    it("applies vehicleType filter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] });

      // No vehicles returned → getUserProfiles is never called, so no gRPC mock needed
      const req = mockReq({ query: { vehicleType: "suv" } });
      const res = mockRes();

      await vehicleController.searchVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicles: [],
          pagination: expect.objectContaining({ total: 0 }),
        }),
      );
    });

    it("applies price range filters", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockVehicleRow] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] });

      userGrpcClient.getUserProfiles.mockResolvedValueOnce([mockOwnerProfile]);

      const req = mockReq({
        query: { minPrice: "200000", maxPrice: "500000" },
      });
      const res = mockRes();

      await vehicleController.searchVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicles: expect.arrayContaining([
            expect.objectContaining({ pricePerDay: 375000 }),
          ]),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      );
    });

    it("falls back to default owner info when gRPC fails", async () => {
      userGrpcClient.getUserProfiles.mockRejectedValueOnce(
        new Error("gRPC error"),
      );
      if (userGrpcClient.getUserProfilesSafe) {
        userGrpcClient.getUserProfilesSafe.mockRejectedValueOnce(
          new Error("gRPC error"),
        );
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [mockVehicleRow] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] });

      const req = mockReq({ query: {} });
      const res = mockRes();

      await vehicleController.searchVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicles: expect.arrayContaining([
            expect.objectContaining({
              ownerName: "Vehicle Owner",
              ownerAvatar: "assets/images/article_2.png",
            }),
          ]),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      );
    });

    it("applies city filter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] });

      // No vehicles returned → getUserProfiles is never called, so no gRPC mock needed
      const req = mockReq({ query: { city: "Ho Chi Minh City" } });
      const res = mockRes();

      await vehicleController.searchVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicles: [],
          pagination: expect.objectContaining({ total: 0 }),
        }),
      );
    });

    it("handles DB error gracefully", async () => {
      mockQuery.mockRejectedValueOnce(new Error("DB connection failed"));

      const req = mockReq({ query: {} });
      const res = mockRes();

      await vehicleController.searchVehicles(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("getVehicleById()", () => {
    it("returns vehicle details with owner info", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockVehicleRow] });
      userGrpcClient.getUserProfile.mockResolvedValueOnce(mockOwnerProfile);

      const req = mockReq({ params: { id: MOCK_VEHICLE_ID } });
      const res = mockRes();

      await vehicleController.getVehicleById(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicle: expect.objectContaining({
            id: MOCK_VEHICLE_ID,
            ownerName: "Jane Smith",
          }),
        }),
      );
    });

    it("returns 404 when vehicle not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const req = mockReq({ params: { id: "non-existent-id" } });
      const res = mockRes();

      await vehicleController.getVehicleById(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Vehicle not found or not available",
        }),
      );
    });

    it("falls back to default owner info when gRPC fails", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockVehicleRow] });
      userGrpcClient.getUserProfile.mockRejectedValueOnce(
        new Error("gRPC unavailable"),
      );

      const req = mockReq({ params: { id: MOCK_VEHICLE_ID } });
      const res = mockRes();

      await vehicleController.getVehicleById(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicle: expect.objectContaining({ ownerName: "Vehicle Owner" }),
        }),
      );
    });
  });

  describe("checkAvailability()", () => {
    it("returns 400 when dates not provided", async () => {
      const req = mockReq({ params: { id: MOCK_VEHICLE_ID }, query: {} });
      const res = mockRes();

      await vehicleController.checkAvailability(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "startDate and endDate are required",
        }),
      );
    });

    it("returns 404 when vehicle not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const req = mockReq({
        params: { id: MOCK_VEHICLE_ID },
        query: { startDate: "2026-03-01", endDate: "2026-03-05" },
      });
      const res = mockRes();

      await vehicleController.checkAvailability(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns isAvailable=true when no conflicts found", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              vehicle_id: MOCK_VEHICLE_ID,
              name: "Camry",
              price_per_day: 375000,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      const req = mockReq({
        params: { id: MOCK_VEHICLE_ID },
        query: { startDate: "2026-03-01", endDate: "2026-03-05" },
      });
      const res = mockRes();

      await vehicleController.checkAvailability(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ isAvailable: true }),
      );
    });

    it("returns isAvailable=false when conflicts exist", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              vehicle_id: MOCK_VEHICLE_ID,
              name: "Camry",
              price_per_day: 375000,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              start_date: "2026-03-02",
              end_date: "2026-03-04",
              reason: "Booking",
            },
          ],
        });

      const req = mockReq({
        params: { id: MOCK_VEHICLE_ID },
        query: { startDate: "2026-03-01", endDate: "2026-03-05" },
      });
      const res = mockRes();

      await vehicleController.checkAvailability(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: false,
          unavailablePeriods: expect.any(Array),
        }),
      );
    });
  });
});

// ── 2. OwnerVehicleController ─────────────────────────────────────────────────

describe("OwnerVehicleController", () => {
  let ownerController;

  beforeAll(() => {
    ownerController = require("../controllers/owner_vehicle_controller");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
  });

  describe("createVehicle()", () => {
    const validVehicleBody = {
      name: "Honda HR-V 2023",
      description: "Compact SUV in great condition",
      vehicleType: "suv",
      transmission: "automatic",
      fuelType: "gasoline",
      seats: 5,
      year: 2023,
      mileage: 5000,
      licensePlate: "51A-99999",
      pricePerDay: 400000,
      location: {
        address: "789 Test Street",
        city: "Ho Chi Minh City",
        district: "District 3",
        coordinates: { lat: 10.77, lng: 106.7 },
      },
      features: ["AC", "GPS"],
      rules: { noSmoking: true },
      driverSupported: false,
      instantBooking: true,
      deliveryAvailable: false,
      photoIds: ["photo1.jpg", "photo2.jpg"],
    };

    it("returns 403 when non-owner tries to create vehicle", async () => {
      const req = mockReq({
        user: { userId: "user-id", role: "customer" },
        body: validVehicleBody,
      });
      const res = mockRes();

      mockClient.query.mockResolvedValueOnce(undefined); // BEGIN

      await ownerController.createVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("creates a vehicle successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // INSERT vehicles
        .mockResolvedValueOnce({ rows: [] }) // INSERT photo 1
        .mockResolvedValueOnce({ rows: [] }) // INSERT photo 2
        .mockResolvedValueOnce(undefined); // COMMIT

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        body: validVehicleBody,
      });
      const res = mockRes();

      await ownerController.createVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vehicle created successfully",
          status: "active",
          verificationStatus: "unverified",
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "vehicle.created",
        expect.objectContaining({ ownerId: MOCK_OWNER_ID }),
      );
    });

    it("returns 400 on duplicate license plate", async () => {
      const dupError = new Error("duplicate key");
      dupError.code = "23505";

      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(dupError); // INSERT throws

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        body: validVehicleBody,
      });
      const res = mockRes();

      await ownerController.createVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "License plate already exists" }),
      );
    });
  });

  describe("updateVehicle()", () => {
    it("returns 404 when vehicle not found", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] });

      const req = mockReq({
        params: { id: MOCK_VEHICLE_ID },
        body: { name: "Updated Name" },
      });
      const res = mockRes();

      await ownerController.updateVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 403 when user doesn't own the vehicle", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ owner_id: "different-owner-id" }] });

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_VEHICLE_ID },
        body: { name: "Updated Name" },
      });
      const res = mockRes();

      await ownerController.updateVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 400 when no fields to update", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ owner_id: MOCK_OWNER_ID }] });

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_VEHICLE_ID },
        body: {},
      });
      const res = mockRes();

      await ownerController.updateVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "No fields to update" }),
      );
    });

    it("updates vehicle successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ owner_id: MOCK_OWNER_ID }] }) // ownership check
        .mockResolvedValueOnce({
          rows: [
            {
              vehicle_id: MOCK_VEHICLE_ID,
              name: "Updated Name",
              status: "active",
            },
          ],
        }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_VEHICLE_ID },
        body: { name: "Updated Name", pricePerDay: 450000 },
      });
      const res = mockRes();

      await ownerController.updateVehicle(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Vehicle updated successfully" }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "vehicle.updated",
        expect.objectContaining({ vehicleId: MOCK_VEHICLE_ID }),
      );
    });
  });

  describe("deleteVehicle()", () => {
    it("soft-deletes vehicle by setting status to stopped", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [{ owner_id: MOCK_OWNER_ID, status: "active" }],
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_VEHICLE_ID },
      });
      const res = mockRes();

      await ownerController.deleteVehicle(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Vehicle deleted successfully" }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "vehicle.status_changed",
        expect.objectContaining({ newStatus: "stopped" }),
      );
    });

    it("returns 403 when user doesn't own vehicle", async () => {
      mockClient.query.mockResolvedValueOnce(undefined).mockResolvedValueOnce({
        rows: [{ owner_id: "other-owner", status: "active" }],
      });

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { id: MOCK_VEHICLE_ID },
      });
      const res = mockRes();

      await ownerController.deleteVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("getMyVehicles()", () => {
    it("returns paginated list of owner's vehicles", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockVehicleRow] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] });

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        query: { page: 1, limit: 10 },
      });
      const res = mockRes();

      await ownerController.getMyVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicles: expect.arrayContaining([
            expect.objectContaining({ id: MOCK_VEHICLE_ID }),
          ]),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      );
    });

    it("filters by status", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] });

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        query: { status: "stopped" },
      });
      const res = mockRes();

      await ownerController.getMyVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ vehicles: [] }),
      );
    });
  });

  describe("submitVerificationPhotos()", () => {
    it("returns 400 when no photos provided", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ owner_id: MOCK_OWNER_ID }] });

      const req = mockReq({
        params: { id: MOCK_VEHICLE_ID },
        body: { photoUrls: [] },
      });
      const res = mockRes();

      await ownerController.submitVerificationPhotos(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("submits verification photos successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ owner_id: MOCK_OWNER_ID }] }) // ownership
        .mockResolvedValueOnce({ rows: [] }) // INSERT verification
        .mockResolvedValueOnce({ rows: [] }) // UPDATE vehicle status
        .mockResolvedValueOnce(undefined); // COMMIT

      const req = mockReq({
        params: { id: MOCK_VEHICLE_ID },
        body: { photoUrls: ["front.jpg", "side.jpg", "back.jpg"] },
      });
      const res = mockRes();

      await ownerController.submitVerificationPhotos(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Verification photos submitted. Pending admin approval.",
        }),
      );
    });
  });
});

// ── 3. AdminVehicleController ─────────────────────────────────────────────────

describe("AdminVehicleController", () => {
  let adminController;

  beforeAll(() => {
    adminController = require("../controllers/admin_vehicle_controller");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
  });

  describe("getAllVehicles()", () => {
    it("returns paginated vehicle list", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockVehicleRow] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] });

      const req = mockReq({ query: {} });
      const res = mockRes();

      await adminController.getAllVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicles: expect.any(Array),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      );
    });

    it("applies status filter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] });

      const req = mockReq({ query: { status: "banned" } });
      const res = mockRes();

      await adminController.getAllVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ vehicles: [] }),
      );
    });

    it("applies search filter", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockVehicleRow] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] });

      const req = mockReq({ query: { search: "Camry" } });
      const res = mockRes();

      await adminController.getAllVehicles(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ vehicles: expect.any(Array) }),
      );
    });
  });

  describe("approveVehicle()", () => {
    it("returns 404 when vehicle not found", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] });

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VEHICLE_ID },
      });
      const res = mockRes();

      await adminController.approveVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 when vehicle is not in pending status", async () => {
      mockClient.query.mockResolvedValueOnce(undefined).mockResolvedValueOnce({
        rows: [{ ...mockVehicleRow, status: "active" }],
      });

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VEHICLE_ID },
      });
      const res = mockRes();

      await adminController.approveVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Cannot approve"),
        }),
      );
    });

    it("approves a pending vehicle", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ ...mockVehicleRow, status: "pending" }],
        }) // SELECT
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VEHICLE_ID },
      });
      const res = mockRes();

      await adminController.approveVehicle(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Vehicle approved and now active",
          vehicleId: MOCK_VEHICLE_ID,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "vehicle.status_changed",
        expect.objectContaining({ newStatus: "active" }),
      );
    });
  });

  describe("rejectVehicle()", () => {
    it("returns 400 when reason not provided", async () => {
      mockClient.query.mockResolvedValueOnce(undefined); // BEGIN

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VEHICLE_ID },
        body: {},
      });
      const res = mockRes();

      await adminController.rejectVehicle(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Rejection reason is required" }),
      );
    });

    it("rejects a vehicle with reason", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [mockVehicleRow] }) // SELECT
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VEHICLE_ID },
        body: { reason: "Insufficient documentation" },
      });
      const res = mockRes();

      await adminController.rejectVehicle(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Vehicle listing rejected" }),
      );
    });
  });

  describe("updateVehicleStatus()", () => {
    it("returns 400 for invalid status", async () => {
      mockClient.query.mockResolvedValueOnce(undefined);

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VEHICLE_ID },
        body: { status: "flying" },
      });
      const res = mockRes();

      await adminController.updateVehicleStatus(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("bans a vehicle", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ status: "active" }] }) // old status
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VEHICLE_ID },
        body: { status: "banned", reason: "Fraudulent listing" },
      });
      const res = mockRes();

      await adminController.updateVehicleStatus(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ newStatus: "banned" }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "vehicle.status_changed",
        expect.objectContaining({ newStatus: "banned" }),
      );
    });
  });

  describe("approveVerification()", () => {
    it("returns 404 when verification not found", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] });

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VERIFICATION_ID },
      });
      const res = mockRes();

      await adminController.approveVerification(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 when verification is not pending", async () => {
      mockClient.query.mockResolvedValueOnce(undefined).mockResolvedValueOnce({
        rows: [
          {
            verification_id: MOCK_VERIFICATION_ID,
            verification_status: "approved",
            vehicle_id: MOCK_VEHICLE_ID,
          },
        ],
      });

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VERIFICATION_ID },
      });
      const res = mockRes();

      await adminController.approveVerification(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("approves pending verification", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [
            {
              verification_id: MOCK_VERIFICATION_ID,
              verification_status: "pending",
              vehicle_id: MOCK_VEHICLE_ID,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE verification
        .mockResolvedValueOnce({ rows: [] }) // UPDATE vehicle
        .mockResolvedValueOnce(undefined); // COMMIT

      const req = mockReq({
        user: { userId: MOCK_ADMIN_ID, role: "admin" },
        params: { id: MOCK_VERIFICATION_ID },
      });
      const res = mockRes();

      await adminController.approveVerification(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Verification approved" }),
      );
    });
  });
});

// ── 4. VehicleGrpcServer ──────────────────────────────────────────────────────

describe("VehicleGrpcServer", () => {
  let grpcServer;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      const VehicleGrpcServer = require("../grpc/vehicle_grpc_server");
      grpcServer = new VehicleGrpcServer();
    });
  });

  describe("getVehicleInfo()", () => {
    it("returns vehicle details when found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockVehicleRow] });

      const call = { request: { vehicle_id: MOCK_VEHICLE_ID } };
      const callback = jest.fn();

      await grpcServer.getVehicleInfo(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          vehicle_id: MOCK_VEHICLE_ID,
          owner_id: MOCK_OWNER_ID,
          name: "Toyota Camry 2022",
        }),
      );
    });

    it("returns NOT_FOUND error when vehicle doesn't exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const call = { request: { vehicle_id: "non-existent" } };
      const callback = jest.fn();

      await grpcServer.getVehicleInfo(call, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Vehicle not found" }),
      );
    });
  });

  describe("getVehiclesInfo()", () => {
    it("returns empty array when no ids provided", async () => {
      const call = { request: { vehicle_ids: [] } };
      const callback = jest.fn();

      await grpcServer.getVehiclesInfo(call, callback);

      expect(callback).toHaveBeenCalledWith(null, { vehicles: [] });
    });

    it("returns multiple vehicles", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockVehicleRow] });

      const call = { request: { vehicle_ids: [MOCK_VEHICLE_ID] } };
      const callback = jest.fn();

      await grpcServer.getVehiclesInfo(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          vehicles: expect.arrayContaining([
            expect.objectContaining({ vehicle_id: MOCK_VEHICLE_ID }),
          ]),
        }),
      );
    });
  });

  describe("checkVehicleOwnership()", () => {
    it("returns is_owner=true when user owns vehicle", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ owner_id: MOCK_OWNER_ID }] });

      const call = {
        request: { vehicle_id: MOCK_VEHICLE_ID, user_id: MOCK_OWNER_ID },
      };
      const callback = jest.fn();

      await grpcServer.checkVehicleOwnership(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ is_owner: true }),
      );
    });

    it("returns is_owner=false when user doesn't own vehicle", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ owner_id: "other-owner" }] });

      const call = {
        request: { vehicle_id: MOCK_VEHICLE_ID, user_id: MOCK_OWNER_ID },
      };
      const callback = jest.fn();

      await grpcServer.checkVehicleOwnership(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ is_owner: false }),
      );
    });

    it("returns is_owner=false when vehicle not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const call = {
        request: { vehicle_id: "unknown", user_id: MOCK_OWNER_ID },
      };
      const callback = jest.fn();

      await grpcServer.checkVehicleOwnership(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          is_owner: false,
          message: "Vehicle not found",
        }),
      );
    });
  });

  describe("checkAvailability()", () => {
    it("returns is_available=true when no conflicts", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ vehicle_id: MOCK_VEHICLE_ID, name: "Camry" }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const call = {
        request: {
          vehicle_id: MOCK_VEHICLE_ID,
          start_date: "2026-03-01",
          end_date: "2026-03-05",
        },
      };
      const callback = jest.fn();

      await grpcServer.checkAvailability(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ is_available: true }),
      );
    });

    it("returns is_available=false when vehicle is unavailable", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ vehicle_id: MOCK_VEHICLE_ID, name: "Camry" }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              start_date: new Date("2026-03-02"),
              end_date: new Date("2026-03-04"),
              reason: "Booking",
            },
          ],
        });

      const call = {
        request: {
          vehicle_id: MOCK_VEHICLE_ID,
          start_date: "2026-03-01",
          end_date: "2026-03-05",
        },
      };
      const callback = jest.fn();

      await grpcServer.checkAvailability(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ is_available: false }),
      );
    });

    it("returns is_available=false when vehicle is not active", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const call = {
        request: {
          vehicle_id: MOCK_VEHICLE_ID,
          start_date: "2026-03-01",
          end_date: "2026-03-05",
        },
      };
      const callback = jest.fn();

      await grpcServer.checkAvailability(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ is_available: false }),
      );
    });
  });

  describe("syncUnavailability()", () => {
    it("adds unavailability period for 'add' action", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const call = {
        request: {
          vehicle_id: MOCK_VEHICLE_ID,
          start_date: "2026-03-01",
          end_date: "2026-03-05",
          booking_id: "booking-123",
          action: "add",
        },
      };
      const callback = jest.fn();

      await grpcServer.syncUnavailability(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ success: true }),
      );
    });

    it("removes unavailability period for 'remove' action", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const call = {
        request: {
          vehicle_id: MOCK_VEHICLE_ID,
          start_date: "2026-03-01",
          end_date: "2026-03-05",
          booking_id: "booking-123",
          action: "remove",
        },
      };
      const callback = jest.fn();

      await grpcServer.syncUnavailability(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ success: true }),
      );
    });

    it("returns INVALID_ARGUMENT for unknown action", async () => {
      const call = {
        request: {
          vehicle_id: MOCK_VEHICLE_ID,
          start_date: "2026-03-01",
          end_date: "2026-03-05",
          booking_id: "booking-123",
          action: "unknown",
        },
      };
      const callback = jest.fn();

      await grpcServer.syncUnavailability(call, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Action must be 'add' or 'remove'",
        }),
      );
    });
  });

  describe("updateVehicleRating()", () => {
    it("updates vehicle rating successfully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const call = {
        request: {
          vehicle_id: MOCK_VEHICLE_ID,
          new_rating: 4.7,
          new_review_count: 10,
        },
      };
      const callback = jest.fn();

      await grpcServer.updateVehicleRating(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          success: true,
          updated_rating: 4.7,
        }),
      );
    });
  });

  describe("incrementTotalRentals()", () => {
    it("increments total rentals successfully", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total_rentals: 21 }] });

      const call = { request: { vehicle_id: MOCK_VEHICLE_ID } };
      const callback = jest.fn();

      await grpcServer.incrementTotalRentals(call, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.objectContaining({
          success: true,
          new_total: 21,
        }),
      );
    });

    it("returns NOT_FOUND when vehicle doesn't exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const call = { request: { vehicle_id: "non-existent" } };
      const callback = jest.fn();

      await grpcServer.incrementTotalRentals(call, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Vehicle not found" }),
      );
    });
  });
});

// ── 5. Analytics Controller ───────────────────────────────────────────────────

describe("AnalyticsVehicleController", () => {
  let analyticsController;

  beforeAll(() => {
    analyticsController = require("../controllers/analytics_vehicle_controller");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getVehicleStats()", () => {
    it("returns platform-wide vehicle statistics", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "50" }] })
        .mockResolvedValueOnce({
          rows: [
            { available: "35", maintenance: "5", stopped: "5", banned: "5" },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { vehicle_type: "sedan", count: "20" },
            { vehicle_type: "suv", count: "30" },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ count: "10" }] })
        .mockResolvedValueOnce({ rows: [{ count: "8" }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "5" }] });

      const req = mockReq({ query: { timeRange: "30d" } });
      const res = mockRes();

      await analyticsController.getVehicleStats(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 50,
          available: 35,
          byStatus: expect.objectContaining({ active: 35 }),
          byType: expect.objectContaining({ sedan: 20, suv: 30 }),
          growth: expect.any(Number),
        }),
      );
    });
  });

  describe("getOwnerVehicleStats()", () => {
    it("returns 403 when non-admin accesses another owner's stats", async () => {
      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { ownerId: "different-owner-id" },
        query: {},
      });
      const res = mockRes();

      await analyticsController.getOwnerVehicleStats(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns own stats for owner", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: "3" }] })
        .mockResolvedValueOnce({
          rows: [{ active: "2", pending: "0", stopped: "1" }],
        })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] })
        .mockResolvedValueOnce({
          rows: [{ avg_rating: "4.3", total_rentals: "10" }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ vehicle_type: "sedan", count: "2" }],
        });

      const req = mockReq({
        user: { userId: MOCK_OWNER_ID, role: "owner" },
        params: { ownerId: MOCK_OWNER_ID },
        query: { timeRange: "30d" },
      });
      const res = mockRes();

      await analyticsController.getOwnerVehicleStats(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalVehicles: 3,
          activeVehicles: 2,
          totalRentals: 10,
        }),
      );
    });
  });
});

// ── 6. Auth Middleware ────────────────────────────────────────────────────────

describe("Vehicle Service Auth Middleware", () => {
  const jwt = require("jsonwebtoken");
  let authenticate, requireOwner, requireAdmin;

  beforeEach(() => {
    process.env.JWT_SECRET = "test_secret";
    jest.isolateModules(() => {
      ({
        authenticate,
        requireOwner,
        requireAdmin,
      } = require("../middleware/auth"));
    });
  });

  describe("authenticate()", () => {
    it("returns 401 when no token provided", () => {
      const req = { headers: {} };
      const res = mockRes();
      authenticate(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("sets req.user on valid token", () => {
      const payload = { userId: MOCK_OWNER_ID, role: "owner" };
      const token = jwt.sign(payload, "test_secret");
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();

      authenticate(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.user).toMatchObject(payload);
    });
  });

  describe("requireOwner()", () => {
    it("allows owner role", () => {
      const req = { user: { role: "owner" } };
      const res = mockRes();
      requireOwner(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("allows admin role", () => {
      const req = { user: { role: "admin" } };
      const res = mockRes();
      requireOwner(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("blocks customer role", () => {
      const req = { user: { role: "customer" } };
      const res = mockRes();
      requireOwner(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("requireAdmin()", () => {
    it("allows admin role", () => {
      const req = { user: { role: "admin" } };
      const res = mockRes();
      requireAdmin(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("allows support role", () => {
      const req = { user: { role: "support" } };
      const res = mockRes();
      requireAdmin(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("blocks owner role from admin routes", () => {
      const req = { user: { role: "owner" } };
      const res = mockRes();
      requireAdmin(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

// ── 7. EventHandlers ──────────────────────────────────────────────────────────

describe("EventHandlers", () => {
  let eventHandlers;

  beforeAll(() => {
    eventHandlers = require("../handlers/eventHandlers");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
  });

  describe("handleVehicleDeactivationApproved()", () => {
    it("sets vehicle status to deactivated", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const event = {
        data: { vehicleId: MOCK_VEHICLE_ID, note: "Owner requested" },
      };
      await eventHandlers.handleVehicleDeactivationApproved(event);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "vehicle.status_changed",
        expect.objectContaining({ newStatus: "deactivated" }),
      );
    });
  });

  describe("handleVehicleBanned()", () => {
    it("bans vehicle via event", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined);

      const event = {
        data: { vehicleId: MOCK_VEHICLE_ID, note: "Policy violation" },
      };
      await eventHandlers.handleVehicleBanned(event);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "vehicle.status_changed",
        expect.objectContaining({ newStatus: "banned" }),
      );
    });
  });

  describe("handleBookingCompleted()", () => {
    it("tracks revenue and increments total", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // INSERT revenue_history
        .mockResolvedValueOnce({ rows: [] }) // UPDATE vehicles
        .mockResolvedValueOnce(undefined); // COMMIT

      const event = {
        data: {
          vehicleId: MOCK_VEHICLE_ID,
          bookingId: "booking-123",
          totalAmount: 1181250,
        },
      };
      await eventHandlers.handleBookingCompleted(event);

      expect(mockClient.query).toHaveBeenCalledTimes(4);
    });
  });

  describe("handleEvent() router", () => {
    it("routes to correct handler based on event type", async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined);

      const event = {
        event: "request.vehicle_banned",
        data: { vehicleId: MOCK_VEHICLE_ID, note: "Fraudulent" },
      };

      await eventHandlers.handleEvent(event);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "vehicle.status_changed",
        expect.objectContaining({ newStatus: "banned" }),
      );
    });

    it("handles unrecognized event types gracefully", async () => {
      const event = { event: "unknown.event.type", data: {} };
      await expect(eventHandlers.handleEvent(event)).resolves.not.toThrow();
    });
  });
});
