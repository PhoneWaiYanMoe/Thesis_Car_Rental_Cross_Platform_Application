-- Backend/vehicle-service/src/migrations/004_add_revenue_tracking_and_status_updates.sql

-- ✅ 1. Update vehicle status enum to include 'deactivated' and 'unverified'
ALTER TABLE vehicles 
DROP CONSTRAINT IF EXISTS vehicles_status_check;

ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_status_check 
CHECK (status IN ('pending', 'active', 'deactivated', 'stopped', 'banned'));

-- ✅ 2. Update verification_status enum to include 'unverified' and 'denied'
ALTER TABLE vehicles 
DROP CONSTRAINT IF EXISTS vehicles_verification_status_check;

ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_verification_status_check 
CHECK (verification_status IN ('unverified', 'pending', 'approved', 'denied', 'rejected'));

-- ✅ 3. Add total revenue earned column
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS total_revenue_earned BIGINT DEFAULT 0;

-- ✅ 4. Create vehicle revenue history table
CREATE TABLE IF NOT EXISTS vehicle_revenue_history (
    revenue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    booking_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ 5. Add indexes for revenue tracking
CREATE INDEX IF NOT EXISTS idx_vehicle_revenue_vehicle ON vehicle_revenue_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_revenue_booking ON vehicle_revenue_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_revenue_earned_at ON vehicle_revenue_history(earned_at DESC);

-- ✅ 6. Add index for verification due date sorting
CREATE INDEX IF NOT EXISTS idx_vehicles_next_verification_due ON vehicles(next_verification_due);

-- ✅ 7. Add index for total rentals sorting
CREATE INDEX IF NOT EXISTS idx_vehicles_total_rentals ON vehicles(total_rentals DESC);

-- ✅ 8. Add index for vehicle name sorting
CREATE INDEX IF NOT EXISTS idx_vehicles_name ON vehicles(name);

-- ✅ 9. Update existing vehicles to have 'unverified' status by default if they are currently 'pending'
UPDATE vehicles 
SET verification_status = 'unverified' 
WHERE verification_status = 'pending' AND status = 'pending';

-- ✅ 10. Comment on new columns
COMMENT ON COLUMN vehicles.total_revenue_earned IS 
'Total revenue this vehicle has earned from all completed bookings (in VND)';

COMMENT ON TABLE vehicle_revenue_history IS 
'Historical record of all revenue earned by each vehicle from completed bookings';

COMMENT ON COLUMN vehicle_revenue_history.amount IS 
'Amount earned from a specific booking (in VND)';

COMMENT ON COLUMN vehicle_revenue_history.booking_id IS 
'Reference to the booking that generated this revenue';