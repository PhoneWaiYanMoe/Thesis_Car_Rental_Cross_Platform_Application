ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS owner_signed_contract_url TEXT,
  ADD COLUMN IF NOT EXISTS owner_contract_signed_at TIMESTAMP;