class Car {
  final String id;
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
    required this.id,
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
}
