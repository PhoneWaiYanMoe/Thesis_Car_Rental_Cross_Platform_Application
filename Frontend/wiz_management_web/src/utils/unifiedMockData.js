// Generate base data first
const generateUsers = () => {
  const firstNames = ['Anh', 'Bình', 'Châu', 'Dũng', 'Hải', 'Lan', 'Minh', 'Ngọc', 'Quang', 'Thảo', 'Hương', 'Tuấn', 'Linh', 'Khoa', 'Mai'];
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
  const locations = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang', 'Huế', 'Vũng Tàu', 'Quy Nhơn', 'Đà Lạt'];

  return Array.from({ length: 50 }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const type = Math.random() > 0.5 ? 'renter' : 'owner';
    
    return {
      id: `USER-${String(i + 1).padStart(4, '0')}`,
      name: name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: `+84 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      type: type,
      status: ['normal', 'stopped', 'banned'][Math.floor(Math.random() * 10) > 7 ? Math.floor(Math.random() * 3) : 0],
      joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      verified: Math.random() > 0.3,
      rating: (Math.random() * 2 + 3).toFixed(1),
      licenseNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
      dateOfBirth: new Date(1970 + Math.floor(Math.random() * 35), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      address: `${Math.floor(Math.random() * 500) + 1} Đường ${Math.floor(Math.random() * 50) + 1}`,
    };
  });
};

const generateCars = (users) => {
  const vehicleTypes = ['Sedan', 'SUV', 'Hatchback', 'Van', 'Pickup', 'Coupe'];
  const fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
  const transmissions = ['Automatic', 'Manual', 'Semi-Auto'];
  const availabilities = ['Instant Booking', 'Driver Supported', 'Discount Available'];
  const insuranceTypes = ['Basic', 'Standard', 'Premium', 'Comprehensive'];
  const carBrands = ['BMW', 'Toyota', 'Honda', 'Mercedes', 'Audi', 'Ford', 'Nissan', 'Hyundai', 'Mazda', 'Volkswagen', 'Kia', 'Chevrolet', 'Subaru', 'Lexus', 'Volvo', 'Range Rover', 'Porsche', 'Jeep', 'Dodge', 'Tesla'];
  const carModels = ['X-1', 'Camry', 'CR-V', 'Model 3', 'C-Class', 'A4', 'Explorer', 'Altima', 'Tucson', 'CX-5', 'Tiguan', 'Sportage', 'Malibu', 'Outback', 'RX 350', 'XC60', 'Sport', 'Cayenne', 'Grand Cherokee', 'Durango'];
  
  const carImages = [
    'https://images.unsplash.com/photo-1615887110697-0819ec23465f?fm=jpg&q=60&w=3000',
    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2940',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2864',
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2940',
    'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?q=80&w=2940',
  ];

  const owners = users.filter(u => u.type === 'owner');
  
  return Array.from({ length: 40 }, (_, i) => {
    const brand = carBrands[Math.floor(Math.random() * carBrands.length)];
    const model = carModels[Math.floor(Math.random() * carModels.length)];
    const year = 2018 + Math.floor(Math.random() * 7);
    const owner = owners[Math.floor(Math.random() * owners.length)];
    const pricePerDay = Math.floor(Math.random() * 2000000) + 500000;
    
    return {
      id: `CAR-${String(i + 1).padStart(4, '0')}`,
      name: `${brand} ${model} ${year}`,
      brand: brand,
      model: model,
      year: year,
      vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
      seater: [4, 5, 7, 9][Math.floor(Math.random() * 4)],
      fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
      transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
      pricePerDay: pricePerDay,
      rating: (Math.random() * 2 + 3).toFixed(1),
      totalRentals: Math.floor(Math.random() * 100) + 10,
      status: ['normal', 'stopped', 'banned'][Math.floor(Math.random() * 10) > 7 ? Math.floor(Math.random() * 3) : 0],
      ownerId: owner.id,
      ownerName: owner.name,
      location: owner.location,
      availability: availabilities[Math.floor(Math.random() * availabilities.length)],
      insuranceType: insuranceTypes[Math.floor(Math.random() * insuranceTypes.length)],
      mileage: Math.floor(Math.random() * 100000) + 10000,
      image: carImages[Math.floor(Math.random() * carImages.length)],
      images: [
        carImages[Math.floor(Math.random() * carImages.length)],
        carImages[Math.floor(Math.random() * carImages.length)],
        carImages[Math.floor(Math.random() * carImages.length)],
      ],
      features: ['AC', 'GPS', 'Bluetooth', 'USB Port', 'Airbags', 'ABS', 'Parking Sensor', 'Backup Camera'].slice(0, Math.floor(Math.random() * 5) + 3),
      color: ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gray'][Math.floor(Math.random() * 6)],
      licensePlate: `${Math.floor(Math.random() * 90) + 10}A-${Math.floor(Math.random() * 90000) + 10000}`,
      description: `Well-maintained ${brand} ${model} ${year} in excellent condition. Perfect for city driving and long trips.`,
    };
  });
};

const generateBookings = (users, cars) => {
  const renters = users.filter(u => u.type === 'renter');
  const statuses = ['completed', 'ongoing', 'cancelled', 'upcoming'];
  
  return Array.from({ length: 200 }, (_, i) => {
    const car = cars[Math.floor(Math.random() * cars.length)];
    const renter = renters[Math.floor(Math.random() * renters.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate booking dates
    const createdDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const startDate = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 10) + 1; // 1-10 days
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    
    // Calculate pricing
    const rentalPrice = car.pricePerDay * duration;
    const insuranceFee = Math.floor(car.pricePerDay * 0.1) * duration;
    const serviceFee = Math.floor(rentalPrice * 0.05);
    const total = rentalPrice + insuranceFee + serviceFee;
    const deposit = Math.floor(total * 0.3);
    const remaining = total - deposit;
    
    return {
      id: `BOOK-${String(i + 1).padStart(4, '0')}`,
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
      depositPaid: status !== 'cancelled',
      remaining: remaining,
      remainingPaid: status === 'completed',
      paymentMethod: ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash'][Math.floor(Math.random() * 4)],
      notes: status === 'cancelled' ? 'Cancelled by customer' : '',
    };
  });
};

const generateRequests = (users) => {
  const titles = [
    'Request to delete my account',
    'Change payment method',
    'Update car availability',
    'Refund request for cancelled booking',
    'Verify car ownership documents',
    'Report inappropriate user behavior',
    'Request insurance claim',
    'Change booking dates',
    'Account verification issue',
    'Dispute resolution needed',
    'Unable to upload car photos',
    'Payment not received',
    'App login issues',
    'Request to update profile',
    'Car rental extension request'
  ];
  
  const categories = [
    'Account Deletion',
    'Payment Issue',
    'Car Management',
    'Booking Issue',
    'Verification',
    'Report',
    'Insurance',
    'Booking Change',
    'Account Issue',
    'Dispute',
    'Technical Issue',
    'Profile Update'
  ];
  
  const statuses = ['pending', 'approved', 'denied'];
  const handlers = ['support1', 'support2', 'support3', 'support4'];
  
  const photoSets = [
    [
      'https://www.fabcars.in/assets/images/blog/luxury-car-for-your-indian-getaway.jpg',
      'https://img1.wsimg.com/isteam/ip/6837e201-1f74-479e-8062-2a6019e79045/113.jpg',
    ],
    [
      'https://img1.wsimg.com/isteam/ip/6837e201-1f74-479e-8062-2a6019e79045/115.jpg',
      'https://www.fabcars.in/assets/images/blog/luxury-car-for-your-indian-getaway.jpg',
    ],
    []
  ];
  
  return Array.from({ length: 50 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customer = users[Math.floor(Math.random() * users.length)];
    const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const handledDate = status !== 'pending' ? new Date(createdDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : null;
    
    return {
      id: `REQ-${String(i + 1).padStart(4, '0')}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      body: `I would like to ${titles[Math.floor(Math.random() * titles.length)].toLowerCase()}. This is important for me because of various reasons. Please process this request as soon as possible. I have attached relevant documents and photos for your review.`,
      status: status,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      createdAt: createdDate.toISOString(),
      handledBy: status !== 'pending' ? handlers[Math.floor(Math.random() * handlers.length)] : null,
      handledAt: handledDate ? handledDate.toISOString() : null,
      denialReason: status === 'denied' ? 'This request cannot be processed due to policy violations or incomplete information. Please provide additional documentation and resubmit your request.' : null,
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
      id: 'STAFF-0001',
      username: 'support1',
      email: 'support1@wiz.com',
      status: 'normal',
      createdDate: new Date('2024-01-15').toISOString(),
      totalHandled: 0, // Will be calculated
      totalApproved: 0, // Will be calculated
      totalDenied: 0, // Will be calculated
    },
    {
      id: 'STAFF-0002',
      username: 'support2',
      email: 'support2@wiz.com',
      status: 'normal',
      createdDate: new Date('2024-02-20').toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0,
    },
    {
      id: 'STAFF-0003',
      username: 'support3',
      email: 'support3@wiz.com',
      status: 'normal',
      createdDate: new Date('2024-03-10').toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0,
    },
    {
      id: 'STAFF-0004',
      username: 'support4',
      email: 'support4@wiz.com',
      status: 'stopped',
      createdDate: new Date('2024-04-05').toISOString(),
      totalHandled: 0,
      totalApproved: 0,
      totalDenied: 0,
    }
  ];
};

// Calculate user statistics based on bookings
const calculateUserStats = (users, bookings, cars) => {
  return users.map(user => {
    const userBookings = bookings.filter(b => b.userId === user.id);
    const completedBookings = userBookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = userBookings.filter(b => b.status === 'cancelled').length;
    
    let additionalStats = {};
    
    if (user.type === 'owner') {
      const ownedCars = cars.filter(c => c.ownerId === user.id);
      const ownerBookings = bookings.filter(b => b.ownerId === user.id && b.status === 'completed');
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
  return staff.map(s => {
    const handledRequests = requests.filter(r => r.handledBy === s.username);
    const approvedRequests = handledRequests.filter(r => r.status === 'approved');
    const deniedRequests = handledRequests.filter(r => r.status === 'denied');
    
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