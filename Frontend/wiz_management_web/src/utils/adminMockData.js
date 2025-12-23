export const generateCarData = () => {
  const vehicleTypes = ['Sedan', 'SUV', 'Hatchback', 'Van'];
  const fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
  const transmissions = ['Automatic', 'Manual', 'Semi-Auto'];
  const availabilities = ['Instant Booking', 'Driver Supported', 'Discount Available'];
  const insuranceTypes = ['Basic', 'Standard', 'Premium', 'Comprehensive'];
  const carNames = [
    'BMW X-1 2020', 'Toyota Camry 2021', 'Honda CR-V 2022', 'Tesla Model 3',
    'Mercedes C-Class', 'Audi A4 2020', 'Ford Explorer', 'Nissan Altima',
    'Hyundai Tucson', 'Mazda CX-5', 'Volkswagen Tiguan', 'Kia Sportage',
    'Chevrolet Malibu', 'Subaru Outback', 'Lexus RX 350', 'Volvo XC60',
    'Range Rover Sport', 'Porsche Cayenne', 'Jeep Grand Cherokee', 'Dodge Durango'
  ];

  const owners = ['Nguyễn Văn Anh','Trần Thị Lan','Lê Minh Quang','Phạm Thị Thảo','Hoàng Hải Dũng'];
  const locations = ['Hà Nội','Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ'];


  const carImages = [
    'https://images.unsplash.com/photo-1615887110697-0819ec23465f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmVudGFsJTIwY2Fyc3xlbnwwfHwwfHx8MA%3D%3D',
    'https://content.jdmagicbox.com/comp/baramati/f7/9999p2112.2112.230315111024.a5f7/catalogue/pvr-tours-and-travels-baramati-city-baramati-car-rental-for-outstation-4d6qw2j1iz.jpg',
    'https://content.jdmagicbox.com/comp/patna/d7/0612px612.x612.180825023224.i8d7/catalogue/baitul-qareem-masjid-phulwarisharif-patna-mosques-84q6u64o3l.jpg',
    'https://content.jdmagicbox.com/v2/comp/indore/z6/0731px731.x731.251110001523.q6z6/catalogue/pacific-travels-datoda-indore-travel-agents-wd602ah891.jpg',
    'https://images.turo.com/media/vehicle/images/dKGwaZ34S52Q8bsuc4bFRw.jpg'
  ];

  return Array.from({ length: 30 }, (_, i) => ({
    id: `CAR-${String(i + 1).padStart(4, '0')}`,
    name: carNames[i % carNames.length],
    vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
    seater: [4, 5, 7, 9][Math.floor(Math.random() * 4)],
    fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
    transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
    // price: Math.floor(Math.random() * 200) + 50,
    price: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.floor(Math.random() * 2000000) + 500000),
    rating: (Math.random() * 2 + 3).toFixed(1),
    totalRentals: Math.floor(Math.random() * 100) + 10,
    status: ['normal', 'stopped', 'banned'][Math.floor(Math.random() * 10) > 7 ? Math.floor(Math.random() * 3) : 0],
    ownerName: owners[Math.floor(Math.random() * owners.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    availability: availabilities[Math.floor(Math.random() * availabilities.length)],
    insuranceType: insuranceTypes[Math.floor(Math.random() * insuranceTypes.length)],
    year: 2018 + Math.floor(Math.random() * 7),
    mileage: Math.floor(Math.random() * 100000) + 10000,
    image: carImages[Math.floor(Math.random() * carImages.length)],
    features: ['AC', 'GPS', 'Bluetooth', 'USB Port', 'Airbags', 'ABS'].slice(0, Math.floor(Math.random() * 4) + 3)
  }));
};

export const generateUserData = () => {
  const firstNames = ['Anh', 'Bình', 'Châu', 'Dũng', 'Hải', 'Lan', 'Minh', 'Ngọc', 'Quang', 'Thảo'];
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];

  const locations = ['Hà Nội','Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','Nha Trang','Huế','Vũng Tàu','Quy Nhơn','Đà Lạt'];


  return Array.from({ length: 50 }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const type = Math.random() > 0.5 ? 'renter' : 'owner';
    
    return {
      id: `USER-${String(i + 1).padStart(4, '0')}`,
      name: name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      type: type,
      status: ['normal', 'stopped', 'banned'][Math.floor(Math.random() * 10) > 7 ? Math.floor(Math.random() * 3) : 0],
      joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      totalBookings: Math.floor(Math.random() * 50) + 1,
      completedBookings: Math.floor(Math.random() * 40),
      cancelledBookings: Math.floor(Math.random() * 5),
      rating: (Math.random() * 2 + 3).toFixed(1),
      verified: Math.random() > 0.3,
      totalCars: type === 'owner' ? Math.floor(Math.random() * 5) + 1 : 0,
      totalRentals: type === 'owner' ? Math.floor(Math.random() * 100) + 10 : 0,
      totalEarnings: type === 'owner' ? Math.floor(Math.random() * 10000) + 1000 : 0,
      recentActivity: [
        {
          type: 'booking',
          description: 'Booked Toyota Camry 2021',
          date: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'payment',
          description: 'Payment of 2.500.000 vnd received',
          date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
  });
};

export const generateStaffData = () => {
  return [
    {
      id: 'STAFF-0001',
      username: 'support1',
      email: 'support1@wiz.com',
      status: 'normal',
      createdDate: new Date('2024-01-15').toISOString(),
      totalHandled: 145,
      totalApproved: 98,
      totalDenied: 47
    },
    {
      id: 'STAFF-0002',
      username: 'support2',
      email: 'support2@wiz.com',
      status: 'normal',
      createdDate: new Date('2024-02-20').toISOString(),
      totalHandled: 112,
      totalApproved: 76,
      totalDenied: 36
    },
    {
      id: 'STAFF-0003',
      username: 'support3',
      email: 'support3@wiz.com',
      status: 'normal',
      createdDate: new Date('2024-03-10').toISOString(),
      totalHandled: 89,
      totalApproved: 62,
      totalDenied: 27
    },
    {
      id: 'STAFF-0004',
      username: 'support4',
      email: 'support4@wiz.com',
      status: 'stopped',
      createdDate: new Date('2024-04-05').toISOString(),
      totalHandled: 54,
      totalApproved: 38,
      totalDenied: 16
    }
  ];
};

export const generateBookingData = () => {
  return Array.from({ length: 200 }, (_, i) => ({
    id: `BOOK-${String(i + 1).padStart(4, '0')}`,
    carId: `CAR-${String(Math.floor(Math.random() * 30) + 1).padStart(4, '0')}`,
    userId: `USER-${String(Math.floor(Math.random() * 50) + 1).padStart(4, '0')}`,
    // amount: Math.floor(Math.random() * 500) + 100,
    amount: Math.floor(Math.random() * 3000000) + 1000000,
    date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    status: ['completed', 'ongoing', 'cancelled'][Math.floor(Math.random() * 3)]
  }));
};