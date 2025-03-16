import { createClient } from '@supabase/supabase-js';

/**
 * Uploads a file to Supabase Storage
 * @param file File object to upload
 * @param userId User ID associated with the file
 * @param bucket The storage bucket to use ('photos' or 'generations')
 * @returns Object with file URL or error
 */
export async function uploadFileToStorage(
  file: File, 
  userId: string,
  bucket: 'photos' | 'generations'
) {
  // Create supabase client with service role for storage operations
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

  // Generate a unique file name to prevent collisions
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExtension}`;

  // Upload the file to the specified bucket
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(`${userId}/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    return { error };
  }

  // Get the public URL for the file
  const fileUrl = supabase
    .storage
    .from(bucket)
    .getPublicUrl(`${userId}/${fileName}`).data.publicUrl;

  return { fileUrl };
}

/**
 * Removes a file from Supabase Storage
 * @param fileUrl The URL of the file to delete
 * @param userId User ID associated with the file
 * @param bucket The storage bucket containing the file
 * @returns Object indicating success or error
 */
export async function removeFileFromStorage(
  fileUrl: string,
  userId: string,
  bucket: 'photos' | 'generations'
) {
  // Create supabase client with service role for storage operations
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

  // Extract the file path from the URL
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split('/');
  const filePath = pathParts[pathParts.length - 1];

  // Delete the file
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .remove([`${userId}/${filePath}`]);

  if (error) {
    console.error('Error removing file:', error);
    return { error };
  }

  return { success: true };
}

/**
 * Creates a ZIP file from a list of file URLs
 * @param fileUrls Array of file URLs to include in the ZIP
 * @param userId User ID associated with the files
 * @returns Object with ZIP file URL or error
 */
export async function createZipFromUrls(
  fileUrls: string[],
  userId: string
) {
  // This would typically involve downloading each file,
  // creating a ZIP file, and then uploading it.
  // For simplicity, we'll just return a mock implementation here.
  
  console.log(`Creating ZIP for user ${userId} with ${fileUrls.length} files`);
  
  // In a real implementation, you would:
  // 1. Download each file from fileUrls
  // 2. Create a ZIP file in memory or temporarily on disk
  // 3. Upload the ZIP file to Supabase or directly to Replicate
  // 4. Return the URL of the uploaded ZIP

  // For now, we'll simulate the process:
  const zipFileName = `${userId}_${Date.now()}_training.zip`;
  
  return {
    zipUrl: `https://example.com/${zipFileName}`,
    // This is a placeholder - in reality, you would return an actual file URL
  };
} 