// Authentication utility functions

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const authService = {
  // Store token and user data
  login: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Remove token and user data
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get stored user
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!authService.getToken();
  },

  // Check if user is admin
  isAdmin: () => {
    const user = authService.getUser();
    return user?.type === "admin";
  },

  // Check if user is support
  isSupport: () => {
    const user = authService.getUser();
    return user?.type === "support";
  },

  // Get user type
  getUserType: () => {
    const user = authService.getUser();
    return user?.type;
  },
};

// HTTP request interceptor to add auth token
export const getAuthHeaders = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
