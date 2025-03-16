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

export async function GET(req: NextRequest) {
  try {
    // Authenticate user with Clerk
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get model ID from query params
    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get("id");

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Get model from database
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .eq("user_id", user.id)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found or access denied" },
        { status: 404 }
      );
    }

    // If model is already Ready or Failed, return current status
    if (model.status === "Ready" || model.status === "Failed") {
      return NextResponse.json({
        id: model.id,
        status: model.status,
        trigger_word: model.trigger_word,
        created_at: model.created_at,
        updated_at: model.updated_at,
      });
    }

    // Check status with Replicate
    try {
      const training = await replicate.trainings.get(model.model_id);
      
      let status = model.status;
      let progress = 0;
      
      // Map Replicate status to our status
      if (training.status === "succeeded") {
        status = "Ready";
        progress = 100;
      } else if (training.status === "failed") {
        status = "Failed";
      } else if (training.status === "processing") {
        status = "Processing";
        
        // Calculate progress if available
        if (training.metrics && typeof training.metrics === 'object' && 'training_progress' in training.metrics) {
          const trainingProgress = training.metrics.training_progress as number;
          progress = Math.round(trainingProgress * 100);
        }
      }
      
      // Update model in database if status changed
      if (status !== model.status) {
        let versionId = null;
        if (training.version && typeof training.version === 'object') {
          // Safely access the id property after type checking
          versionId = 'id' in training.version ? (training.version as any).id : null;
        }
        
        await supabase
          .from("models")
          .update({
            status,
            updated_at: new Date().toISOString(),
            version_id: versionId,
          })
          .eq("id", model.id);
      }
      
      return NextResponse.json({
        id: model.id,
        status,
        progress,
        trigger_word: model.trigger_word,
        replicate_status: training.status,
        created_at: model.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error checking Replicate training status:", error);
      
      // Return current status from database
      return NextResponse.json({
        id: model.id,
        status: model.status,
        trigger_word: model.trigger_word,
        created_at: model.created_at,
        updated_at: model.updated_at,
        error: "Could not check status with Replicate",
      });
    }
  } catch (error) {
    console.error("Error checking model status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update to use App Router config
export const dynamic = 'force-dynamic'; 