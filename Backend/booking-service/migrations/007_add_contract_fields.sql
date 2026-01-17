-- Backend/booking-service/migrations/007_add_contract_fields.sql
-- Add contract management fields to bookings table

-- Platform-generated contract
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS platform_contract_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS contract_generated_at TIMESTAMP;

-- Owner custom contract (optional)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS owner_contract_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS owner_contract_uploaded_at TIMESTAMP;

-- Signed contract (uploaded by customer)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS signed_contract_url VARCHAR(500);

-- Remove old signature field (we now use file upload instead)
ALTER TABLE bookings 
DROP COLUMN IF EXISTS customer_signature;

-- Add indexes for contract queries
CREATE INDEX IF NOT EXISTS idx_bookings_contracts 
ON bookings(booking_id, platform_contract_url, owner_contract_url, signed_contract_url);

-- Add comments
COMMENT ON COLUMN bookings.platform_contract_url IS 
'Auto-generated contract PDF file ID from media service';

COMMENT ON COLUMN bookings.owner_contract_url IS 
'Owner-uploaded custom contract file ID (optional, overrides platform contract)';

COMMENT ON COLUMN bookings.signed_contract_url IS 
'Customer-uploaded signed contract file ID (photo/scan of signed document)';

COMMENT ON COLUMN bookings.contract_signed_at IS 
'Timestamp when customer uploaded the signed contract';

COMMENT ON COLUMN bookings.contract_generated_at IS 
'Timestamp when platform contract was auto-generated';