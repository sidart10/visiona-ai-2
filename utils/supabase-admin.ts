import { createClient } from '@supabase/supabase-js';

// This client has admin/service-role privileges and should only be used in server-side code
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-supabase-role': 'service_role',
      },
    },
  });
};

export const supabaseAdmin = createAdminClient();

// User management functions
export async function getOrCreateUser(clerkId: string, email: string) {
  try {
    console.log(`Looking for user with clerk_id: ${clerkId}`);
    
    // First try to get the user
    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();
    
    if (error) {
      console.log('Error finding user:', error.message);
      
      if (error.code === 'PGRST116' || error.message.includes('found no rows')) {
        console.log('Creating new user');
        
        // Create the user if not found
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: clerkId,
            email: email,
            created_at: new Date().toISOString(),
          })
          .select('*')
          .single();
        
        if (createError) {
          console.error('Error creating user:', createError);
          throw createError;
        }
        
        return newUser;
      } else {
        // Some other error occurred
        throw error;
      }
    }
    
    return user;
  } catch (err) {
    console.error('Exception in getOrCreateUser:', err);
    throw err;
  }
} 