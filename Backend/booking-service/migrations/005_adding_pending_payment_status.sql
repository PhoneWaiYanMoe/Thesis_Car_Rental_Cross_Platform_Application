-- Backend/booking-service/migrations/005_add_pending_payment_status.sql

-- Add 'pending_payment' status to bookings
-- This status means booking is created but deposit payment is not yet completed

-- Note: In PostgreSQL, we can't directly modify CHECK constraints
-- So we'll drop and recreate if needed, or just ensure app handles it

COMMENT ON COLUMN bookings.status IS 
'Booking statuses:
- pending_payment: Booking created, waiting for deposit payment
- pending: Deposit paid, waiting for owner approval
- booking: Owner approved, waiting for booking day
- picked_up: Car picked up, currently in use
- return_submitted: Customer returned car
- dispute_opened: Owner reported issues
- under_review: Customer support reviewing dispute
- completed: Booking completed successfully
- completed_with_charge: Completed with additional charges
- cancelled: Booking cancelled';

-- Update existing pending bookings to pending_payment if deposit not paid
UPDATE bookings 
SET status = 'pending_payment' 
WHERE status = 'pending' 
AND deposit_paid = false;