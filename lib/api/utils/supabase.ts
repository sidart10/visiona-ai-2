import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase authentication
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Error message for missing environment variables
const missingEnvMessage = 'Missing Supabase environment variables';

// Initialize Supabase client for server-side operations (with admin privileges)
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-supabase-role': 'service_role',
      },
    },
  }
);

// Initialize Supabase client for client-side operations (with limited privileges)
export const supabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Upload file to Supabase Storage
export async function uploadToStorage(
  bucket: string,
  filePath: string,
  file: File | Blob,
  options = {}
) {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(missingEnvMessage);
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        ...options,
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error uploading to Supabase storage:', error);
    throw error;
  }
}

// Get public URL for a file in Supabase Storage
export function getPublicUrl(bucket: string, filePath: string) {
  if (!supabaseUrl) {
    throw new Error(missingEnvMessage);
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// Delete file from Supabase Storage
export async function deleteFromStorage(bucket: string, filePath: string) {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(missingEnvMessage);
  }

  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from Supabase storage:', error);
    throw error;
  }
}

// List files in a bucket/folder
export async function listFiles(bucket: string, folderPath?: string) {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(missingEnvMessage);
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(folderPath || '');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error listing files from Supabase storage:', error);
    throw error;
  }
} 