import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { predefinedUsers } from "../utils/predefinedUsers";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    // find user in predefined users
    const user = predefinedUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      // login successful
      onLogin(username, password, user.role);

      // navigate based on role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/support/dashboard");
      }
    } else {
      // login failed
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen bg-[#131A34] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#6679C0] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl">
            <img
              src="/images/wiz_logo.png"
              alt="Wiz Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#131A34] mb-2">Welcome!</h1>
          <p className="text-[#717685]">Sign in to Wiz Management</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#131A34] mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(""); // clear error when typing
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#131A34] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(""); // clear error when typing
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all"
              placeholder="Enter your password"
            />
          </div>

          {/* error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-[#6679C0] text-white py-4 rounded-xl font-semibold hover:bg-[#131A34] hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block bg-[#F8F9FF] rounded-xl px-6 py-4">
            <p className="text-xs text-[#717685] mb-2 font-semibold">
              Please enter your username and password to login.
            </p>
            <p className="text-xs text-[#717685] mb-2 font-semibold">
              'Feel the magic, with Wiz'
            </p>
            {/* <p className="text-xs text-[#717685] mb-2 font-semibold">Demo Credentials</p>
            <div className="space-y-1 text-sm">
              <p className="text-[#131A34]"><span className="font-semibold">Admin:</span> admin / admin123</p>
              <p className="text-[#131A34]"><span className="font-semibold">Support:</span> support1 / pass123</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
