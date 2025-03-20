import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Webhook handler for Replicate model training completion
 * This endpoint will be called by Replicate when a training job completes
 */
export async function POST(req: NextRequest) {
  try {
    console.log("Received webhook from Replicate");
    
    // Verify the request is from Replicate (basic verification)
    const replicateSignature = req.headers.get("replicate-signature");
    if (!replicateSignature) {
      console.warn("Missing Replicate signature header");
      // In production, you might want to reject requests without proper signatures
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the webhook payload
    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload, null, 2));
    
    // Extract relevant information from the payload
    const { id, status, output, error } = payload;
    
    if (!id) {
      console.error("Invalid webhook payload: missing prediction ID");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    
    console.log(`Processing webhook for prediction ${id} with status: ${status}`);
    
    // Update the model status in the database
    const { data: model, error: queryError } = await supabase
      .from("models")
      .select("id, trigger_word")
      .eq("id", id)
      .maybeSingle();
    
    if (queryError || !model) {
      console.error("Error finding model:", queryError || "Model not found");
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    
    // Map Replicate status to our application status
    const modelStatus = status === "succeeded" ? "completed" :
                        status === "failed" ? "failed" : "processing";
    
    console.log(`Processing status update for model ${model.id}: ${status} → ${modelStatus}`);
    
    const updateData: any = {
      status: modelStatus,
      updated_at: new Date().toISOString()
    };
    
    // If the model training succeeded, store the output information and update trained_at
    if (status === "succeeded" && output) {
      const versionId = output.version || output.id;
      updateData.version_id = versionId;
      updateData.replicate_version = versionId; // Ensure replicate_version is also set
      updateData.output_data = output;
      updateData.trained_at = new Date().toISOString();
      
      console.log(`Setting version information: version_id=${versionId}, replicate_version=${versionId}`);
      
      // Ensure we have the trigger_word if it was passed in the output
      if (output.trigger_word && (!model.trigger_word || model.trigger_word === "")) {
        updateData.trigger_word = output.trigger_word;
        console.log(`Setting missing trigger_word to "${output.trigger_word}"`);
      }
    }
    
    // If the model training failed, store the error information
    if (status === "failed" && error) {
      updateData.error_message = error;
    }
    
    // Update the model record
    const { error: updateError } = await supabase
      .from("models")
      .update(updateData)
      .eq("id", model.id);
    
    if (updateError) {
      console.error("Error updating model:", updateError);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
    
    console.log(`Successfully updated model ${model.id} status to ${modelStatus}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Replicate webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 