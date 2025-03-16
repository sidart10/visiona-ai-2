import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handle file upload
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
    
    // Check if user exists in Supabase
    const { data: supabaseUser, error: queryError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();
    
    if (queryError) {
      console.error("Error querying user:", queryError);
      return NextResponse.json(
        { error: "Error accessing user database" },
        { status: 500 }
      );
    }
    
    // If user doesn't exist in Supabase, create them
    let userId: string;
    
    if (!supabaseUser) {
      // Create user record
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating user:", insertError);
        return NextResponse.json(
          { error: "Failed to create user record" },
          { status: 500 }
        );
      }
      
      userId = newUser.id;
    } else {
      userId = supabaseUser.id;
    }
    
    // Verify content type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content type must be multipart/form-data" },
        { status: 415 }
      );
    }
    
    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    // Validate file
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG and PNG are supported." },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const uniqueId = uuidv4();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uniqueId}.${fileExtension}`;
    const storagePath = `uploads/${userId}/${fileName}`;
    
    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    
    const { error: uploadError } = await supabase
      .storage
      .from("photos")
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false
      });
    
    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }
    
    // Save reference in database
    console.log("Attempting to save photo reference with data:", {
      user_id: userId,
      storage_path: storagePath,
      original_filename: file.name,
      file_size: file.size,
      content_type: file.type
    });
    
    const { data: photoData, error: saveError } = await supabase
      .from("photos")
      .insert({
        user_id: userId,
        storage_path: storagePath,
        original_filename: file.name,
        file_size: file.size,
        content_type: file.type
      })
      .select()
      .single();
    
    if (saveError) {
      console.error("Error saving photo reference:", saveError);
      console.log("Database schema for photos table may be missing 'content_type' column");
      // Try to delete the uploaded file if database insert fails
      await supabase.storage.from("photos").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to save photo reference" },
        { status: 500 }
      );
    }
    
    // Get public URL for the image
    const { data: publicURL } = supabase
      .storage
      .from("photos")
      .getPublicUrl(storagePath);
    
    return NextResponse.json({
      success: true,
      photo: {
        id: photoData.id,
        url: publicURL.publicUrl,
        storage_path: storagePath,
        filename: file.name
      }
    });
    
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

// Remove the old Pages Router config format
// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: "5mb",
//     },
//   },
// }; 