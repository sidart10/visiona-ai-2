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
      const prediction = await replicate.predictions.get(model.model_id);
      
      let status = model.status;
      let progress = 0;
      let errorMessage = null;
      
      // Map Replicate status to our status
      if (prediction.status === "succeeded") {
        status = "Ready";
        progress = 100;
      } else if (prediction.status === "failed") {
        status = "Failed";
        // Extract error message if available
        if (prediction.error) {
          errorMessage = typeof prediction.error === 'string' 
            ? prediction.error 
            : JSON.stringify(prediction.error);
        }
      } else if (prediction.status === "canceled") {
        status = "Failed";
        errorMessage = "Training was canceled";
      } else if (prediction.status === "processing" || prediction.status === "starting") {
        // If we're in processing state for too long without progress, check if there might be an issue
        const createdAt = new Date(prediction.created_at);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreation > 2 && !prediction.metrics) {
          // If processing for more than 2 hours with no metrics, something might be wrong
          status = "Processing";
          progress = 0;
        } else {
          status = "Processing";
          
          // Calculate progress if available
          if (prediction.metrics && typeof prediction.metrics === 'object' && 'training_progress' in prediction.metrics) {
            const trainingProgress = prediction.metrics.training_progress as number;
            progress = Math.round(trainingProgress * 100);
          } else if (prediction.logs) {
            // Try to extract progress from logs as fallback
            const logs = prediction.logs.toString();
            const progressMatch = logs.match(/step (\d+)\/(\d+)/i);
            if (progressMatch && progressMatch.length >= 3) {
              const current = parseInt(progressMatch[1]);
              const total = parseInt(progressMatch[2]);
              if (!isNaN(current) && !isNaN(total) && total > 0) {
                progress = Math.round((current / total) * 100);
              }
            }
          }
        }
      }
      
      // Update model in database if status changed
      if (status !== model.status || errorMessage) {
        let versionId = null;
        if (prediction.output && typeof prediction.output === 'object' && 'version' in prediction.output) {
          versionId = prediction.output.version;
        }
        
        const updateData: any = {
          status,
          updated_at: new Date().toISOString(),
        };
        
        if (versionId) {
          updateData.version_id = versionId;
        }
        
        if (errorMessage) {
          updateData.error_message = errorMessage;
        }
        
        await supabase
          .from("models")
          .update(updateData)
          .eq("id", model.id);
      }
      
      return NextResponse.json({
        id: model.id,
        status,
        progress,
        trigger_word: model.trigger_word,
        replicate_status: prediction.status,
        error_message: errorMessage,
        created_at: model.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error checking Replicate prediction status:", error);
      
      // Check if it's a 404 error, meaning the prediction doesn't exist
      if (error.message && error.message.includes("404")) {
        // Mark the model as failed since the prediction doesn't exist
        await supabase
          .from("models")
          .update({
            status: "Failed",
            error_message: "Training job not found on Replicate",
            updated_at: new Date().toISOString(),
          })
          .eq("id", model.id);
        
        return NextResponse.json({
          id: model.id,
          status: "Failed",
          error_message: "Training job not found on Replicate",
          trigger_word: model.trigger_word,
          created_at: model.created_at,
          updated_at: new Date().toISOString(),
        });
      }
      
      // Return current status from database
      return NextResponse.json({
        id: model.id,
        status: model.status,
        trigger_word: model.trigger_word,
        created_at: model.created_at,
        updated_at: model.updated_at,
        error: "Could not check status with Replicate: " + error.message,
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