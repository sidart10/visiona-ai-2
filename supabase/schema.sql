-- Create tables for Visiona app

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL, -- Identifier from Clerk
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: photos
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    storage_path TEXT NOT NULL, -- Path in Supabase storage
    file_url TEXT NOT NULL, -- Public URL for the photo
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: models
CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    model_id TEXT NOT NULL, -- Replicate training ID
    trigger_word VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Processing', -- Statuses: Processing, Ready, Failed
    parameters JSONB NOT NULL, -- Stores training parameters (trainingSteps, loraRank, etc.)
    version_id TEXT, -- Replicate version ID after successful training
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: model_photos (joining table between models and photos)
CREATE TABLE IF NOT EXISTS model_photos (
    id SERIAL PRIMARY KEY,
    model_id INT REFERENCES models(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL, -- URL of photo used for training
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: generations
CREATE TABLE IF NOT EXISTS generations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    model_id INT REFERENCES models(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    enhanced_prompt TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    stripe_charge_id VARCHAR(255) UNIQUE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: audit_logs (for security and tracking events)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255), -- Clerk user ID
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_photos ENABLE ROW LEVEL SECURITY;

-- Allow users to view and modify only their own data
CREATE POLICY users_policy ON users
    USING (clerk_id = auth.uid()::text);

CREATE POLICY photos_policy ON photos
    USING (user_id = auth.uid()::text);

CREATE POLICY models_policy ON models
    USING (user_id = auth.uid()::text);

CREATE POLICY model_photos_policy ON model_photos
    USING (model_id IN (
        SELECT id FROM models 
        WHERE user_id = auth.uid()::text
    ));

CREATE POLICY generations_policy ON generations
    USING (user_id = auth.uid()::text);

CREATE POLICY payments_policy ON payments
    USING (user_id = auth.uid()::text);

-- Audit logs can only be viewed by the user they belong to
CREATE POLICY audit_logs_policy ON audit_logs
    USING (user_id = auth.uid()::text);

-- Create Storage buckets
-- 1. 'photos' bucket for storing user uploaded photos
-- 2. 'training' bucket for storing zipped training files
-- 3. 'generations' bucket for storing generated images 