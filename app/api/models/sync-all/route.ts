import { NextRequest, NextResponse } from "next/server";
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
 * Endpoint to sync all model statuses without authentication
 * This is a temporary endpoint for admin use only
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch all models from database
    const { data: models, error: fetchError } = await supabase
      .from("models")
      .select("*");
      
    if (fetchError) {
      console.error("Error fetching models:", fetchError);
      return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
    }
    
    console.log(`Found ${models.length} models to process`);
    
    // Fix trigger words from description
    const triggerWordResults = [];
    for (const model of models) {
      // Try to extract trigger word from description if it's missing
      if (!model.trigger_word && model.description) {
        const match = model.description.match(/trigger word "([^"]+)"/i);
        if (match && match[1]) {
          const extractedTriggerWord = match[1];
          console.log(`Extracted trigger word "${extractedTriggerWord}" for model ${model.id}`);
          
          // Update the model
          const { error: updateError } = await supabase
            .from("models")
            .update({ trigger_word: extractedTriggerWord })
            .eq("id", model.id);
            
          triggerWordResults.push({
            id: model.id,
            status: updateError ? "error" : "updated",
            triggerWord: extractedTriggerWord
          });
        } else if (model.name) {
          // Use name as fallback
          const { error: updateError } = await supabase
            .from("models")
            .update({ trigger_word: model.name })
            .eq("id", model.id);
            
          triggerWordResults.push({
            id: model.id,
            status: updateError ? "error" : "updated",
            triggerWord: model.name,
            message: "Used model name as trigger word"
          });
        }
      }
      
      // Check with Replicate to sync status if needed
      if (model.replicate_id && model.status === "Processing") {
        try {
          const training = await replicate.trainings.get(model.replicate_id);
          
          // Map Replicate status to our status format
          const statusMap: Record<string, string> = {
            "succeeded": "completed",
            "failed": "failed",
            "canceled": "failed"
          };
          
          const replicateStatus = training.status.toLowerCase();
          const appStatus = statusMap[replicateStatus] || "processing";
          
          // Only update if status is different
          if (model.status.toLowerCase() !== appStatus.toLowerCase()) {
            console.log(`Updating model ${model.id} status from ${model.status} to ${appStatus}`);
            
            const updateData: Record<string, any> = {
              status: appStatus,
              updated_at: new Date().toISOString()
            };
            
            // If the model is now completed, set the trained_at field
            if (appStatus === "completed" && !model.trained_at) {
              updateData.trained_at = new Date().toISOString();
            }
            
            // Update the model
            const { error: updateError } = await supabase
              .from("models")
              .update(updateData)
              .eq("id", model.id);
              
            if (updateError) {
              console.error(`Error updating model ${model.id}:`, updateError);
            }
          }
        } catch (error) {
          console.error(`Error checking Replicate status for model ${model.id}:`, error);
        }
      }
    }
    
    // Return results
    return NextResponse.json({
      success: true,
      processed: models.length,
      triggerWordResults
    });
    
  } catch (error: any) {
    console.error("Error in sync-all:", error);
    return NextResponse.json(
      { error: "Sync failed", message: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 