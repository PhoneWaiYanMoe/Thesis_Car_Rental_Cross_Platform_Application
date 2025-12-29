-- Backend/vehicle-service/src/migrations/003_fix_unavailability_booking_id.sql

-- Add booking_id column if it doesn't exist (it should from migration 002)
ALTER TABLE vehicle_unavailability 
ADD COLUMN IF NOT EXISTS booking_id VARCHAR(255);

-- Add index for booking_id lookups if not exists
CREATE INDEX IF NOT EXISTS idx_vehicle_unavailability_booking 
ON vehicle_unavailability(booking_id);

-- Add comment for clarity
COMMENT ON COLUMN vehicle_unavailability.booking_id IS 
'Booking ID reference - automatically removed when booking is cancelled or completed via gRPC from booking-service';

-- Note: We don't create a cleanup function here because:
-- 1. vehicle_unavailability is managed by vehicle-service
-- 2. bookings table is in booking-service database (different database)
-- 3. Cleanup happens via gRPC when booking status changes in booking-service
-- 4. See booking_controller.js cancelBooking() and owner_booking_controller.js confirmReturn()