/**
 * Utility to set up Supabase storage buckets
 */
import { createClient } from '@supabase/supabase-js';

/**
 * Sets up the required storage buckets in Supabase if they don't exist
 */
export async function setupStorageBuckets() {
  console.log('Setting up Supabase storage buckets...');
  
  // Create Supabase client with service role (admin access)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5 * 1024 * 1024 // 5MB
    },
    {
      name: 'training',
      public: false,
      allowedMimeTypes: ['application/zip'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    },
    {
      name: 'generations',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB
    }
  ];
  
  // Get existing buckets
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
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
        const { error: corsError } = await supabase.storage.updateBucket(bucket.name, {
          allowedMimeTypes: bucket.allowedMimeTypes,
          fileSizeLimit: bucket.fileSizeLimit,
          corsRules: [
            {
              origin: '*',
              methods: ['GET'],
              allowedHeaders: ['*'],
              maxAgeSeconds: 3600,
            },
          ],
        });
        
        if (corsError) {
          console.error(`Error setting CORS policy for ${bucket.name} bucket:`, corsError);
        }
      }
      
      console.log(`Successfully created ${bucket.name} bucket`);
    } else {
      console.log(`Bucket ${bucket.name} already exists`);
    }
  }
  
  console.log('Storage bucket setup complete');
}

/**
 * This function can be run in a server context to initialize the storage buckets
 * Example usage in a Next.js API route:
 * 
 * import { setupStorageBuckets } from '@/utils/supabase/setup-storage';
 * 
 * export default async function handler(req, res) {
 *   if (req.method === 'POST' && req.headers['x-admin-key'] === process.env.ADMIN_SECRET) {
 *     await setupStorageBuckets();
 *     return res.status(200).json({ success: true });
 *   }
 *   return res.status(405).json({ error: 'Method not allowed' });
 * }
 */ 