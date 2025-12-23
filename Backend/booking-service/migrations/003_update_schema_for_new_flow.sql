-- Update booking status to include new flow statuses
-- pending → booking → picked_up → return_submitted → dispute_opened/completed → under_review → completed/completed_with_charge

-- Add new columns for dispute handling
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cs_assigned_id UUID,
ADD COLUMN IF NOT EXISTS cs_notes TEXT,
ADD COLUMN IF NOT EXISTS cs_decision VARCHAR(50),
ADD COLUMN IF NOT EXISTS additional_charge INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS no_show BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_show_checked_at TIMESTAMP;

-- Add index for CS queries
CREATE INDEX IF NOT EXISTS idx_bookings_cs_assigned ON bookings(cs_assigned_id) WHERE cs_assigned_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_dispute ON bookings(status) WHERE status IN ('dispute_opened', 'under_review');

-- Note: Customer support role should be added to user-service users table
-- This migration just documents it for reference:
-- ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('customer', 'owner', 'admin', 'customer-support'));