-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('Sedan', 'SUV', 'Hatchback', 'Van', 'Other')),
    seater INTEGER NOT NULL CHECK (seater IN (4, 5, 7, 9)),
    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Other')),
    transmission VARCHAR(50) NOT NULL CHECK (transmission IN ('Automatic', 'Manual', 'Semi-Auto')),
    year INTEGER NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    mileage INTEGER,
    location VARCHAR(255),
    availability VARCHAR(50) CHECK (availability IN ('Instant Booking', 'Driver Supported', 'Discount Available')),
    insurance_type VARCHAR(50) CHECK (insurance_type IN ('Basic', 'Standard', 'Premium', 'Comprehensive')),
    rating DECIMAL(2, 1) DEFAULT 0.0,
    total_rentals INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'stopped', 'banned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Vehicle features table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS vehicle_features (
    id SERIAL PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
);

-- Vehicle images table
CREATE TABLE IF NOT EXISTS vehicle_images (
    id SERIAL PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicle_features_vehicle ON vehicle_features(vehicle_id);
CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);