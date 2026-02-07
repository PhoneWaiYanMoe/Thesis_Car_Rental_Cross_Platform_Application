import { useState, useEffect, createContext, useContext } from "react";
import apiClient from "../utils/apiClient";
import { API_ENDPOINTS } from "../config/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // Call your auth service login endpoint
      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
      );

      // Your response format:
      // {
      //   token: "...",
      //   refreshToken: "...",
      //   user: { id: "...", email: "...", fullName: "...", role: "admin" }
      // }
      const { token, refreshToken, user: userData } = response.data;

      if (!token || !userData) {
        throw new Error("Invalid response from server");
      }

      // Map your user data to frontend format
      const mappedUser = {
        id: userData.id,
        email: userData.email,
        name: userData.fullName,
        username: userData.email, // Use email as username for compatibility
        type: userData.role, // Map 'role' to 'type' for frontend
        role: userData.role,
        phone: userData.phone,
        avatarUrl: userData.avatarUrl,
      };

      // Store token and user data
      localStorage.setItem("auth_token", token);
      localStorage.setItem("refresh_token", refreshToken); // Store refresh token too
      localStorage.setItem("auth_user", JSON.stringify(mappedUser));

      setUser(mappedUser);

      return { success: true, user: mappedUser };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.type === "admin" || user?.role === "admin",
    isSupport: user?.type === "support" || user?.role === "support",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
