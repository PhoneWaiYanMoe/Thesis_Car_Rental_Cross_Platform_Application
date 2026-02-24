import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/v1/requests": "http://206.189.147.242",
      "/admin/bookings": "http://206.189.147.242",
      "/auth": "http://206.189.147.242",
      "/analytics": "http://206.189.147.242",
      "/users": "http://206.189.147.242",
      "/profile": "http://206.189.147.242",
      "/vehicles": "http://206.189.147.242",
      "/bookings": "http://206.189.147.242",
      "/reviews": "http://206.189.147.242",
      "/payment": "http://206.189.147.242",
      "/payments": "http://206.189.147.242",
      "/notifications": "http://206.189.147.242",
      "/media": "http://206.189.147.242",
      "/locations": "http://206.189.147.242",
      "/favorites": "http://206.189.147.242",
      "/api": "http://206.189.147.242",
    },
  },
});
