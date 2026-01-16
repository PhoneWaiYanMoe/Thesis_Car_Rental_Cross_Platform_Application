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

const generateRequests = (users, cars, bookings) => {
  const requestTypes = [
    {
      type: "profile_update",
      title: "Yêu cầu cập nhật hồ sơ",
      category: "Cập nhật hồ sơ",
      needsBooking: false,
      needsVehicle: false,
    },
    {
      type: "vehicle_update",
      title: "Yêu cầu cập nhật thông tin xe",
      category: "Quản lý xe",
      needsBooking: false,
      needsVehicle: true,
    },
    {
      type: "monthly_confirmation",
      title: "Xác nhận xe hàng tháng",
      category: "Xác minh",
      needsBooking: false,
      needsVehicle: true,
    },
    {
      type: "booking_photos",
      title: "Upload ảnh xe trước khi thuê",
      category: "Vấn đề booking",
      needsBooking: true,
      needsVehicle: true,
    },
    {
      type: "booking_issue",
      title: "Báo cáo vấn đề về booking",
      category: "Vấn đề booking",
      needsBooking: true,
      needsVehicle: true,
    },
    {
      type: "report_review",
      title: "Báo cáo đánh giá không phù hợp",
      category: "Báo cáo",
      needsBooking: false,
      needsVehicle: false,
    },
    {
      type: "account_deletion",
      title: "Yêu cầu xóa tài khoản",
      category: "Xóa tài khoản",
      needsBooking: false,
      needsVehicle: false,
    },
    {
      type: "vehicle_deactivate",
      title: "Yêu cầu tạm ngưng xe",
      category: "Quản lý xe",
      needsBooking: false,
      needsVehicle: true,
    },
    {
      type: "other",
      title: "Yêu cầu khác",
      category: "Khác",
      needsBooking: false, // optional
      needsVehicle: false, // optional
    },
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
    ],
    [],
  ];

  return Array.from({ length: 100 }, (_, i) => {
    const requestType =
      requestTypes[Math.floor(Math.random() * requestTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customer = users[Math.floor(Math.random() * users.length)];
    const createdDate = new Date(
      Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
    );
    const handledDate =
      status !== "pending"
        ? new Date(
            createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
          )
        : null;

    // Get related data based on request type
    let relatedBooking = null;
    let relatedVehicle = null;
    let relatedOwner = null;
    let relatedCustomer = customer;
    let reportedReview = null;

    if (
      requestType.needsBooking ||
      (requestType.type === "other" && Math.random() > 0.5)
    ) {
      const userBookings = bookings.filter(
        (b) => b.userId === customer.id || b.ownerId === customer.id
      );
      if (userBookings.length > 0) {
        relatedBooking =
          userBookings[Math.floor(Math.random() * userBookings.length)];
        relatedVehicle = cars.find((c) => c.id === relatedBooking.carId);
        relatedOwner = users.find((u) => u.id === relatedBooking.ownerId);
        relatedCustomer = users.find((u) => u.id === relatedBooking.userId);
      }
    } else if (
      requestType.needsVehicle ||
      (requestType.type === "other" && Math.random() > 0.5)
    ) {
      const ownerCars = cars.filter((c) => c.ownerId === customer.id);
      if (ownerCars.length > 0) {
        relatedVehicle =
          ownerCars[Math.floor(Math.random() * ownerCars.length)];
        relatedOwner = customer;
      }
    }

    if (requestType.type === "report_review") {
      // This would be a review ID in real scenario
      reportedReview = `REV-${String(
        Math.floor(Math.random() * 100) + 1
      ).padStart(4, "0")}`;
    }

    const bodyTemplates = {
      profile_update:
        "Tôi muốn cập nhật thông tin hồ sơ của mình bao gồm số điện thoại, địa chỉ email và địa chỉ nhà. Vui lòng xử lý yêu cầu này.",
      vehicle_update: `Tôi cần cập nhật thông tin xe ${
        relatedVehicle?.name || ""
      } (${
        relatedVehicle?.licensePlate || ""
      }). Cần thay đổi giá thuê và mô tả xe.`,
      monthly_confirmation: `Xác nhận xe ${relatedVehicle?.name || ""} (${
        relatedVehicle?.licensePlate || ""
      }) vẫn đang hoạt động và sẵn sàng cho thuê trong tháng này.`,
      booking_photos: `Tôi đã nhận xe cho booking ${
        relatedBooking?.id || ""
      } và muốn upload ảnh xe trước khi bắt đầu sử dụng.`,
      booking_issue: `Tôi gặp vấn đề với booking ${
        relatedBooking?.id || ""
      } cho xe ${relatedVehicle?.name || ""}. Cần hỗ trợ khẩn cấp.`,
      report_review: `Tôi muốn báo cáo đánh giá ${
        reportedReview || ""
      } vì nội dung không phù hợp và vi phạm quy định.`,
      account_deletion:
        "Tôi muốn xóa vĩnh viễn tài khoản của mình và tất cả dữ liệu liên quan. Vui lòng xử lý yêu cầu này.",
      vehicle_deactivate: `Tôi muốn tạm ngưng cho thuê xe ${
        relatedVehicle?.name || ""
      } (${relatedVehicle?.licensePlate || ""}) trong một thời gian.`,
      other: `Tôi cần hỗ trợ về ${
        relatedBooking ? `booking ${relatedBooking.id}` : "một vấn đề khác"
      }. Vui lòng liên hệ lại với tôi.`,
    };

    return {
      id: `REQ-${String(i + 1).padStart(4, "0")}`,
      type: requestType.type,
      title: requestType.title,
      category: requestType.category,
      body: bodyTemplates[requestType.type],
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

      // Related entities
      customerId: relatedCustomer?.id,
      customerName: relatedCustomer?.name,
      customerEmail: relatedCustomer?.email,
      customerPhone: relatedCustomer?.phone,

      ownerId: relatedOwner?.id,
      ownerName: relatedOwner?.name,

      vehicleId: relatedVehicle?.id,
      vehicleName: relatedVehicle?.name,
      vehicleLicensePlate: relatedVehicle?.licensePlate,

      bookingId: relatedBooking?.id,
      bookingTotal: relatedBooking?.total,
      bookingStatus: relatedBooking?.status,

      reportedReviewId: reportedReview,
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

const generateReviews = (users, cars, bookings) => {
  const reviewTexts = [
    "Xe rất tốt, chủ xe nhiệt tình. Sẽ thuê lại lần sau!",
    "Dịch vụ tuyệt vời, xe sạch sẽ và đúng mô tả.",
    "Xe đẹp, chạy êm. Chủ xe thân thiện.",
    "Rất hài lòng với chuyến đi. Xe chất lượng cao.",
    "Xe tốt nhưng có một số vấn đề nhỏ về điều hòa.",
    "Chủ xe rất dễ tính, xe trong tình trạng tốt.",
    "Giá cả hợp lý, xe chạy tốt. Recommend!",
    "Xe như mới, rất hài lòng với trải nghiệm thuê xe.",
    "Giao xe đúng giờ, xe sạch sẽ. Sẽ giới thiệu cho bạn bè.",
    "Tốt nhưng có thể cải thiện hơn về thời gian giao xe.",
  ];

  const replies = [
    "Cảm ơn bạn đã tin tùng sử dụng dịch vụ! Rất vui khi bạn hài lòng.",
    "Cảm ơn phản hồi của bạn. Chúng tôi sẽ cải thiện dịch vụ tốt hơn.",
    "Rất vui được phục vụ bạn. Hẹn gặp lại!",
    "Xin lỗi vì sự bất tiện. Chúng tôi sẽ khắc phục ngay.",
    "Cảm ơn bạn rất nhiều! Chúc bạn có những chuyến đi an toàn.",
  ];

  const reviewImages = [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
  ];

  const completedBookings = bookings.filter((b) => b.status === "completed");

  // Generate reviews for about 60% of completed bookings
  return completedBookings
    .filter(() => Math.random() > 0.4)
    .map((booking, i) => {
      const car = cars.find((c) => c.id === booking.carId);
      const renter = users.find((u) => u.id === booking.userId);
      const owner = users.find((u) => u.id === booking.ownerId);
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
      const hasImages = Math.random() > 0.7;
      const hasReply = Math.random() > 0.5;

      return {
        id: `REV-${String(i + 1).padStart(4, "0")}`,
        bookingId: booking.id,
        carId: booking.carId,
        carName: car?.name,
        ownerId: booking.ownerId,
        ownerName: owner?.name,
        userId: booking.userId,
        userName: renter?.name,
        rating: rating,
        comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        images: hasImages
          ? [
              reviewImages[Math.floor(Math.random() * reviewImages.length)],
              reviewImages[Math.floor(Math.random() * reviewImages.length)],
            ]
          : [],
        helpful: Math.floor(Math.random() * 50),
        createdAt: new Date(
          new Date(booking.endDate).getTime() +
            Math.random() * 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        reply: hasReply
          ? {
              comment: replies[Math.floor(Math.random() * replies.length)],
              repliedAt: new Date(
                Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000
              ).toISOString(),
            }
          : null,
      };
    });
};

// Main export function
export const generateAllMockData = () => {
  const users = generateUsers();
  const cars = generateCars(users);
  const bookings = generateBookings(users, cars);
  const reviews = generateReviews(users, cars, bookings);
  const requests = generateRequests(users, cars, bookings);
  const staff = generateStaff();

  return {
    users: calculateUserStats(users, bookings, cars),
    cars: cars,
    bookings: bookings,
    reviews: reviews,
    requests: requests,
    staff: calculateStaffStats(staff, requests),
  };
};
