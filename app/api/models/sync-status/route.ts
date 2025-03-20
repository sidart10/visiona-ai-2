import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import Replicate from "replicate";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

/**
 * API route to manually sync a model's status with Replicate
 * This is used as a fallback when webhooks don't work
 */
export async function POST(req: NextRequest) {
  try {
    // Get current user from Clerk
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get model ID from query params
    const modelId = req.nextUrl.searchParams.get("id");
    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch the model from database
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .single();
      
    if (modelError || !model) {
      console.error("Error fetching model:", modelError || "Model not found");
      return NextResponse.json(
        { error: "Model not found", detail: modelError?.message },
        { status: 404 }
      );
    }
    
    // Check if we have a Replicate ID to query
    let replicateId = model.replicate_id;
    
    if (!replicateId) {
      return NextResponse.json(
        { error: "Model doesn't have a Replicate ID to check" },
        { status: 400 }
      );
    }
    
    console.log(`Checking status for model ${modelId} with Replicate ID ${replicateId}`);
    
    // Query Replicate for the current status
    try {
      const training = await replicate.trainings.get(replicateId);
      
      // Map Replicate status to our app status
      const statusMap: Record<string, string> = {
        "succeeded": "completed",
        "failed": "failed",
        "canceled": "failed",
        "processing": "processing"
      };
      
      const replicateStatus = training.status.toLowerCase();
      const appStatus = statusMap[replicateStatus] || replicateStatus;
      
      console.log(`Replicate status for ${replicateId}: ${replicateStatus} → App status: ${appStatus}`);
      
      // Check if we need to update our database
      if (model.status.toLowerCase() !== appStatus) {
        console.log(`Updating model ${modelId} status from ${model.status} to ${appStatus}`);
        
        const updateData: Record<string, any> = {
          status: appStatus,
          updated_at: new Date().toISOString()
        };
        
        // If the model is now completed, set the trained_at field
        if (appStatus === "completed" && !model.trained_at) {
          updateData.trained_at = new Date().toISOString();
        }
        
        // If we have version information, save it
        if (training.output && training.output.version) {
          updateData.version_id = training.output.version;
        }
        
        // Save all output data
        if (training.output) {
          updateData.output_data = training.output;
        }
        
        // Update the model
        const { error: updateError } = await supabase
          .from("models")
          .update(updateData)
          .eq("id", modelId);
          
        if (updateError) {
          console.error("Error updating model status:", updateError);
          return NextResponse.json(
            { error: "Failed to update model status", detail: updateError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          updated: true,
          previousStatus: model.status,
          newStatus: appStatus,
          replicateStatus: training.status
        });
      } else {
        // Status is already in sync
        return NextResponse.json({
          success: true,
          updated: false,
          status: appStatus,
          message: "Model status is already in sync with Replicate"
        });
      }
    } catch (replicateError: any) {
      console.error("Error querying Replicate:", replicateError);
      return NextResponse.json(
        { 
          error: "Failed to query Replicate API", 
          detail: replicateError.message,
          replicateId
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error("Error syncing model status:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 