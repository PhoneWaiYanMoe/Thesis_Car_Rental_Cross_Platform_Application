-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Specifications
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'hatchback', 'van')),
    transmission VARCHAR(50) NOT NULL CHECK (transmission IN ('automatic', 'manual', 'semi-auto')),
    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
    seats INTEGER NOT NULL,
    year INTEGER NOT NULL,
    mileage INTEGER NOT NULL,
    license_plate VARCHAR(50) NOT NULL UNIQUE,
    
    -- Pricing
    price_per_day INTEGER NOT NULL,
    
    -- Location (stored as JSONB)
    location JSONB NOT NULL,
    
    -- Features and rules (stored as JSONB)
    features JSONB DEFAULT '[]'::jsonb,
    rules JSONB,
    
    -- Photos and documents
    photos JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Availability options
    driver_supported BOOLEAN DEFAULT FALSE,
    instant_booking BOOLEAN DEFAULT FALSE,
    delivery_available BOOLEAN DEFAULT FALSE,
    
    -- Performance metrics
    total_rentals INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Status and verification
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'stopped', 'banned')),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verification_notes TEXT,
    last_verified_at TIMESTAMP,
    next_verification_due TIMESTAMP,
    
    -- Admin fields
    rejection_reason TEXT,
    banned_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle photos table (for better management)
CREATE TABLE IF NOT EXISTS vehicle_photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle verification photos (periodic verification)
CREATE TABLE IF NOT EXISTS vehicle_verification_photos (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    photo_urls JSONB NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by UUID,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    notes TEXT
);

-- Vehicle unavailability periods (for maintenance, owner blocks, etc.)
CREATE TABLE IF NOT EXISTS vehicle_unavailability (
    unavailability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle discounts
CREATE TABLE IF NOT EXISTS vehicle_discounts (
    discount_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_location ON vehicles USING GIN (location);
CREATE INDEX idx_vehicles_rating ON vehicles(average_rating DESC);
CREATE INDEX idx_vehicles_price ON vehicles(price_per_day);
CREATE INDEX idx_vehicles_created ON vehicles(created_at DESC);

CREATE INDEX idx_vehicle_photos_vehicle ON vehicle_photos(vehicle_id);
CREATE INDEX idx_vehicle_photos_primary ON vehicle_photos(vehicle_id, is_primary);

CREATE INDEX idx_vehicle_unavailability_vehicle ON vehicle_unavailability(vehicle_id);
CREATE INDEX idx_vehicle_unavailability_dates ON vehicle_unavailability(start_date, end_date);

CREATE INDEX idx_vehicle_discounts_vehicle ON vehicle_discounts(vehicle_id);
CREATE INDEX idx_vehicle_discounts_active ON vehicle_discounts(vehicle_id, is_active, valid_from, valid_until);

-- Insert sample vehicles for testing
INSERT INTO vehicles (
    vehicle_id, owner_id, name, description,
    vehicle_type, transmission, fuel_type, seats, year, mileage, license_plate,
    price_per_day, location, features, status, verification_status, last_verified_at
) VALUES 
    (
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440010', -- owner1@wiz.com
        'BMW X1 2020',
        'Luxury SUV in excellent condition with advanced safety features',
        'suv', 'automatic', 'gasoline', 7, 2020, 45000, '51A-12345',
        390000,
        '{"address": "123 Le Duan, District 1", "city": "Ho Chi Minh City", "district": "District 1", "coordinates": {"lat": 10.7769, "lng": 106.7009}}'::jsonb,
        '["AC", "GPS", "Bluetooth", "USB", "Backup Camera", "Sunroof"]'::jsonb,
        'active', 'approved', NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440010',
        'Toyota Camry 2022',
        'Brand new sedan with low mileage',
        'sedan', 'automatic', 'gasoline', 5, 2022, 12000, '51B-67890',
        375000,
        '{"address": "456 Nguyen Hue, District 1", "city": "Ho Chi Minh City", "district": "District 1", "coordinates": {"lat": 10.7752, "lng": 106.7003}}'::jsonb,
        '["AC", "GPS", "USB", "Apple CarPlay"]'::jsonb,
        'active', 'approved', NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440011', -- owner2@wiz.com
        'Honda HR-V 2021',
        'Compact SUV perfect for city driving',
        'suv', 'automatic', 'gasoline', 5, 2021, 28000, '59A-11111',
        350000,
        '{"address": "789 Nguyen Van Linh, District 7", "city": "Ho Chi Minh City", "district": "District 7", "coordinates": {"lat": 10.7295, "lng": 106.7019}}'::jsonb,
        '["AC", "GPS", "USB"]'::jsonb,
        'active', 'approved', NOW()
    )
ON CONFLICT (vehicle_id) DO NOTHING;

-- Insert sample photos
INSERT INTO vehicle_photos (vehicle_id, photo_url, is_primary, display_order) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'assets/images/Car.png', true, 1),
    ('550e8400-e29b-41d4-a716-446655440001', 'assets/images/Car_2.png', false, 2),
    ('550e8400-e29b-41d4-a716-446655440002', 'assets/images/Car_2.png', true, 1),
    ('550e8400-e29b-41d4-a716-446655440003', 'assets/images/Car.png', true, 1)
ON CONFLICT DO NOTHING;