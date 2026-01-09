-- Backend/user-service/src/migrations/003_add_favorites.sql

-- User favorite vehicles table
CREATE TABLE IF NOT EXISTS user_favorite_vehicles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vehicle_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON user_favorite_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vehicle_id ON user_favorite_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created ON user_favorite_vehicles(created_at DESC);

-- Comment
COMMENT ON TABLE user_favorite_vehicles IS 
'Stores user favorite vehicles. Vehicle info fetched via gRPC from vehicle-service.';