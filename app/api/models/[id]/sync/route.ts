import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
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
 * Endpoint to sync model status with Replicate
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 Syncing model status for model ${params.id}`);
    
    // Get current user
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // First, get the model from the database
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    
    if (modelError || !model) {
      console.error("Error fetching model:", modelError || "Model not found");
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      );
    }
    
    // Check if the model is already completed or failed
    if (model.status && ["completed", "ready", "succeeded", "active", "done"].includes(model.status.toLowerCase())) {
      console.log(`Model ${params.id} is already in a final state: ${model.status}`);
      return NextResponse.json({
        status: model.status,
        status_changed: false,
        message: "Model is already in a final state"
      });
    }
    
    // Check the status with Replicate
    console.log(`Checking Replicate status for training ${params.id}`);
    
    try {
      // Use trainings.get to check status
      const training = await replicate.trainings.get(params.id);
      console.log(`Replicate training status for ${params.id}:`, training.status);
      
      // Map Replicate status to our application status
      let newStatus = model.status; // Default to current status
      let statusChanged = false;
      
      if (training.status === "succeeded") {
        newStatus = "completed";
        statusChanged = model.status !== newStatus;
      } else if (training.status === "failed") {
        newStatus = "failed";
        statusChanged = model.status !== newStatus;
      } else if (training.status === "processing" || training.status === "starting") {
        newStatus = "processing";
        statusChanged = model.status !== newStatus;
      }
      
      // If status has changed, update the database
      if (statusChanged) {
        console.log(`Updating model ${params.id} status from ${model.status} to ${newStatus}`);
        
        const updateData: any = {
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        
        // If the model succeeded, update additional fields
        if (newStatus === "completed") {
          updateData.trained_at = new Date().toISOString();
        }
        
        // If the model failed, store the error
        if (newStatus === "failed" && training.error) {
          updateData.error_message = typeof training.error === 'string' 
            ? training.error 
            : JSON.stringify(training.error);
        }
        
        // Update the database
        const { error: updateError } = await supabase
          .from("models")
          .update(updateData)
          .eq("id", params.id);
        
        if (updateError) {
          console.error(`Error updating model ${params.id}:`, updateError);
          return NextResponse.json(
            { error: "Failed to update model status" },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          status: newStatus,
          status_changed: true,
          previous_status: model.status,
          message: "Model status updated"
        });
      }
      
      return NextResponse.json({
        status: newStatus,
        status_changed: false,
        message: "Model status already up to date"
      });
    } catch (replicateError: any) {
      console.error(`Error checking Replicate status for ${params.id}:`, replicateError);
      
      // If the error indicates the model doesn't exist or is no longer active,
      // we should mark it as completed if it's been in processing for a while
      if (model.status === "processing" && 
          new Date().getTime() - new Date(model.updated_at).getTime() > 60 * 60 * 1000) {
        console.log(`Model ${params.id} has been processing for over an hour, marking as completed`);
        
        const { error: updateError } = await supabase
          .from("models")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
            trained_at: new Date().toISOString()
          })
          .eq("id", params.id);
        
        if (updateError) {
          console.error(`Error updating stalled model ${params.id}:`, updateError);
        }
        
        return NextResponse.json({
          status: "completed",
          status_changed: true,
          previous_status: model.status,
          message: "Stalled model marked as completed"
        });
      }
      
      return NextResponse.json({
        error: "Failed to check Replicate status",
        message: replicateError.message || "Unknown error"
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error syncing model status:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 