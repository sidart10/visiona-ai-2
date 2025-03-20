import { createClient } from "@supabase/supabase-js";

/**
 * Utility for checking model training status directly with Replicate
 * This is a fallback when the webhook isn't working properly
 */

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check if a model's status needs to be synchronized with Replicate
 * @param modelId - The model ID in our database
 * @returns True if sync was needed and performed, false otherwise
 */
export async function checkAndSyncModelStatus(modelId: string): Promise<boolean> {
  try {
    // First, fetch the model from our database
    const { data: model, error } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .single();
      
    if (error || !model) {
      console.error("Error fetching model for status sync:", error);
      return false;
    }
    
    // Check if the model is in a "processing" state
    const processingStatuses = ["processing", "pending", "starting", "queued"];
    if (!processingStatuses.includes(model.status?.toLowerCase())) {
      // Model is already in a terminal state, no need to sync
      return false;
    }
    
    // If the model has been "processing" for more than 1 hour, check with Replicate
    const processingTimeMs = Date.now() - new Date(model.updated_at).getTime();
    const oneHourMs = 60 * 60 * 1000;
    
    if (processingTimeMs < oneHourMs) {
      // Not stuck in processing yet, don't sync
      return false;
    }
    
    // If we get here, the model might be stuck in processing
    console.log(`Model ${modelId} may be stuck in processing since ${model.updated_at}, checking with Replicate...`);
    
    // Trigger the status sync endpoint
    const syncResponse = await fetch(`/api/models/sync-status?id=${modelId}`, {
      method: 'POST',
    });
    
    if (!syncResponse.ok) {
      console.error("Failed to sync model status:", await syncResponse.text());
      return false;
    }
    
    const result = await syncResponse.json();
    return result.success;
  } catch (error) {
    console.error("Error in checkAndSyncModelStatus:", error);
    return false;
  }
} 