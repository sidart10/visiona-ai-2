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
    
    // Parse request body to get photo IDs and fix option
    const { photoIds, fix = false } = await req.json();
    
    if (!photoIds || !Array.isArray(photoIds)) {
      return NextResponse.json(
        { error: "Photo IDs are required and must be an array" },
        { status: 400 }
      );
    }
    
    console.log("Debug: Checking photo access for user", user.id);
    console.log("Debug: Photo IDs to check:", photoIds);
    console.log("Debug: Fix option enabled:", fix);
    
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

    // If fix option is enabled, try to reassign photos to the current user
    let fixResult = null;
    if (fix && otherUserPhotos.length > 0) {
      console.log(`Attempting to fix ownership for ${otherUserPhotos.length} photos...`);
      
      // Find the user's Supabase ID
      const { data: supabaseUser } = await supabase
        .from("users")
        .select("id, clerk_id")
        .eq("clerk_id", user.id)
        .maybeSingle();
      
      console.log("Supabase user found:", supabaseUser);
      
      if (supabaseUser) {
        const correctUserId = supabaseUser.id;
        console.log(`Found correct user ID: ${correctUserId} for Clerk ID: ${user.id}`);
        console.log(`Type of correctUserId: ${typeof correctUserId}`);
        
        // Log the photos we're trying to fix
        console.log("Photos to fix:", otherUserPhotos);
        
        // Update photos to belong to the current user
        const photoIdsToFix = otherUserPhotos.map(p => p.id);
        console.log("Photo IDs to fix:", photoIdsToFix);
        
        // Update with explicit toString() to ensure string comparison
        const { data: updateResult, error: updateError } = await supabase
          .from("photos")
          .update({ user_id: correctUserId.toString() })
          .in("id", photoIdsToFix)
          .select("id, user_id");
        
        if (updateError) {
          console.error("Error fixing photo ownership:", updateError);
          fixResult = { success: false, error: updateError.message };
        } else {
          console.log(`Update result:`, updateResult);
          
          // Double-check if update worked by querying again
          const { data: verifyPhotos } = await supabase
            .from("photos")
            .select("id, user_id")
            .in("id", photoIdsToFix);
          
          console.log("Verification after update:", verifyPhotos);
          
          fixResult = { 
            success: true, 
            count: updateResult.length,
            fixed_ids: updateResult.map(p => p.id)
          };
        }
      } else {
        console.error("Could not find Supabase user ID for current user");
        fixResult = { success: false, error: "User ID not found" };
      }
    }
    
    // Return diagnostic information
    return NextResponse.json({
      user_id: user.id,
      found_photos: userPhotos?.length || 0,
      total_requested: photoIds.length,
      owned_by_others: otherUserPhotos.length,
      other_user_ids: otherUserIds,
      non_existent_photos: nonExistentPhotoIds,
      user_photos: userPhotos || [],
      other_user_photos: otherUserPhotos || [],
      fix_result: fixResult
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