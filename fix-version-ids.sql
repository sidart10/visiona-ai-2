-- Script to fix models with missing version_id and replicate_version
-- Run this in the Supabase SQL Editor

-- First, examine the models with missing version information
SELECT 
  id, 
  name, 
  status, 
  trigger_word,
  version_id,
  replicate_version,
  trained_at,
  created_at
FROM 
  models
WHERE 
  (version_id IS NULL OR replicate_version IS NULL)
  AND (status = 'completed' OR status = 'Ready');

-- Update models with missing version_id to use a default value
-- For Flux/SDXL models, we'll use the standard version ID
UPDATE models
SET 
  version_id = '26a1a203d7a8d2c8d5b5f13953a8068a9dd0bcc04d2459baa54b13d9cb63136a',
  replicate_version = '26a1a203d7a8d2c8d5b5f13953a8068a9dd0bcc04d2459baa54b13d9cb63136a',
  updated_at = CURRENT_TIMESTAMP
WHERE 
  (version_id IS NULL OR replicate_version IS NULL)
  AND (status = 'completed' OR status = 'Ready');

-- Verify the updates worked
SELECT 
  id, 
  name, 
  status, 
  trigger_word,
  version_id,
  replicate_version,
  trained_at,
  created_at
FROM 
  models
WHERE 
  status = 'completed' OR status = 'Ready'; 