-- TRIGGER WORD MIGRATION SQL
-- Run this in the Supabase SQL editor to fix missing trigger words

-- Update models with NULL trigger_word but with a description containing "trigger word"
UPDATE models
SET trigger_word = 
  (REGEXP_MATCH(description, 'trigger word "([^"]+)"'))[1],
  updated_at = NOW()
WHERE 
  (trigger_word IS NULL OR trigger_word = '') 
  AND description LIKE '%trigger word%';

-- For models where that didn't work, use the model name as the trigger word
UPDATE models
SET trigger_word = name,
    updated_at = NOW()
WHERE 
  (trigger_word IS NULL OR trigger_word = '')
  AND name IS NOT NULL;

-- Update any 'succeeded' models to have status 'completed'
UPDATE models
SET status = 'completed',
    updated_at = NOW()
WHERE LOWER(status) = 'succeeded';

-- Fix any models that have been stuck in processing for too long (more than 1 day)
UPDATE models
SET status = 'failed',
    error_message = 'Processing timed out',
    updated_at = NOW()
WHERE 
  LOWER(status) IN ('processing', 'pending', 'starting', 'queued')
  AND updated_at < NOW() - INTERVAL '1 day';

-- Report changes
SELECT 
  COUNT(*) FILTER (WHERE trigger_word IS NOT NULL) AS models_with_trigger_words,
  COUNT(*) FILTER (WHERE LOWER(status) = 'completed') AS completed_models,
  COUNT(*) FILTER (WHERE LOWER(status) = 'processing') AS processing_models,
  COUNT(*) FILTER (WHERE LOWER(status) = 'failed') AS failed_models
FROM models; 