import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authService.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // Mock login for demo - Replace with actual API call
      const mockUsers = [
        { username: 'admin', password: 'admin123', type: 'admin', name: 'Admin User' },
        { username: 'support1', password: 'pass123', type: 'support', name: 'Support User 1' },
        { username: 'support2', password: 'pass123', type: 'support', name: 'Support User 2' },
        { username: 'support3', password: 'pass123', type: 'support', name: 'Support User 3' },
        { username: 'support4', password: 'pass123', type: 'support', name: 'Support User 4' },
      ];

      const foundUser = mockUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );

      if (!foundUser) {
        throw new Error('Invalid credentials');
      }

      // Mock token
      const token = `mock_token_${foundUser.username}_${Date.now()}`;
      const userData = {
        username: foundUser.username,
        type: foundUser.type,
        name: foundUser.name
      };

      authService.login(token, userData);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.type === 'admin',
    isSupport: user?.type === 'support',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};