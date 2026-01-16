import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./components/auth/Login";

// Import your existing pages
import Dashboard from "./pages/Dashboard";
import CarManagement from "./pages/cars/CarManagement";
import CarDetail from "./pages/cars/CarDetail";
import UserManagement from "./pages/users/UserManagement";
import UserDetail from "./pages/users/UserDetail";
import BookingList from "./pages/bookings/BookingList";
import BookingDetail from "./pages/bookings/BookingDetail";
import RequestList from "./pages/requests/RequestList";
import RequestDetail from "./pages/requests/RequestDetail";
import StaffManagement from "./pages/staff/StaffManagement";
import StaffRequests from "./pages/staff/StaffRequests";

import { generateAllMockData } from "./utils/unifiedMockData";

function AppContent() {
  // Generate all mock data once
  const [mockData] = useState(() => generateAllMockData());
  const [requests, setRequests] = useState(mockData.requests);
  const [carData, setCarData] = useState(mockData.cars);
  const [userData, setUserData] = useState(mockData.users);
  const [staffData, setStaffData] = useState(mockData.staff);
  const [bookingData] = useState(mockData.bookings);
  const [reviewData] = useState(mockData.reviews);

  // Action handlers
  const handleApprove = (requestId) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "approved",
              handledBy: "current_user",
              handledAt: new Date().toISOString(),
            }
          : req
      )
    );
  };

  const handleDeny = (requestId, reason) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "denied",
              handledBy: "current_user",
              handledAt: new Date().toISOString(),
              denialReason: reason,
            }
          : req
      )
    );
  };

  const handleUpdateCarStatus = (carId, status) => {
    setCarData((prev) =>
      prev.map((car) => (car.id === carId ? { ...car, status } : car))
    );
  };

  const handleUpdateUserStatus = (userId, status) => {
    setUserData((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, status } : user))
    );
  };

  const handleCreateStaff = (newStaff) => {
    const staff = {
      id: `STAFF-${String(staffData.length + 1).padStart(4, "0")}`,
      username: newStaff.username,
      email: newStaff.email,
      status: "normal",
      createdDate: new Date().toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0,
    };
    setStaffData((prev) => [...prev, staff]);
  };

  const handleUpdateStaffStatus = (staffId, status) => {
    setStaffData((prev) =>
      prev.map((staff) => (staff.id === staffId ? { ...staff, status } : staff))
    );
  };

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes with Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Default redirect */}
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <Dashboard
                      carData={carData}
                      userData={userData}
                      bookingData={bookingData}
                      requests={requests}
                    />
                  }
                />
                {/* Cars */}
                <Route
                  path="/cars"
                  element={
                    <CarManagement
                      carData={carData}
                      onUpdateCarStatus={handleUpdateCarStatus}
                    />
                  }
                />
                <Route
                  path="/cars/:id"
                  element={
                    <CarDetail
                      carData={carData}
                      onUpdateCarStatus={handleUpdateCarStatus}
                      userData={userData}
                      reviewData={reviewData}
                    />
                  }
                />
                {/* Users */}
                <Route
                  path="/users"
                  element={
                    <UserManagement
                      userData={userData}
                      onUpdateUserStatus={handleUpdateUserStatus}
                    />
                  }
                />
                <Route
                  path="/users/:id"
                  element={
                    <UserDetail
                      userData={userData}
                      onUpdateUserStatus={handleUpdateUserStatus}
                      bookingData={bookingData}
                      carData={carData}
                      reviewData={reviewData}
                    />
                  }
                />
                {/* Bookings */}
                <Route
                  path="/bookings"
                  element={
                    <BookingList
                      bookingData={bookingData}
                      carData={carData}
                      userData={userData}
                    />
                  }
                />
                <Route
                  path="/bookings/:id"
                  element={
                    <BookingDetail
                      bookingData={bookingData}
                      carData={carData}
                      userData={userData}
                    />
                  }
                />

                {/* Request Management */}
                <Route
                  path="/requests"
                  element={<RequestList requests={requests} />}
                />

                <Route
                  path="/requests/:id"
                  element={
                    <RequestDetail
                      requests={requests}
                      onApprove={handleApprove}
                      onDeny={handleDeny}
                      bookingData={bookingData}
                      carData={carData}
                      userData={userData}
                    />
                  }
                />

                {/* Staff Management - Admin only */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute requiredPermission="VIEW_STAFF">
                      <StaffManagement
                        staffData={staffData}
                        onCreateStaff={handleCreateStaff}
                        onUpdateStaffStatus={handleUpdateStaffStatus}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/:staffId/requests"
                  element={
                    <ProtectedRoute requiredPermission="VIEW_STAFF">
                      <StaffRequests
                        requests={requests}
                        staffData={staffData}
                      />
                    </ProtectedRoute>
                  }
                />
                {/* Fallback */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
