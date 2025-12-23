-- Backend/booking-service/migrations/002_refactor_schema.sql

-- Drop old tables and constraints
DROP TABLE IF EXISTS booking_notifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS user_licenses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Vehicles table (simplified - owner is just a user_id with role='owner')
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id UUID PRIMARY KEY,
    user_id UUID NOT NULL, -- Changed from owner_id to user_id
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

-- User verifications table (stores license + selfies for reuse)
CREATE TABLE IF NOT EXISTS user_verifications (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Driving License
    license_full_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    license_expiry_date DATE NOT NULL,
    license_front_photo VARCHAR(500) NOT NULL,
    license_back_photo VARCHAR(500) NOT NULL,
    license_verified BOOLEAN DEFAULT TRUE,
    
    -- Selfie Verification (3 photos required)
    front_selfie VARCHAR(500) NOT NULL,
    left_selfie VARCHAR(500) NOT NULL,
    right_selfie VARCHAR(500) NOT NULL,
    selfies_verified BOOLEAN DEFAULT TRUE,
    
    -- Overall status
    is_verified BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_verifications_user ON user_verifications(user_id);

-- Bookings table (refactored)
CREATE TABLE IF NOT EXISTS bookings (
    booking_id UUID PRIMARY KEY,
    customer_id UUID NOT NULL, -- User who books (role=customer)
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
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Possible statuses:
    -- pending (waiting for owner approval)
    -- booking (owner approved, waiting for booking day)
    -- on-journey (car picked up, currently in use)
    -- completed (car returned)
    -- cancelled (cancelled by customer or owner)
    
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
    contract_signed_at TIMESTAMP,
    
    -- Additional
    additional_notes TEXT,
    
    -- Approval tracking
    owner_approved_at TIMESTAMP,
    
    -- Cancellation
    cancellation_reason TEXT,
    cancellation_date TIMESTAMP,
    refund_amount INTEGER DEFAULT 0,
    refund_status VARCHAR(50),
    
    -- Rejection
    rejection_reason TEXT,
    rejected_at TIMESTAMP,
    
    -- Review tracking
    vehicle_reviewed BOOLEAN DEFAULT FALSE,
    owner_reviewed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);

-- Notifications table
CREATE TABLE IF NOT EXISTS booking_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(booking_id),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON booking_notifications(user_id, is_read);
CREATE INDEX idx_notifications_booking ON booking_notifications(booking_id);

-- Insert sample vehicles
INSERT INTO vehicles (vehicle_id, user_id, name, photo, daily_rate, transmission, seats, fuel_type, location, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'BMW X1 2020', 
     'assets/images/Car.png', 390000, 'Automatic', 7, 'Gasoline', 'Nha Be, HCMC', true),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 'Toyota Camry 2022', 
     'assets/images/Car_2.png', 375000, 'Automatic', 5, 'Gasoline', 'District 1, HCMC', true),
    ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', 'Honda HR-V 2021', 
     'assets/images/Car.png', 350000, 'Automatic', 5, 'Gasoline', 'District 7, HCMC', true)
ON CONFLICT (vehicle_id) DO NOTHING;