-- QUICK FIX SQL FOR VISIONA MODELS
-- Copy and paste this into the Supabase SQL editor

-- 1. Update trigger words based on descriptions
UPDATE models
SET 
  trigger_word = (REGEXP_MATCH(description, 'trigger word "([^"]+)"'))[1],
  updated_at = NOW()
WHERE 
  (trigger_word IS NULL OR trigger_word = '') 
  AND description LIKE '%trigger word%';

-- 2. For any remaining models without trigger words, use the name
UPDATE models
SET 
  trigger_word = name,
  updated_at = NOW()
WHERE 
  (trigger_word IS NULL OR trigger_word = '')
  AND name IS NOT NULL;

-- 3. Fix status capitalization to be consistent
UPDATE models
SET 
  status = 'completed'
WHERE LOWER(status) = 'ready' OR LOWER(status) = 'succeeded';

-- 4. Mark old "processing" models as completed if they've been in that state for over 6 hours
UPDATE models
SET 
  status = 'completed',
  updated_at = NOW()
WHERE 
  LOWER(status) = 'processing' 
  AND updated_at < NOW() - INTERVAL '6 hours';

-- 5. Check results
SELECT 
  id, 
  name, 
  trigger_word, 
  status, 
  updated_at
FROM models
ORDER BY updated_at DESC; 