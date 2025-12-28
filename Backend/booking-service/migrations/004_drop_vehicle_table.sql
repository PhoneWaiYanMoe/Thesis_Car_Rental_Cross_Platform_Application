
-- Step 1: Drop the foreign key constraint from bookings table
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_vehicle_id_fkey;

-- Step 2: Now we can safely drop the vehicles table
DROP TABLE IF EXISTS vehicles CASCADE;

-- Step 3: Drop vehicle_photos table if it exists (since it references vehicles)
DROP TABLE IF EXISTS vehicle_photos CASCADE;
