-- Location history table
CREATE TABLE IF NOT EXISTS location_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    display_name VARCHAR(500) NOT NULL,
    short_name VARCHAR(255),
    subtitle VARCHAR(500),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service areas table (for future use)
CREATE TABLE IF NOT EXISTS service_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lon DOUBLE PRECISION NOT NULL,
    radius_km INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_location_history_user ON location_history(user_id);
CREATE INDEX idx_location_history_created ON location_history(created_at DESC);
CREATE INDEX idx_location_history_coords ON location_history(latitude, longitude);

-- Insert default service area (Ho Chi Minh City)
INSERT INTO service_areas (name, center_lat, center_lon, radius_km) 
VALUES ('Ho Chi Minh City', 10.8231, 106.6297, 50);