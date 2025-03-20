import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with admin permissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint to directly fix model trigger words and status
 * CAUTION: This is an emergency endpoint that doesn't require authentication
 * Use only for immediate fixes and remove afterward
 */
export async function GET(req: NextRequest) {
  try {
    console.log("🔧 Activating direct fix endpoint for models");
    
    // Get all models with missing trigger words
    console.log("📋 Finding models with missing trigger words...");
    const { data: modelsWithoutTriggerWord, error: queryError } = await supabase
      .from("models")
      .select("*")
      .or("trigger_word.is.null,trigger_word.eq.");
    
    if (queryError) {
      console.error("❌ Error querying models:", queryError);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }
    
    console.log(`🔍 Found ${modelsWithoutTriggerWord?.length || 0} models with missing trigger words`);
    
    // Update each model with extracted trigger word from description
    const updates = [];
    if (modelsWithoutTriggerWord && modelsWithoutTriggerWord.length > 0) {
      for (const model of modelsWithoutTriggerWord) {
        let triggerWord = model.name;
        
        // Try to extract from description if it exists
        if (model.description) {
          const triggerWordMatch = model.description.match(/trigger word "([^"]+)"/i);
          if (triggerWordMatch && triggerWordMatch[1]) {
            triggerWord = triggerWordMatch[1];
          }
        }
        
        console.log(`🔄 Updating model ${model.id}: Setting trigger_word to "${triggerWord}"`);
        
        const { error: updateError } = await supabase
          .from("models")
          .update({ trigger_word: triggerWord })
          .eq("id", model.id);
        
        if (updateError) {
          console.error(`❌ Error updating model ${model.id}:`, updateError);
        } else {
          updates.push({ id: model.id, triggerWord });
        }
      }
    }
    
    // Find and fix models stuck in "processing" status for more than 1 hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    console.log("⏱️ Finding stalled models in processing state...");
    const { data: stalledModels, error: stalledError } = await supabase
      .from("models")
      .select("*")
      .eq("status", "Processing")
      .lt("updated_at", oneHourAgo.toISOString());
    
    if (stalledError) {
      console.error("❌ Error querying stalled models:", stalledError);
    } else {
      console.log(`🔍 Found ${stalledModels?.length || 0} stalled models`);
      
      // Update stalled models to "completed" status
      if (stalledModels && stalledModels.length > 0) {
        for (const model of stalledModels) {
          console.log(`⚙️ Updating stalled model ${model.id} status to "completed"`);
          
          const { error: updateError } = await supabase
            .from("models")
            .update({ 
              status: "completed",
              updated_at: new Date().toISOString()
            })
            .eq("id", model.id);
          
          if (updateError) {
            console.error(`❌ Error updating stalled model ${model.id}:`, updateError);
          } else {
            updates.push({ id: model.id, status: "completed" });
          }
        }
      }
    }
    
    // Get all models to verify the fixes worked
    const { data: allModels, error: allModelsError } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (allModelsError) {
      console.error("❌ Error fetching all models:", allModelsError);
    }
    
    return NextResponse.json({
      success: true,
      fixedTriggerWords: updates.filter(u => u.triggerWord),
      fixedStalled: updates.filter(u => u.status),
      models: allModels || []
    });
  } catch (error) {
    console.error("❌ Error in direct fix endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 