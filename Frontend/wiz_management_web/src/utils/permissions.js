// Permission definitions for different user types

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: ["admin", "support"],

  // Cars
  VIEW_CARS: ["admin", "support"],
  UPDATE_CAR_STATUS: ["admin"],

  // Users
  VIEW_USERS: ["admin", "support"],
  UPDATE_USER_STATUS: ["admin"],

  // Bookings
  VIEW_BOOKINGS: ["admin", "support"],

  // Requests
  VIEW_REQUESTS: ["admin", "support"],
  HANDLE_REQUESTS: ["admin", "support"], // UPDATED: Admin can now handle requests
  VIEW_ALL_STAFF_REQUESTS: ["admin"],

  // Staff Management
  VIEW_STAFF: ["admin"],
  CREATE_STAFF: ["admin"],
  UPDATE_STAFF_STATUS: ["admin"],
};

// Check if user has permission
export const hasPermission = (userType, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userType);
};

// Get menu items based on user type
export const getMenuItems = (userType) => {
  const allMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/dashboard",
      icon: "Home",
      permission: "VIEW_DASHBOARD",
    },
    {
      id: "bookings",
      label: "Bookings",
      path: "/bookings",
      icon: "Calendar",
      permission: "VIEW_BOOKINGS",
    },
    {
      id: "requests",
      label: userType === "admin" ? "Support Requests" : "Requests",
      path: "/requests",
      icon: "FileText",
      permission: "VIEW_REQUESTS",
    },
    {
      id: "cars",
      label: "Vehicles",
      path: "/cars",
      icon: "Car",
      permission: "VIEW_CARS",
    },
    {
      id: "users",
      label: "Users",
      path: "/users",
      icon: "Users",
      permission: "VIEW_USERS",
    },
    {
      id: "staff",
      label: "Support Staff",
      path: "/staff",
      icon: "UserCog",
      permission: "VIEW_STAFF",
    },
  ];

  // Filter menu items based on permissions
  return allMenuItems.filter((item) =>
    hasPermission(userType, item.permission)
  );
};
