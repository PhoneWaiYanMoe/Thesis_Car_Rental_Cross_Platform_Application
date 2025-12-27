// Generate base data first
const generateUsers = () => {
  const firstNames = [
    "Anh",
    "Bình",
    "Châu",
    "Dũng",
    "Hải",
    "Lan",
    "Minh",
    "Ngọc",
    "Quang",
    "Thảo",
    "Hương",
    "Tuấn",
    "Linh",
    "Khoa",
    "Mai",
    "Phương",
    "Tùng",
    "Hà",
    "Nam",
    "Tú",
  ];
  const lastNames = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Phan",
    "Vũ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
    "Lý",
  ];
  const locations = [
    "Hà Nội",
    "Hồ Chí Minh",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "Nha Trang",
    "Huế",
    "Vũng Tàu",
    "Quy Nhơn",
    "Đà Lạt",
    "Biên Hòa",
    "Vinh",
    "Buôn Ma Thuột",
    "Thanh Hóa",
    "Thái Nguyên",
  ];

  return Array.from({ length: 60 }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${lastName} ${firstName}`;
    const type = i < 20 ? "owner" : "renter"; // First 20 are owners, rest are renters

    return {
      id: `USER-${String(i + 1).padStart(4, "0")}`,
      name: name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: `+84 ${Math.floor(Math.random() * 900) + 100} ${
        Math.floor(Math.random() * 900) + 100
      } ${Math.floor(Math.random() * 9000) + 1000}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      type: type,
      status: ["normal", "stopped", "banned"][
        Math.floor(Math.random() * 10) > 8 ? Math.floor(Math.random() * 3) : 0
      ],
      joinedDate: new Date(
        Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000
      ).toISOString(), // Last 2 years
      verified: Math.random() > 0.2,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 to 5.0
      licenseNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
      dateOfBirth: new Date(
        1970 + Math.floor(Math.random() * 35),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ).toISOString(),
      address: `${Math.floor(Math.random() * 500) + 1} Đường Lê Lợi, Quận ${
        Math.floor(Math.random() * 12) + 1
      }`,
    };
  });
};

const generateCars = (users) => {
  const vehicleTypes = ["Sedan", "SUV", "Hatchback", "Van", "Pickup", "Coupe"];
  const fuelTypes = ["Xăng", "Dầu Diesel", "Điện", "Hybrid"];
  const transmissions = ["Tự động", "Số sàn", "Bán tự động"];
  const availabilities = ["Đặt xe ngay", "Có tài xế", "Giảm giá"];
  const insuranceTypes = ["Cơ bản", "Tiêu chuẩn", "Cao cấp", "Toàn diện"];

  const carBrands = [
    {
      brand: "Toyota",
      models: ["Vios", "Camry", "Fortuner", "Innova", "Corolla Cross"],
    },
    { brand: "Honda", models: ["City", "Civic", "CR-V", "Accord", "HR-V"] },
    { brand: "Mazda", models: ["3", "6", "CX-5", "CX-8", "CX-30"] },
    {
      brand: "Hyundai",
      models: ["Accent", "Elantra", "Tucson", "Santa Fe", "Kona"],
    },
    {
      brand: "Kia",
      models: ["Morning", "Cerato", "Seltos", "Sorento", "Carnival"],
    },
    {
      brand: "VinFast",
      models: ["Fadil", "Lux A2.0", "Lux SA2.0", "VF 8", "VF 9"],
    },
    { brand: "Mercedes", models: ["C-Class", "E-Class", "GLC", "S-Class"] },
    { brand: "BMW", models: ["3 Series", "5 Series", "X1", "X3", "X5"] },
  ];

  const carImages = [
    "https://images.unsplash.com/photo-1615887110697-0819ec23465f?fm=jpg&q=60&w=3000",
    "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2940",
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2864",
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2940",
    "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?q=80&w=2940",
  ];

  const owners = users.filter((u) => u.type === "owner");

  return Array.from({ length: 50 }, (_, i) => {
    const carBrand = carBrands[Math.floor(Math.random() * carBrands.length)];
    const model =
      carBrand.models[Math.floor(Math.random() * carBrand.models.length)];
    const year = 2018 + Math.floor(Math.random() * 7);
    const owner = owners[Math.floor(Math.random() * owners.length)];
    const pricePerDay = Math.floor(Math.random() * 1500000) + 300000; // 300k - 1.8M VND

    return {
      id: `CAR-${String(i + 1).padStart(4, "0")}`,
      name: `${carBrand.brand} ${model} ${year}`,
      brand: carBrand.brand,
      model: model,
      year: year,
      vehicleType:
        vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
      seater: [4, 5, 7, 9][Math.floor(Math.random() * 4)],
      fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
      transmission:
        transmissions[Math.floor(Math.random() * transmissions.length)],
      pricePerDay: pricePerDay,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 to 5.0
      totalRentals: Math.floor(Math.random() * 150) + 10,
      status: ["normal", "stopped", "banned"][
        Math.floor(Math.random() * 10) > 8 ? Math.floor(Math.random() * 3) : 0
      ],
      ownerId: owner.id,
      ownerName: owner.name,
      location: owner.location,
      availability:
        availabilities[Math.floor(Math.random() * availabilities.length)],
      insuranceType:
        insuranceTypes[Math.floor(Math.random() * insuranceTypes.length)],
      mileage: Math.floor(Math.random() * 100000) + 10000,
      image: carImages[Math.floor(Math.random() * carImages.length)],
      images: [
        carImages[Math.floor(Math.random() * carImages.length)],
        carImages[Math.floor(Math.random() * carImages.length)],
        carImages[Math.floor(Math.random() * carImages.length)],
      ],
      features: [
        "Điều hòa",
        "GPS",
        "Bluetooth",
        "Cổng USB",
        "Túi khí",
        "ABS",
        "Camera lùi",
        "Cảm biến lùi",
      ].slice(0, Math.floor(Math.random() * 5) + 3),
      color: ["Đen", "Trắng", "Bạc", "Xanh", "Đỏ", "Xám"][
        Math.floor(Math.random() * 6)
      ],
      licensePlate: `${Math.floor(Math.random() * 90) + 10}${
        ["A", "B", "C", "D", "E", "F", "G", "H"][Math.floor(Math.random() * 8)]
      }-${Math.floor(Math.random() * 90000) + 10000}`,
      description: `Xe ${carBrand.brand} ${model} ${year} trong tình trạng tốt, được bảo dưỡng định kỳ. Phù hợp cho cả chuyến đi trong thành phố và đường dài.`,
    };
  });
};

const generateBookings = (users, cars) => {
  const renters = users.filter((u) => u.type === "renter");
  const statuses = ["completed", "ongoing", "cancelled", "upcoming"];

  return Array.from({ length: 300 }, (_, i) => {
    const car = cars[Math.floor(Math.random() * cars.length)];
    const renter = renters[Math.floor(Math.random() * renters.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Generate booking dates - spread across last 6 months and next month
    const daysRange = Math.random() * 210 - 180; // -180 to +30 days
    const createdDate = new Date(Date.now() + daysRange * 24 * 60 * 60 * 1000);
    const startDate = new Date(
      createdDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000
    );
    const duration = Math.floor(Math.random() * 10) + 1; // 1-10 days
    const endDate = new Date(
      startDate.getTime() + duration * 24 * 60 * 60 * 1000
    );

    // Calculate pricing
    const rentalPrice = car.pricePerDay * duration;
    const insuranceFee = Math.floor(car.pricePerDay * 0.1) * duration;
    const serviceFee = Math.floor(rentalPrice * 0.05);
    const total = rentalPrice + insuranceFee + serviceFee;
    const deposit = Math.floor(total * 0.3);
    const remaining = total - deposit;

    return {
      id: `BOOK-${String(i + 1).padStart(4, "0")}`,
      carId: car.id,
      carName: car.name,
      carImage: car.image,
      userId: renter.id,
      userName: renter.name,
      userEmail: renter.email,
      userPhone: renter.phone,
      userLicense: renter.licenseNumber,
      ownerId: car.ownerId,
      ownerName: car.ownerName,
      status: status,
      createdDate: createdDate.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: duration,
      pickupLocation: car.location,
      dropoffLocation: car.location,
      rentalPrice: rentalPrice,
      insuranceFee: insuranceFee,
      serviceFee: serviceFee,
      total: total,
      deposit: deposit,
      depositPaid: status !== "cancelled",
      remaining: remaining,
      remainingPaid: status === "completed",
      paymentMethod: ["Thẻ tín dụng", "Thẻ ghi nợ", "Chuyển khoản", "Tiền mặt"][
        Math.floor(Math.random() * 4)
      ],
      notes: status === "cancelled" ? "Đã hủy bởi khách hàng" : "",
    };
  });
};

const generateRequests = (users) => {
  const titles = [
    "Yêu cầu xóa tài khoản",
    "Thay đổi phương thức thanh toán",
    "Cập nhật tình trạng xe",
    "Yêu cầu hoàn tiền cho booking đã hủy",
    "Xác minh giấy tờ xe",
    "Báo cáo hành vi không phù hợp",
    "Yêu cầu bồi thường bảo hiểm",
    "Thay đổi ngày thuê xe",
    "Vấn đề xác minh tài khoản",
    "Cần giải quyết tranh chấp",
    "Không thể tải ảnh xe lên",
    "Chưa nhận được thanh toán",
    "Vấn đề đăng nhập ứng dụng",
    "Yêu cầu cập nhật hồ sơ",
    "Yêu cầu gia hạn thuê xe",
  ];

  const categories = [
    "Xóa tài khoản",
    "Thanh toán",
    "Quản lý xe",
    "Vấn đề booking",
    "Xác minh",
    "Báo cáo",
    "Bảo hiểm",
    "Thay đổi booking",
    "Tài khoản",
    "Tranh chấp",
    "Kỹ thuật",
    "Cập nhật hồ sơ",
  ];

  const statuses = ["pending", "approved", "denied"];
  const handlers = ["support1", "support2", "support3", "support4"];

  const photoSets = [
    [
      "https://www.fabcars.in/assets/images/blog/luxury-car-for-your-indian-getaway.jpg",
      "https://img1.wsimg.com/isteam/ip/6837e201-1f74-479e-8062-2a6019e79045/113.jpg",
    ],
    [
      "https://img1.wsimg.com/isteam/ip/6837e201-1f74-479e-8062-2a6019e79045/115.jpg",
      "https://www.fabcars.in/assets/images/blog/luxury-car-for-your-indian-getaway.jpg",
    ],
    [],
  ];

  return Array.from({ length: 80 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customer = users[Math.floor(Math.random() * users.length)];
    const createdDate = new Date(
      Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
    ); // Last 60 days
    const handledDate =
      status !== "pending"
        ? new Date(
            createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
          )
        : null;

    return {
      id: `REQ-${String(i + 1).padStart(4, "0")}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      body: `Tôi muốn ${titles[
        Math.floor(Math.random() * titles.length)
      ].toLowerCase()}. Đây là vấn đề quan trọng đối với tôi vì nhiều lý do. Vui lòng xử lý yêu cầu này càng sớm càng tốt. Tôi đã đính kèm các tài liệu và ảnh liên quan để quý vị xem xét.`,
      status: status,
      priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
      createdAt: createdDate.toISOString(),
      handledBy:
        status !== "pending"
          ? handlers[Math.floor(Math.random() * handlers.length)]
          : null,
      handledAt: handledDate ? handledDate.toISOString() : null,
      denialReason:
        status === "denied"
          ? "Yêu cầu này không thể được xử lý do vi phạm chính sách hoặc thiếu thông tin. Vui lòng cung cấp thêm tài liệu và gửi lại yêu cầu."
          : null,
      photos: photoSets[Math.floor(Math.random() * photoSets.length)],
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
    };
  });
};

const generateStaff = () => {
  return [
    {
      id: "STAFF-0001",
      username: "support1",
      email: "support1@wiz.com",
      status: "normal",
      createdDate: new Date("2024-01-15").toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0,
    },
    {
      id: "STAFF-0002",
      username: "support2",
      email: "support2@wiz.com",
      status: "normal",
      createdDate: new Date("2024-02-20").toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0,
    },
    {
      id: "STAFF-0003",
      username: "support3",
      email: "support3@wiz.com",
      status: "normal",
      createdDate: new Date("2024-03-10").toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0,
    },
    {
      id: "STAFF-0004",
      username: "support4",
      email: "support4@wiz.com",
      status: "stopped",
      createdDate: new Date("2024-04-05").toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0,
    },
  ];
};

// Calculate user statistics based on bookings
const calculateUserStats = (users, bookings, cars) => {
  return users.map((user) => {
    const userBookings = bookings.filter((b) => b.userId === user.id);
    const completedBookings = userBookings.filter(
      (b) => b.status === "completed"
    ).length;
    const cancelledBookings = userBookings.filter(
      (b) => b.status === "cancelled"
    ).length;

    let additionalStats = {};

    if (user.type === "owner") {
      const ownedCars = cars.filter((c) => c.ownerId === user.id);
      const ownerBookings = bookings.filter(
        (b) => b.ownerId === user.id && b.status === "completed"
      );
      const totalEarnings = ownerBookings.reduce((sum, b) => sum + b.total, 0);
      additionalStats = {
        totalCars: ownedCars.length,
        totalRentals: ownerBookings.length,
        totalEarnings: totalEarnings,
      };
    }

    return {
      ...user,
      totalBookings: userBookings.length,
      completedBookings: completedBookings,
      cancelledBookings: cancelledBookings,
      ...additionalStats,
    };
  });
};
// Calculate staff statistics based on requests
const calculateStaffStats = (staff, requests) => {
  return staff.map((s) => {
    const handledRequests = requests.filter((r) => r.handledBy === s.username);
    const approvedRequests = handledRequests.filter(
      (r) => r.status === "approved"
    );
    const deniedRequests = handledRequests.filter((r) => r.status === "denied");
    return {
      ...s,
      totalHandled: handledRequests.length,
      totalApproved: approvedRequests.length,
      totalDenied: deniedRequests.length,
    };
  });
};
// Main export function
export const generateAllMockData = () => {
  const users = generateUsers();
  const cars = generateCars(users);
  const bookings = generateBookings(users, cars);
  const requests = generateRequests(users);
  const staff = generateStaff();
  return {
    users: calculateUserStats(users, bookings, cars),
    cars: cars,
    bookings: bookings,
    requests: requests,
    staff: calculateStaffStats(staff, requests),
  };
};
