// Script to configure CORS for Supabase storage buckets
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupCors() {
  console.log('Setting up CORS for Supabase storage buckets...');
  
  // Create Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  const publicBuckets = ['photos', 'generations'];
  
  for (const bucketName of publicBuckets) {
    try {
      console.log(`Setting bucket ${bucketName} to public...`);
      
      // Update bucket to be public
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });
      
      if (updateError) {
        console.error(`Error updating ${bucketName} bucket:`, updateError);
        continue;
      }
      
      console.log(`Successfully made ${bucketName} bucket public`);
    } catch (err) {
      console.error(`Error with ${bucketName}:`, err);
    }
  }
  
  console.log('CORS configuration complete');
}

// Run the setup
setupCors().catch(console.error); 