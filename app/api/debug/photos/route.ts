import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Get current user from Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body to get photo IDs
    const { photoIds } = await req.json();
    
    if (!photoIds || !Array.isArray(photoIds)) {
      return NextResponse.json(
        { error: "Photo IDs are required and must be an array" },
        { status: 400 }
      );
    }
    
    console.log("Debug: Checking photo access for user", user.id);
    console.log("Debug: Photo IDs to check:", photoIds);
    
    // First try to find these photos with the user filter
    const { data: userPhotos, error: userPhotosError } = await supabase
      .from("photos")
      .select("id, storage_path, user_id, original_filename, file_size, content_type")
      .eq("user_id", user.id)
      .in("id", photoIds);
    
    if (userPhotosError) {
      console.error("Error querying user photos:", userPhotosError);
    }
    
    // Now try to find them without the user filter
    const { data: allPhotos, error: allPhotosError } = await supabase
      .from("photos")
      .select("id, user_id")
      .in("id", photoIds);
    
    if (allPhotosError) {
      console.error("Error querying all photos:", allPhotosError);
    }
    
    // Get all photos with different user IDs
    const otherUserPhotos = allPhotos?.filter(p => p.user_id !== user.id) || [];
    
    // Get a list of user IDs who own some of these photos
    const otherUserIds = Array.from(new Set(otherUserPhotos.map(p => p.user_id)));
    
    // Check if there are any photos that don't exist at all
    const existingPhotoIds = (allPhotos || []).map(p => p.id);
    const nonExistentPhotoIds = photoIds.filter(id => !existingPhotoIds.includes(id));
    
    // Return diagnostic information
    return NextResponse.json({
      user_id: user.id,
      found_photos: userPhotos?.length || 0,
      total_requested: photoIds.length,
      owned_by_others: otherUserPhotos.length,
      other_user_ids: otherUserIds,
      non_existent_photos: nonExistentPhotoIds,
      user_photos: userPhotos || [],
      other_user_photos: otherUserPhotos || []
    });
    
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Failed to debug photo access" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 