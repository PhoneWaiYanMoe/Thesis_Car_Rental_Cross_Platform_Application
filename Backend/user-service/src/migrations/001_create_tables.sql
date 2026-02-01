-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'owner', 'admin', 'support')),
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTPs table (for email verification and password reset)
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, type)
);

-- OAuth accounts table (social media logins)
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    profile_data JSONB, -- Store additional profile info
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_otps_email_type ON otps(email, type);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);
CREATE INDEX idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider_user ON oauth_accounts(provider, provider_user_id);

-- Seed mock users for testing (owner and customer)
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_verified, avatar_url)
VALUES
  -- Owner account (matches booking-service seed owner_id)
  ('550e8400-e29b-41d4-a716-446655440010',
   'owner1@wiz.com',
   '$2b$10$Fzb0rZVkkA1dNLJ3z0yzxuQCxpDBL8par8c8KPU.jlhzblFkGJy7a', -- OwnerPass123!
   'Rumbling',
   '+84 900 000 001',
   'owner',
   TRUE,
   'assets/images/Car_2.png'),
  -- Customer account (for booking flow)
  ('550e8400-e29b-41d4-a716-446655440020',
   'customer1@wiz.com',
   '$2b$10$Ba8FaVfFXDFUcRlLDOtcwezJsrtigUZF5TvjeJ55nXOIlCzm3aKry', -- UserPass123!
   'Jass Myatt',
   '+84 900 000 002',
   'customer',
   TRUE,
   'assets/images/article_2.png')
ON CONFLICT (user_id) DO NOTHING;