// Script to manually create Supabase storage buckets
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupBuckets() {
  console.log('Setting up Supabase storage buckets...');
  
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
  
  const requiredBuckets = [
    {
      name: 'photos',
      public: true
    },
    {
      name: 'training',
      public: false
    },
    {
      name: 'generations',
      public: true
    }
  ];
  
  // Get existing buckets
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
  console.log('Existing buckets:', existingBuckets?.map(b => b.name) || []);
  
  const existingBucketNames = existingBuckets?.map(bucket => bucket.name) || [];
  
  // Create missing buckets
  for (const bucket of requiredBuckets) {
    if (!existingBucketNames.includes(bucket.name)) {
      console.log(`Creating ${bucket.name} bucket...`);
      
      const { error: createError } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
      });
      
      if (createError) {
        console.error(`Error creating ${bucket.name} bucket:`, createError);
        continue;
      }
      
      // Set CORS policy for public buckets
      if (bucket.public) {
        try {
          console.log(`Setting CORS policy for ${bucket.name} bucket...`);
          const { error: corsError } = await supabase.storage.from(bucket.name).setPublic();
          
          if (corsError) {
            console.error(`Error setting public policy for ${bucket.name} bucket:`, corsError);
          }
        } catch (err) {
          console.error(`Error with CORS for ${bucket.name}:`, err);
        }
      }
      
      console.log(`Successfully created ${bucket.name} bucket`);
    } else {
      console.log(`Bucket ${bucket.name} already exists`);
    }
  }
  
  console.log('Storage bucket setup complete');
}

// Run the setup
setupBuckets().catch(console.error); 