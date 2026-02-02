-- Backend/user-service/src/migrations/004_add_devices_payments_status.sql

-- ============================================================
-- USER STATUS AND VERIFICATION UPDATES
-- ============================================================

-- Add license_status column for driver's license verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_status VARCHAR(20) DEFAULT 'unverified' 
CHECK (license_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Add owner_status column for owner verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_status VARCHAR(20) DEFAULT NULL 
CHECK (owner_status IN ('unverified', 'verified', 'rejected'));

-- Add status column for user account status
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'normal' 
CHECK (status IN ('normal', 'active', 'suspended', 'banned', 'deleted'));

-- Add license_url for storing uploaded license documents
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_url VARCHAR(500);

-- Update existing users based on role
UPDATE users SET status = 'normal' WHERE role = 'customer' AND status IS NULL;
UPDATE users SET status = 'active' WHERE role = 'support' AND status IS NULL;
UPDATE users SET status = NULL WHERE role = 'admin';

-- ============================================================
-- USER DEVICES TABLE (for Push Notifications)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    fcm_token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
    app_version VARCHAR(20),
    os_version VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, fcm_token)
);

-- Indexes for devices
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_fcm_token ON user_devices(fcm_token);
CREATE INDEX IF NOT EXISTS idx_devices_active ON user_devices(is_active);

-- ============================================================
-- PAYMENT METHODS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'paypal', 'bank_account', 'wallet')),
    provider VARCHAR(50), -- stripe, paypal, etc.
    provider_payment_method_id VARCHAR(255), -- External payment method ID
    
    -- Card details (encrypted/tokenized in production)
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Bank account details
    bank_account_last_four VARCHAR(4),
    bank_name VARCHAR(100),
    
    -- Common fields
    holder_name VARCHAR(100),
    billing_address JSONB,
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalid', 'deleted')),
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_methods_status ON payment_methods(status);

-- ============================================================
-- USER STATISTICS TABLE (for analytics)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_statistics (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Booking statistics (as customer)
    total_bookings_as_customer INTEGER DEFAULT 0,
    active_bookings_as_customer INTEGER DEFAULT 0,
    completed_bookings_as_customer INTEGER DEFAULT 0,
    cancelled_bookings_as_customer INTEGER DEFAULT 0,
    
    -- Rental statistics (as owner)
    total_rentals_as_owner INTEGER DEFAULT 0,
    active_rentals_as_owner INTEGER DEFAULT 0,
    completed_rentals_as_owner INTEGER DEFAULT 0,
    cancelled_rentals_as_owner INTEGER DEFAULT 0,
    
    -- Financial
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    total_earned DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Reviews
    average_rating_as_customer DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews_as_customer INTEGER DEFAULT 0,
    average_rating_as_owner DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews_as_owner INTEGER DEFAULT 0,
    
    -- Activity
    last_booking_date TIMESTAMP,
    last_rental_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize statistics for existing users
INSERT INTO user_statistics (user_id)
SELECT user_id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE user_devices IS 'Stores FCM tokens for push notifications';
COMMENT ON TABLE payment_methods IS 'User payment methods for bookings';
COMMENT ON TABLE user_statistics IS 'Cached user statistics for performance';

COMMENT ON COLUMN users.license_status IS 'Driver license verification status';
COMMENT ON COLUMN users.owner_status IS 'Owner verification status (only for owner role)';
COMMENT ON COLUMN users.status IS 'Account status: normal(customer default), active(support default), suspended, banned, deleted';