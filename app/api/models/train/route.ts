import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";

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
    const { modelName, photoIds } = await req.json();

    // Validate input
    if (!modelName) {
      return NextResponse.json(
        { error: "Model name is required" },
        { status: 400 }
      );
    }

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length < 10) {
      return NextResponse.json(
        { error: "At least 10 photos are required for training" },
        { status: 400 }
      );
    }

    // Get user's photos from database
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", user.id)
      .in("id", photoIds);

    if (photosError || !photos || photos.length < 10) {
      return NextResponse.json(
        { error: "Failed to fetch required photos or insufficient photos found" },
        { status: 400 }
      );
    }

    // Extract photo URLs for training
    const photoUrls = photos.map(photo => photo.url);

    // Start training with Replicate (using Flux LoRA trainer)
    const training = await replicate.trainings.create({
      // Flux LoRA trainer - replace with actual model ID
      version: "flux-lora-training/1.0",
      input: {
        instance_prompt: `a photo of ${modelName} person`,
        class_prompt: "a photo of person",
        instance_data: photoUrls,
        max_train_steps: 1500,
        learning_rate: 1e-4,
        train_text_encoder: true,
        use_8bit_adam: false,
      },
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/replicate/training-complete`,
      webhook_events_filter: ["completed", "failed"]
    });

    // Save model reference in database
    const { data: model, error: modelError } = await supabase
      .from("models")
      .insert({
        user_id: user.id,
        name: modelName,
        status: "training",
        replicate_id: training.id,
        replicate_version: null, // Will be updated when training completes
        created_at: new Date().toISOString(),
        photo_count: photos.length,
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

    // Link photos to model
    const photoLinks = photoIds.map(photoId => ({
      model_id: model.id,
      photo_id: photoId,
    }));

    const { error: linkError } = await supabase
      .from("model_photos")
      .insert(photoLinks);

    if (linkError) {
      console.error("Error linking photos to model:", linkError);
      // Continue even if linking fails
    }

    return NextResponse.json({
      success: true,
      model: {
        id: model.id,
        name: modelName,
        status: "training",
        replicate_id: training.id,
      },
      message: "Model training started successfully"
    });

  } catch (error) {
    console.error("Error starting model training:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 