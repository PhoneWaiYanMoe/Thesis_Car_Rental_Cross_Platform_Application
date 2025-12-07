// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/support/Dashboard';
import RequestList from './pages/support/RequestList';
import RequestDetail from './pages/support/RequestDetail';
import { generateMockRequests } from './utils/mockData';

function App() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState(generateMockRequests());

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
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/support/dashboard" replace />} />
          <Route 
            path="/support/dashboard" 
            element={<Dashboard requests={requests} currentUser={user.username} />} 
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
            element={<Dashboard requests={requests} currentUser={user.username} />} 
          />
          <Route path="*" element={<Navigate to="/support/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;