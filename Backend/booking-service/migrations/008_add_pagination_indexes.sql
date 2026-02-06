-- Backend/booking-service/migrations/008_add_pagination_indexes.sql
-- Add indexes for pagination, sorting, and filtering

-- Index for pagination with status filter
CREATE INDEX IF NOT EXISTS idx_bookings_status_created 
ON bookings(status, created_at DESC);

-- Index for amount-based sorting
CREATE INDEX IF NOT EXISTS idx_bookings_amount_created 
ON bookings(total_amount DESC, created_at DESC);

-- Index for duration-based sorting
CREATE INDEX IF NOT EXISTS idx_bookings_duration_created 
ON bookings(duration_days DESC, created_at DESC);

-- Index for date range filtering
CREATE INDEX IF NOT EXISTS idx_bookings_date_range 
ON bookings(start_date, end_date, created_at DESC);

-- Composite index for common queries (status + date)
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates 
ON bookings(status, start_date, end_date);

-- Index for customer lookups with pagination
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status 
ON bookings(customer_id, status, created_at DESC);

-- Index for vehicle lookups with pagination
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_status 
ON bookings(vehicle_id, status, created_at DESC);

-- Full-text search preparation
-- This helps with searching booking IDs, vehicle IDs, customer IDs
CREATE INDEX IF NOT EXISTS idx_bookings_ids_search 
ON bookings(booking_id, vehicle_id, customer_id);

-- Add comments for documentation
COMMENT ON INDEX idx_bookings_status_created IS 
'Optimizes pagination queries filtered by status and sorted by date';

COMMENT ON INDEX idx_bookings_amount_created IS 
'Optimizes sorting by total amount';

COMMENT ON INDEX idx_bookings_duration_created IS 
'Optimizes sorting by booking duration';

COMMENT ON INDEX idx_bookings_date_range IS 
'Optimizes queries filtering by booking date ranges';

COMMENT ON INDEX idx_bookings_status_dates IS 
'Optimizes complex queries combining status and date filters';