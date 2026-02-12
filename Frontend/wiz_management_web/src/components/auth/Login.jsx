import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Your backend expects { email, password }
      const result = await login({ email, password });

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#131A34] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={loading}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20 focus:outline-none transition-all disabled:bg-gray-50"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#131A34] mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={loading}
                className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl
                 focus:border-[#6679C0] focus:ring-2 focus:ring-[#6679C0]/20
                 focus:outline-none transition-all disabled:bg-gray-50"
                placeholder="Enter your password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-[#717685]
                 hover:text-[#131A34] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  // Eye OFF
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5
               c4.478 0 8.268 2.943 9.542 7
               -1.274 4.057-5.064 7-9.542 7
               -4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  // Eye ON
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10
               0-1.02.153-2.004.438-2.93M6.18 6.18A9.956 9.956 0 0112 5
               c5.523 0 10 4.477 10 10 0 1.16-.197 2.275-.56 3.31M15 12
               a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6679C0] text-white py-4 rounded-xl font-semibold hover:bg-[#131A34] hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="inline-block bg-[#F8F9FF] rounded-xl px-6 py-4">
            <p className="text-xs text-[#717685] mb-2 font-semibold">
              Demo Credentials
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-[#131A34]">
                <span className="font-semibold">Admin:</span> admin@wiz.com /
                Admin123!
              </p>
              <p className="text-[#131A34]">
                <span className="font-semibold">Support:</span> support@wiz.com
                / Support123!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
