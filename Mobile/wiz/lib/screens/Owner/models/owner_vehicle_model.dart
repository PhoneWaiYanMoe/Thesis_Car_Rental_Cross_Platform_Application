// lib/screens/Owner/models/owner_vehicle_model.dart

class OwnerVehicle {
  final String id;
  final String name;
  final String status;
  final int pricePerDay;
  final double rating;
  final int totalRentals;
  final String? primaryPhoto;
  final DateTime createdAt;
  final DateTime? lastVerified;
  final String verificationStatus;
  final DateTime? nextVerificationDue;

  OwnerVehicle({
    required this.id,
    required this.name,
    required this.status,
    required this.pricePerDay,
    required this.rating,
    required this.totalRentals,
    this.primaryPhoto,
    required this.createdAt,
    this.lastVerified,
    required this.verificationStatus,
    this.nextVerificationDue,
  });

  factory OwnerVehicle.fromJson(Map<String, dynamic> json) {
    return OwnerVehicle(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      status: json['status'] ?? 'pending',
      pricePerDay: json['pricePerDay'] ?? 0,
      rating: (json['rating'] ?? 0).toDouble(),
      totalRentals: json['totalRentals'] ?? 0,
      primaryPhoto: json['primaryPhoto'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      lastVerified: json['lastVerified'] != null ? DateTime.parse(json['lastVerified']) : null,
      verificationStatus: json['verificationStatus'] ?? 'pending',
      nextVerificationDue: json['nextVerificationDue'] != null ? DateTime.parse(json['nextVerificationDue']) : null,
    );
  }

  String get statusDisplay {
    switch (status) {
      case 'pending':
        return 'Pending Approval';
      case 'active':
        return 'Active';
      case 'stopped':
        return 'Stopped';
      case 'banned':
        return 'Banned';
      default:
        return status;
    }
  }

  String get formattedPrice {
    return pricePerDay.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }
}

class VehicleDetails {
  final String id;
  final String name;
  final String description;
  final VehicleSpecs specifications;
  final List<VehiclePhoto> photos;
  final List<String> features;
  final VehiclePricing pricing;
  final Map<String, dynamic> location;
  final VehicleAvailability availability;
  final VehiclePerformance performance;
  final Map<String, dynamic> rules;
  final String status;
  final String verificationStatus;
  final String? verificationNotes;
  final DateTime? lastVerified;
  final DateTime? nextVerificationDue;
  final DateTime createdAt;
  final DateTime updatedAt;

  VehicleDetails({
    required this.id,
    required this.name,
    required this.description,
    required this.specifications,
    required this.photos,
    required this.features,
    required this.pricing,
    required this.location,
    required this.availability,
    required this.performance,
    required this.rules,
    required this.status,
    required this.verificationStatus,
    this.verificationNotes,
    this.lastVerified,
    this.nextVerificationDue,
    required this.createdAt,
    required this.updatedAt,
  });

  factory VehicleDetails.fromJson(Map<String, dynamic> json) {
    final vehicle = json['vehicle'] ?? json;

    return VehicleDetails(
      id: vehicle['id'] ?? '',
      name: vehicle['name'] ?? '',
      description: vehicle['description'] ?? '',
      specifications: VehicleSpecs.fromJson(vehicle['specifications'] ?? {}),
      photos: (vehicle['photos'] as List<dynamic>?)?.map((p) => VehiclePhoto.fromJson(p)).toList() ?? [],
      features: List<String>.from(vehicle['features'] ?? []),
      pricing: VehiclePricing.fromJson(vehicle['pricing'] ?? {}),
      location: Map<String, dynamic>.from(vehicle['location'] ?? {}),
      availability: VehicleAvailability.fromJson(vehicle['availability'] ?? {}),
      performance: VehiclePerformance.fromJson(vehicle['performance'] ?? {}),
      rules: Map<String, dynamic>.from(vehicle['rules'] ?? {}),
      status: vehicle['status'] ?? 'pending',
      verificationStatus: vehicle['verificationStatus'] ?? 'pending',
      verificationNotes: vehicle['verificationNotes'],
      lastVerified: vehicle['lastVerified'] != null ? DateTime.parse(vehicle['lastVerified']) : null,
      nextVerificationDue: vehicle['nextVerificationDue'] != null
          ? DateTime.parse(vehicle['nextVerificationDue'])
          : null,
      createdAt: DateTime.parse(vehicle['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(vehicle['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class VehicleSpecs {
  final String vehicleType;
  final String transmission;
  final String fuelType;
  final int seats;
  final int year;
  final int mileage;
  final String licensePlate;

  VehicleSpecs({
    required this.vehicleType,
    required this.transmission,
    required this.fuelType,
    required this.seats,
    required this.year,
    required this.mileage,
    required this.licensePlate,
  });

  factory VehicleSpecs.fromJson(Map<String, dynamic> json) {
    return VehicleSpecs(
      vehicleType: json['vehicleType'] ?? '',
      transmission: json['transmission'] ?? '',
      fuelType: json['fuelType'] ?? '',
      seats: json['seats'] ?? 0,
      year: json['year'] ?? 0,
      mileage: json['mileage'] ?? 0,
      licensePlate: json['licensePlate'] ?? '',
    );
  }
}

class VehiclePhoto {
  final String url;
  final bool isPrimary;
  final int order;

  VehiclePhoto({required this.url, required this.isPrimary, required this.order});

  factory VehiclePhoto.fromJson(Map<String, dynamic> json) {
    return VehiclePhoto(url: json['url'] ?? '', isPrimary: json['isPrimary'] ?? false, order: json['order'] ?? 0);
  }
}

class VehiclePricing {
  final int pricePerDay;

  VehiclePricing({required this.pricePerDay});

  factory VehiclePricing.fromJson(Map<String, dynamic> json) {
    return VehiclePricing(pricePerDay: json['pricePerDay'] ?? 0);
  }
}

class VehicleAvailability {
  final bool driverSupported;
  final bool instantBooking;
  final bool deliveryAvailable;

  VehicleAvailability({required this.driverSupported, required this.instantBooking, required this.deliveryAvailable});

  factory VehicleAvailability.fromJson(Map<String, dynamic> json) {
    return VehicleAvailability(
      driverSupported: json['driverSupported'] ?? false,
      instantBooking: json['instantBooking'] ?? false,
      deliveryAvailable: json['deliveryAvailable'] ?? false,
    );
  }
}

class VehiclePerformance {
  final int totalRentals;
  final double rating;
  final int reviewCount;

  VehiclePerformance({required this.totalRentals, required this.rating, required this.reviewCount});

  factory VehiclePerformance.fromJson(Map<String, dynamic> json) {
    return VehiclePerformance(
      totalRentals: json['totalRentals'] ?? 0,
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
    );
  }
}
