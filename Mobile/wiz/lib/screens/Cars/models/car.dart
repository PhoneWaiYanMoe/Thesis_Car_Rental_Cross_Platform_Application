class Car {
  final String image;
  final List<String> images; 
  final String name;
  final double rating;
  final int reviews;
  final int price;
  final String owner;
  final String ownerAvatar;
  final DateTime ownerJoinedDate;
  final String location;
  final int seats;
  final String fuel;
  final String type;
  final String transmission;
  final bool instant;
  final bool driver;
  final bool discount;

  final String brand;
  final int year;
  final String mileage;
  final String color;
  final List<String> features;
  final List<String> rules;
  final Map<String, String> limitsAndFees;

  Car({
    required this.image,
    required this.images,
    required this.name,
    required this.rating,
    required this.reviews,
    required this.price,
    required this.owner,
    required this.ownerAvatar,
    required this.ownerJoinedDate,
    required this.location,
    required this.seats,
    required this.fuel,
    required this.type,
    required this.transmission,
    required this.instant,
    required this.driver,
    required this.discount,
    required this.brand,
    required this.year,
    required this.mileage,
    required this.color,
    required this.features,
    required this.rules,
    required this.limitsAndFees,
  });

  static List<Car> get sampleCars => [
    Car(
      image: 'assets/images/Car.png',
      images: ['assets/images/Car.png', 'assets/images/Car_2.png', 'assets/images/Car.png', 'assets/images/Car_2.png'],
      name: 'BMW X-1 2020',
      rating: 4.8,
      reviews: 123,
      price: 820000,
      owner: 'John Doe',
      ownerAvatar: 'assets/images/Car_2.png',
      ownerJoinedDate: DateTime(2024, 5, 15),
      location: 'Ho Chi Minh City',
      seats: 5,
      fuel: 'Gasoline',
      type: 'Sedan',
      transmission: 'Automatic',
      instant: true,
      driver: true,
      discount: false,
      brand: 'BMW',
      year: 2020,
      mileage: '100,000 km',
      color: 'Brown',
      features: [
        'Air Conditioning',
        'Leather seats',
        'Sunroof',
        'Reverse camera',
        '360 camera',
        'GPS',
        'Bluetooth',
        'USB port',
        'Child seat',
        'Spare tire',
      ],
      rules: [
        'Please drive safely and follow traffic rules.',
        'No smoking or pets inside the car.',
        'Return the car clean and with the same fuel level.',
        'Use only A95 petrol when refueling.',
        'Avoid off-road or rough driving.',
      ],
      limitsAndFees: {
        'Daily Mileage Limit': '200 km',
        'Overuse Fee': '3,000 đ/km',
        'Late Return Fee': '50,000 đ/hour',
        'Note': 'If the car is returned more than 30 minutes late, a 1-hour rate fee will apply.',
      },
    ),
    Car(
      image: 'assets/images/Car_2.png',
      images: ['assets/images/Car_2.png', 'assets/images/Car.png', 'assets/images/Car_2.png', 'assets/images/Car.png'],
      name: 'BMW X-1 2040',
      rating: 4.9,
      reviews: 89,
      price: 860000,
      owner: 'Sarah Lee',
      ownerAvatar: 'assets/images/Car.png',
      ownerJoinedDate: DateTime(2023, 8, 20),
      location: 'Ho Chi Minh City',
      seats: 7,
      fuel: 'Hybrid',
      type: 'SUV',
      transmission: 'Semi-auto',
      instant: false,
      driver: true,
      discount: true,
      brand: 'BMW',
      year: 2020,
      mileage: '85,000 km',
      color: 'Silver',
      features: [
        'Air Conditioning',
        'Leather seats',
        'Panoramic sunroof',
        'Reverse camera',
        '360 camera',
        'GPS',
        'Bluetooth',
        'USB port',
        'Wireless charging',
        'Child seat',
        'Spare tire',
      ],
      rules: [
        'Please drive safely and follow traffic rules.',
        'No smoking or pets inside the car.',
        'Return the car clean and with the same fuel level.',
        'Use only A95 petrol when refueling.',
        'Avoid off-road or rough driving.',
        'Maximum 4 passengers for long trips.',
      ],
      limitsAndFees: {
        'Daily Mileage Limit': '250 km',
        'Overuse Fee': '2,500 đ/km',
        'Late Return Fee': '40,000 đ/hour',
        'Note': 'If the car is returned more than 30 minutes late, a 1-hour rate fee will apply.',
      },
    ),
    Car(
      image: 'assets/images/Car.png',
      images: ['assets/images/Car.png', 'assets/images/Car_2.png', 'assets/images/Car.png'],
      name: 'Toyota Camry 2022',
      rating: 4.7,
      reviews: 200,
      price: 750000,
      owner: 'Mike Chen',
      ownerAvatar: 'assets/images/Car_2.png',
      ownerJoinedDate: DateTime(2024, 1, 10),
      location: 'Ho Chi Minh City',
      seats: 5,
      fuel: 'Gasoline',
      type: 'Sedan',
      transmission: 'Automatic',
      instant: true,
      driver: false,
      discount: true,
      brand: 'Toyota',
      year: 2022,
      mileage: '50,000 km',
      color: 'White',
      features: [
        'Air Conditioning',
        'Fabric seats',
        'Reverse camera',
        'GPS',
        'Bluetooth',
        'USB port',
        'Child seat',
        'Spare tire',
      ],
      rules: [
        'Please drive safely and follow traffic rules.',
        'No smoking inside the car.',
        'Return the car clean and with the same fuel level.',
        'Use only A95 petrol when refueling.',
      ],
      limitsAndFees: {
        'Daily Mileage Limit': '180 km',
        'Overuse Fee': '3,500 đ/km',
        'Late Return Fee': '60,000 đ/hour',
        'Note': 'If the car is returned more than 30 minutes late, a 1-hour rate fee will apply.',
      },
    ),
  ];
}
