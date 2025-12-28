ALTER TABLE vehicle_unavailability 
ADD COLUMN IF NOT EXISTS booking_id VARCHAR(255);

-- Add index for booking_id lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_unavailability_booking 
ON vehicle_unavailability(booking_id);

-- Add comment for clarity
COMMENT ON TABLE vehicle_unavailability IS 
'Stores periods when vehicles are unavailable (bookings + manual blocks by owner)';

COMMENT ON TABLE vehicle_verification_photos IS 
'Stores periodic re-verification photos (every 2 months) - admin verifies vehicle condition';

COMMENT ON TABLE vehicle_photos IS 
'Stores multiple photos per vehicle with ordering and primary photo designation';