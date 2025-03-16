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
      return NextResponse.json(
        { error: "At least 10 photos are required for training" },
        { status: 400 }
      );
    }
    
    // Verify that photos exist and belong to the user
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, storage_path")
      .eq("user_id", user.id)
      .in("id", photoIds);
    
    if (photosError) {
      console.error("Error fetching photos:", photosError);
      return NextResponse.json(
        { error: "Failed to verify photos" },
        { status: 500 }
      );
    }
    
    if (!photos || photos.length !== photoIds.length) {
      return NextResponse.json(
        { error: "Some photos do not exist or don't belong to you" },
        { status: 400 }
      );
    }
    
    // Create a ZIP file containing all the photos
    const zip = new JSZip();
    const zipFolder = zip.folder("training_photos");
    
    // Download each photo and add it to the ZIP
    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
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
    const prediction = await replicate.predictions.create({
      version: "stability-ai/sdxl-lora",
      input: {
        input_images: signedUrl,
        trigger_word: triggerWord,
        training_steps: parseInt(trainingSteps.toString()),
        learning_rate: parseFloat(learningRate.toString()),
        rank: parseInt(loraRank.toString()),
        resolution: parseInt(resolution),
        batch_size: parseInt(batchSize.toString())
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
    
  } catch (error) {
    console.error("Error creating model:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 