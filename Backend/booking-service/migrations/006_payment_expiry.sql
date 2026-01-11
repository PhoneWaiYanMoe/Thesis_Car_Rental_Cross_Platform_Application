-- Backend/booking-service/migrations/006_add_payment_expiry.sql
-- ✅ Add payment expiry column for 30-minute timeout

-- Add payment_expiry column
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_expiry TIMESTAMP;

-- Add index for checking expired payments
CREATE INDEX IF NOT EXISTS idx_bookings_payment_expiry 
ON bookings(status, payment_expiry) 
WHERE status = 'pending_payment';

-- Add comment
COMMENT ON COLUMN bookings.payment_expiry IS 
'Timestamp when payment window expires (30 minutes from booking creation). Booking auto-cancelled if payment not completed by this time.';

-- Update existing pending_payment bookings to have expiry (if any exist)
UPDATE bookings 
SET payment_expiry = created_at + INTERVAL '30 minutes'
WHERE status = 'pending_payment' 
AND payment_expiry IS NULL;