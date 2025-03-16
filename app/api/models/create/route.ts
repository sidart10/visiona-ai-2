import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

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
    
    // Parse request body
    const body = await req.json();
    const { 
      photoIds, 
      triggerWord,
      trainingSteps = 1000,
      loraRank = 32,
      optimizer = "adamw8bit",
      learningRate = 0.0004,
      resolution = "512",
      batchSize = 1
    } = body;
    
    // Validate input
    if (!triggerWord) {
      return NextResponse.json(
        { error: "Trigger word is required" },
        { status: 400 }
      );
    }
    
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length < 10) {
      console.log("Photo validation failed: ", { 
        photoIdsProvided: photoIds ? photoIds.length : 0,
        isArray: Array.isArray(photoIds)
      });
      return NextResponse.json(
        { error: "At least 10 photos are required for training" },
        { status: 400 }
      );
    }
    
    console.log("Photo IDs received from frontend:", photoIds);
    console.log("Current user ID:", user.id);
    
    // Photos data will be used outside the try block
    let photosData: any[] = [];
    
    // Verify that photos exist and belong to the user
    try {
      const { data: photos, error: photosError } = await supabase
        .from("photos")
        .select("id, storage_path, user_id")
        .eq("user_id", user.id)
        .in("id", photoIds);
      
      if (photosError) {
        console.error("Error fetching photos:", photosError);
        return NextResponse.json(
          { error: "Failed to verify photos" },
          { status: 500 }
        );
      }
      
      console.log("Photos found in database:", photos?.length || 0);
      console.log("Photos details:", photos);
      
      if (!photos) {
        console.error("No photos returned from database query");
        return NextResponse.json(
          { error: "No photos found for the provided IDs" },
          { status: 400 }
        );
      }
      
      // Check which photo IDs weren't found
      if (photos.length !== photoIds.length) {
        const foundPhotoIds = photos.map(p => p.id);
        const missingPhotoIds = photoIds.filter(id => !foundPhotoIds.includes(id));
        console.error("Missing photo IDs:", missingPhotoIds);
        
        // Additional diagnostics - try to find these photos without user filter
        const { data: anyPhotos } = await supabase
          .from("photos")
          .select("id, user_id")
          .in("id", missingPhotoIds);
        
        if (anyPhotos && anyPhotos.length > 0) {
          console.log("Found photos but with different user IDs:", anyPhotos);
        } else {
          console.log("Photos with these IDs don't exist at all:", missingPhotoIds);
        }
        
        return NextResponse.json(
          { 
            error: "Some photos do not exist or don't belong to you",
            details: {
              requestedPhotoIds: photoIds,
              foundPhotoIds,
              missingPhotoIds
            }
          },
          { status: 400 }
        );
      }
      
      // Store photos data for use outside the try block
      photosData = photos;
    } catch (error) {
      console.error("Error in photo validation:", error);
      return NextResponse.json(
        { error: "Error validating photos" },
        { status: 500 }
      );
    }
    
    // Create a ZIP file containing all the photos
    const zip = new JSZip();
    const zipFolder = zip.folder("training_photos");
    
    // Download each photo and add it to the ZIP
    try {
      for (let i = 0; i < photosData.length; i++) {
        const photo = photosData[i];
        const { data: fileData } = await supabase.storage
          .from("photos")
          .download(photo.storage_path);
        
        if (!fileData) {
          throw new Error(`Failed to download photo ${photo.id}`);
        }
        
        const filename = `photo_${i+1}.jpg`;
        zipFolder?.file(filename, fileData);
      }
    } catch (error) {
      console.error("Error downloading photos for ZIP:", error);
      return NextResponse.json(
        { error: "Failed to download photos for training" },
        { status: 500 }
      );
    }
    
    // Generate ZIP file
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    
    // Upload the ZIP file to Supabase
    const zipFileName = `${user.id}/${Date.now()}_${uuidv4()}_training.zip`;
    const { error: zipUploadError } = await supabase.storage
      .from("training")
      .upload(zipFileName, zipContent, {
        contentType: "application/zip",
        upsert: false
      });
      
    if (zipUploadError) {
      console.error("Error uploading ZIP file:", zipUploadError);
      return NextResponse.json(
        { error: "Failed to prepare training data" },
        { status: 500 }
      );
    }
    
    // Get a signed URL for the ZIP file (valid for 1 hour)
    const { data } = await supabase.storage
      .from("training")
      .createSignedUrl(zipFileName, 3600);
      
    if (!data || !data.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate signed URL for training data" },
        { status: 500 }
      );
    }
    
    const signedUrl = data.signedUrl;

    // Start training with Replicate
    try {
      const prediction = await replicate.predictions.create({
        // Use the full version ID for SDXL LoRA
        version: "a33uaqfkenracy1nohk5tgmuu9husbbr2q2qwtz0c3kxlyk5",
        input: {
          input_images: signedUrl,
          trigger_word: triggerWord,
          // Ensure parameters are within safe ranges
          training_steps: Math.min(Math.max(parseInt(trainingSteps.toString()), 100), 2000),
          learning_rate: Math.min(Math.max(parseFloat(learningRate.toString()), 0.0001), 0.001),
          rank: Math.min(Math.max(parseInt(loraRank.toString()), 4), 64),
          resolution: parseInt(resolution),
          batch_size: Math.min(Math.max(parseInt(batchSize.toString()), 1), 4)
        },
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/replicate/completed`,
        webhook_events_filter: ["completed"]
      });

      // Save model reference in database
      const { data: model, error: modelError } = await supabase
        .from("models")
        .insert({
          user_id: user.id,
          model_id: prediction.id,
          trigger_word: triggerWord,
          status: "Processing",
          parameters: {
            trainingSteps,
            loraRank,
            optimizer,
            learningRate,
            resolution,
            batchSize
          },
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (modelError) {
        console.error("Error saving model:", modelError);
        return NextResponse.json(
          { error: "Failed to save model information" },
          { status: 500 }
        );
      }

      // Save photo references for this model
      for (const photoId of photoIds) {
        await supabase
          .from("model_photos")
          .insert({
            model_id: model.id,
            photo_id: photoId
          });
      }

      return NextResponse.json({
        success: true,
        model: {
          id: model.id,
          trigger_word: triggerWord,
          status: "Processing",
          replicate_id: prediction.id,
        },
        message: "Model training started successfully"
      });
    } catch (error: any) {
      console.error("Error with Replicate API:", error);
      // Return a more specific error message if available
      return NextResponse.json(
        { 
          error: error.message || "Failed to start model training with Replicate",
          details: error.response?.data || error.toString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating model:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 