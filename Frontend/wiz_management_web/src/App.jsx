import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./components/auth/Login";

// Import pages
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

function AppContent() {
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
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Cars */}
                <Route path="/cars" element={<CarManagement />} />
                <Route path="/cars/:id" element={<CarDetail />} />

                {/* Users */}
                <Route path="/users" element={<UserManagement />} />
                <Route path="/users/:id" element={<UserDetail />} />

                {/* Bookings */}
                <Route path="/bookings" element={<BookingList />} />
                <Route path="/bookings/:id" element={<BookingDetail />} />

                {/* Request Management */}
                <Route path="/requests" element={<RequestList />} />
                <Route path="/requests/:id" element={<RequestDetail />} />

                {/* Staff Management - Admin only */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute requiredPermission="VIEW_STAFF">
                      <StaffManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/:staffId/requests"
                  element={
                    <ProtectedRoute requiredPermission="VIEW_STAFF">
                      <StaffRequests />
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
