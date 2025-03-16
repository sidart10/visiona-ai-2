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
    // Authenticate user with Clerk
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const {
      photos,
      triggerWord,
      trainingSteps = 1500,
      loraRank = 16,
      optimizer = "adamw8bit",
      learningRate = 0.0004,
      resolution = "512",
      batchSize = 1
    } = await req.json();

    // Validate input
    if (!triggerWord) {
      return NextResponse.json(
        { error: "Trigger word is required" },
        { status: 400 }
      );
    }

    console.log("Training request received with params:", {
      triggerWord,
      photoCount: photos?.length || 0,
      trainingSteps,
      loraRank,
      optimizer,
      learningRate,
      resolution,
      batchSize
    });

    if (!photos || !Array.isArray(photos) || photos.length < 10) {
      console.log("Photo validation failed: ", { 
        photosProvided: photos ? photos.length : 0,
        isArray: Array.isArray(photos),
        firstFewPhotos: Array.isArray(photos) ? photos.slice(0, 3) : null
      });
      return NextResponse.json(
        { error: "At least 10 photos are required for training" },
        { status: 400 }
      );
    }

    // Create a ZIP file containing all the photos
    const zip = new JSZip();
    const zipFolder = zip.folder("training_photos");
    
    // Download each photo and add it to the ZIP
    try {
      console.log("Attempting to download photos for ZIP creation");
      for (let i = 0; i < photos.length; i++) {
        const photoUrl = photos[i];
        console.log(`Processing photo ${i+1}/${photos.length}: ${photoUrl.substring(0, 50)}...`);
        
        try {
          const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
          console.log(`Successfully downloaded photo ${i+1} (size: ${response.data.byteLength} bytes)`);
          const filename = `photo_${i+1}.jpg`;
          zipFolder?.file(filename, response.data);
        } catch (photoError: any) {
          console.error(`Error downloading photo ${i+1} (${photoUrl.substring(0, 50)}...):`, photoError);
          throw new Error(`Failed to download photo at index ${i}: ${photoError.message}`);
        }
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
      const training = await replicate.predictions.create({
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
          model_id: training.id,
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
      for (const photoUrl of photos) {
        await supabase
          .from("model_photos")
          .insert({
            model_id: model.id,
            photo_url: photoUrl
          });
      }

      return NextResponse.json({
        success: true,
        model: {
          id: model.id,
          trigger_word: triggerWord,
          status: "Processing",
          replicate_id: training.id,
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
    console.error("Error starting model training:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 