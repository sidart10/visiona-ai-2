// Script to manually synchronize the current Clerk user to Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// You need to provide these values for your Clerk user
const CLERK_USER_ID = 'your_clerk_user_id'; // Get this from your Clerk dashboard
const CLERK_USER_EMAIL = 'your_email@example.com'; // Your email

async function syncUser() {
  console.log('Syncing user to Supabase database...');
  
  if (!CLERK_USER_ID || CLERK_USER_ID === 'your_clerk_user_id') {
    console.error('Error: Please edit the script and provide your actual Clerk user ID');
    return;
  }
  
  if (!CLERK_USER_EMAIL || CLERK_USER_EMAIL === 'your_email@example.com') {
    console.error('Error: Please edit the script and provide your actual email');
    return;
  }
  
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
  
  try {
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', CLERK_USER_ID)
      .limit(1);
      
    if (checkError) {
      console.error('Error checking for existing user:', checkError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('User already exists in Supabase:', existingUsers[0]);
      return;
    }
    
    // Insert user into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          clerk_id: CLERK_USER_ID,
          email: CLERK_USER_EMAIL
        }
      ])
      .select();
      
    if (error) {
      console.error('Error creating user in Supabase:', error);
      return;
    }
    
    console.log('User successfully created in Supabase:', data[0]);
    
  } catch (err) {
    console.error('Error syncing user:', err);
  }
}

// Run the script
syncUser().catch(console.error); 