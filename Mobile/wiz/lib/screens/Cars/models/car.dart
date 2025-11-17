// models/car.dart
class Car {
  final String image;
  final String name;
  final double rating;
  final int reviews;
  final int price;
  final String owner;
  final String ownerAvatar;
  final String location;
  final int seats;
  final String fuel;
  final String type;
  final String transmission;
  final bool instant;
  final bool driver;
  final bool discount;

  Car({
    required this.image,
    required this.name,
    required this.rating,
    required this.reviews,
    required this.price,
    required this.owner,
    required this.ownerAvatar,
    required this.location,
    required this.seats,
    required this.fuel,
    required this.type,
    required this.transmission,
    required this.instant,
    required this.driver,
    required this.discount,
  });

  static List<Car> get sampleCars => [
    Car(
      image: 'assets/images/Car.png',
      name: 'BMW X-1 2020',
      rating: 4.8,
      reviews: 123,
      price: 820000,
      owner: 'John Doe',
      ownerAvatar: 'assets/images/Car_2.png',
      location: 'Ho Chi Minh City',
      seats: 5,
      fuel: 'Gasoline',
      type: 'Sedan',
      transmission: 'Automatic',
      instant: true,
      driver: true,
      discount: false,
    ),
    Car(
      image: 'assets/images/Car_2.png',
      name: 'BMW X-1 2020',
      rating: 4.9,
      reviews: 89,
      price: 860000,
      owner: 'Sarah Lee',
      ownerAvatar: 'assets/images/Car.png',
      location: 'Ho Chi Minh City',
      seats: 7,
      fuel: 'Hybrid',
      type: 'SUV',
      transmission: 'Semi-auto',
      instant: false,
      driver: true,
      discount: true,
    ),
    Car(
      image: 'assets/images/Car.png',
      name: 'Toyota Camry 2022',
      rating: 4.7,
      reviews: 200,
      price: 750000,
      owner: 'Mike Chen',
      ownerAvatar: 'assets/images/Car_2.png',
      location: 'Ho Chi Minh City',
      seats: 5,
      fuel: 'Gasoline',
      type: 'Sedan',
      transmission: 'Automatic',
      instant: true,
      driver: false,
      discount: true,
    ),
  ];
}
