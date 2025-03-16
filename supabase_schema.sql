-- Table: users (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: photos
DROP TABLE IF EXISTS photos CASCADE;
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    original_filename TEXT,
    file_size BIGINT,
    content_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: models
DROP TABLE IF EXISTS models CASCADE;
CREATE TABLE models (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trained_at TIMESTAMP
);

-- Table: model_photos
DROP TABLE IF EXISTS model_photos CASCADE;
CREATE TABLE model_photos (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(255) REFERENCES models(id) ON DELETE CASCADE,
    photo_id INT REFERENCES photos(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: generations
DROP TABLE IF EXISTS generations CASCADE;
CREATE TABLE generations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    model_id VARCHAR(255) REFERENCES models(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    width INT DEFAULT 512,
    height INT DEFAULT 512,
    steps INT DEFAULT 30,
    guidance_scale FLOAT DEFAULT 7.5,
    seed BIGINT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS users_policy ON users;
DROP POLICY IF EXISTS photos_policy ON photos;
DROP POLICY IF EXISTS models_policy ON models;
DROP POLICY IF EXISTS model_photos_policy ON model_photos;
DROP POLICY IF EXISTS generations_policy ON generations;

-- Create security policies
-- Users can only access their own record
CREATE POLICY users_policy ON users
    USING (clerk_id = auth.uid()::text);

-- Photo policies - only owner can access
CREATE POLICY photos_policy ON photos
    USING (user_id = auth.uid()::text);

-- Model policies - only owner can access
CREATE POLICY models_policy ON models
    USING (user_id = auth.uid()::text);

-- Model photos policies - only owner of the model can access
CREATE POLICY model_photos_policy ON model_photos
    USING (user_id = auth.uid()::text);

-- Generation policies - only owner can access
CREATE POLICY generations_policy ON generations
    USING (user_id = auth.uid()::text); 