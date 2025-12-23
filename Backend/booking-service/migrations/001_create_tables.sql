-- Backend/booking-service/migrations/001_create_tables.sql

-- Vehicles table (simplified for booking service)
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    photo VARCHAR(500),
    daily_rate INTEGER NOT NULL,
    transmission VARCHAR(50),
    seats INTEGER,
    fuel_type VARCHAR(50),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (simplified for booking service)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    booking_id UUID PRIMARY KEY,
    rental_id VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(user_id),
    owner_id UUID NOT NULL REFERENCES users(user_id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id),
    
    -- Timeline
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    duration_days INTEGER NOT NULL,
    
    -- Locations (stored as JSON)
    pickup_location JSONB NOT NULL,
    dropoff_location JSONB NOT NULL,
    
    -- Options
    driver_required BOOLEAN DEFAULT FALSE,
    insurance_coverage INTEGER DEFAULT 0,
    
    -- Pricing
    rental_price INTEGER NOT NULL,
    insurance_fee INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    deposit_amount INTEGER NOT NULL,
    remaining_payment INTEGER NOT NULL,
    
    -- Payment
    payment_method_id VARCHAR(255),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_transaction_id VARCHAR(255),
    final_payment_paid BOOLEAN DEFAULT FALSE,
    final_payment_transaction_id VARCHAR(255),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending_license_verification',
    -- Possible statuses:
    -- pending_license_verification
    -- pending_support_approval
    -- pending_owner_approval
    -- confirmed
    -- active
    -- pending_owner_confirmation
    -- completed
    -- cancelled
    -- rejected
    
    -- License information
    license_full_name VARCHAR(100),
    license_number VARCHAR(50),
    license_expiry_date DATE,
    license_front_photo VARCHAR(500),
    license_back_photo VARCHAR(500),
    license_verified BOOLEAN DEFAULT FALSE,
    
    -- Selfie verification
    front_selfie VARCHAR(500),
    left_selfie VARCHAR(500),
    right_selfie VARCHAR(500),
    selfies_verified BOOLEAN DEFAULT FALSE,
    
    -- Pickup confirmation
    pickup_condition_photos JSONB,
    pickup_condition_notes TEXT,
    pickup_odometer_reading INTEGER,
    pickup_confirmed_at TIMESTAMP,
    
    -- Return confirmation (customer)
    return_photos JSONB,
    return_odometer_reading INTEGER,
    return_notes TEXT,
    return_confirmed_at TIMESTAMP,
    
    -- Return confirmation (owner)
    owner_return_photos JSONB,
    owner_return_notes TEXT,
    damages_reported BOOLEAN DEFAULT FALSE,
    owner_return_odometer_reading INTEGER,
    owner_confirmed_return_at TIMESTAMP,
    
    -- Contract
    customer_signature TEXT,
    owner_signature TEXT,
    contract_signed_at TIMESTAMP,
    
    -- Additional
    additional_notes TEXT,
    
    -- Approval tracking
    owner_approved_at TIMESTAMP,
    support_approved_at TIMESTAMP,
    
    -- Cancellation
    cancellation_reason TEXT,
    cancellation_date TIMESTAMP,
    refund_amount INTEGER DEFAULT 0,
    refund_status VARCHAR(50),
    
    -- Rejection
    rejection_reason TEXT,
    rejected_at TIMESTAMP,
    
    -- Rating
    rated BOOLEAN DEFAULT FALSE,
    rating INTEGER,
    review TEXT,
    rated_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_rental_id ON bookings(rental_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);

-- Notifications table (for booking-related notifications)
CREATE TABLE IF NOT EXISTS booking_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(booking_id),
    user_id UUID NOT NULL REFERENCES users(user_id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON booking_notifications(user_id, is_read);
CREATE INDEX idx_notifications_booking ON booking_notifications(booking_id);

-- User licenses table (store reusable driving license per user)
CREATE TABLE IF NOT EXISTS user_licenses (
    license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    full_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    front_photo_url VARCHAR(500),
    back_photo_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)
);

CREATE INDEX idx_user_licenses_user ON user_licenses(user_id);

-- Insert sample vehicles for testing
INSERT INTO vehicles (vehicle_id, owner_id, name, photo, daily_rate, transmission, seats, fuel_type, location, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'BMW X1 2020', 
     'assets/images/Car.png', 390000, 'Automatic', 7, 'Gasoline', 'Nha Be, HCMC', true),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 'Toyota Camry 2022', 
     'assets/images/Car_2.png', 375000, 'Automatic', 5, 'Gasoline', 'District 1, HCMC', true),
    ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', 'Honda HR-V 2021', 
     'assets/images/Car.png', 350000, 'Automatic', 5, 'Gasoline', 'District 7, HCMC', true)
ON CONFLICT (vehicle_id) DO NOTHING;

-- Insert sample users for testing
INSERT INTO users (user_id, email, full_name, avatar_url, role)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440010', 'owner1@wiz.com', 'Rumbling', 'assets/images/Car_2.png', 'owner'),
    ('550e8400-e29b-41d4-a716-446655440011', 'owner2@wiz.com', 'Sarah Lee', 'assets/images/Car.png', 'owner'),
    ('550e8400-e29b-41d4-a716-446655440020', 'customer1@wiz.com', 'Jass Myatt', 'assets/images/article_2.png', 'customer')
ON CONFLICT (user_id) DO NOTHING;