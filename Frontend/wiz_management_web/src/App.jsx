import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// support pages
import SupportDashboard from './pages/support/Dashboard';
import RequestList from './pages/support/RequestList';
import RequestDetail from './pages/support/RequestDetail';

// admin pages
import AdminDashboard from './pages/admin/Dashboard';
import CarManagement from './pages/admin/CarManagement';
import CarDetail from './pages/admin/CarDetail';
import UserManagement from './pages/admin/UserManagement';
import UserDetail from './pages/admin/UserDetail';
import StaffManagement from './pages/admin/StaffManagement';
import SupportView from './pages/admin/SupportView';

import { generateMockRequests } from './utils/mockData';
import { generateCarData, generateUserData, generateStaffData, generateBookingData } from './utils/adminMockData';

function App() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState(generateMockRequests());
  const [carData, setCarData] = useState(generateCarData());
  const [userData, setUserData] = useState(generateUserData());
  const [staffData, setStaffData] = useState(generateStaffData());
  const [bookingData] = useState(generateBookingData());

  const handleLogin = (username, password, role) => {
    setUser({ username, role });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleApprove = (requestId) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'approved', handledBy: user.username, handledAt: new Date().toISOString() }
        : req
    ));
  };

  const handleDeny = (requestId, reason) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'denied', handledBy: user.username, handledAt: new Date().toISOString(), denialReason: reason }
        : req
    ));
  };

  const handleUpdateCarStatus = (carId, status) => {
    setCarData(prev => prev.map(car =>
      car.id === carId ? { ...car, status } : car
    ));
  };

  const handleUpdateUserStatus = (userId, status) => {
    setUserData(prev => prev.map(user =>
      user.id === userId ? { ...user, status } : user
    ));
  };

  const handleCreateStaff = (newStaff) => {
    const staff = {
      id: `STAFF-${String(staffData.length + 1).padStart(4, '0')}`,
      username: newStaff.username,
      email: newStaff.email,
      status: 'normal',
      createdDate: new Date().toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0
    };
    setStaffData(prev => [...prev, staff]);
  };

  const handleUpdateStaffStatus = (staffId, status) => {
    setStaffData(prev => prev.map(staff =>
      staff.id === staffId ? { ...staff, status } : staff
    ));
  };

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      {user.role === 'admin' ? (
        <AdminLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route 
              path="/admin/dashboard" 
              element={<AdminDashboard carData={carData} userData={userData} bookingData={bookingData} />} 
            />
            <Route 
              path="/admin/support-view" 
              element={<SupportView requests={requests} currentUser={user.username} />} 
            />
            <Route 
              path="/admin/cars" 
              element={<CarManagement carData={carData} onUpdateCarStatus={handleUpdateCarStatus} />} 
            />
            <Route 
              path="/admin/cars/:id" 
              element={<CarDetail carData={carData} onUpdateCarStatus={handleUpdateCarStatus} />} 
            />
            <Route 
              path="/admin/users" 
              element={<UserManagement userData={userData} onUpdateUserStatus={handleUpdateUserStatus} />} 
            />
            <Route 
              path="/admin/users/:id" 
              element={<UserDetail userData={userData} onUpdateUserStatus={handleUpdateUserStatus} />} 
            />
            <Route 
              path="/admin/staff" 
              element={
                <StaffManagement 
                  staffData={staffData} 
                  onCreateStaff={handleCreateStaff}
                  onUpdateStaffStatus={handleUpdateStaffStatus}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </AdminLayout>
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Navigate to="/support/dashboard" replace />} />
            <Route 
              path="/support/dashboard" 
              element={<SupportDashboard requests={requests} currentUser={user.username} />} 
            />
            <Route 
              path="/support/requests" 
              element={<RequestList requests={requests} currentUser={user.username} />} 
            />
            <Route 
              path="/support/requests/:id" 
              element={
                <RequestDetail 
                  requests={requests} 
                  onApprove={handleApprove} 
                  onDeny={handleDeny}
                  currentUser={user.username}
                />
              } 
            />
            <Route 
              path="/support/stats" 
              element={<SupportDashboard requests={requests} currentUser={user.username} />} 
            />
            <Route path="*" element={<Navigate to="/support/dashboard" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}

export default App;