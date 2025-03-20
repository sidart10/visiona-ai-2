import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with admin permissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint to directly fix model version IDs
 * This is an emergency endpoint for fixing models with missing version information
 */
export async function GET(req: NextRequest) {
  try {
    console.log("🔧 Activating version fix endpoint for models");
    
    // Default SDXL version ID to use
    const defaultVersionId = "26a1a203d7a8d2c8d5b5f13953a8068a9dd0bcc04d2459baa54b13d9cb63136a";
    
    // Get all models with missing version information but marked as ready/completed
    console.log("📋 Finding models with missing version information...");
    const { data: modelsToFix, error: queryError } = await supabase
      .from("models")
      .select("*")
      .or("version_id.is.null,replicate_version.is.null")
      .in("status", ["completed", "Ready"]);
    
    if (queryError) {
      console.error("❌ Error querying models:", queryError);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }
    
    console.log(`🔍 Found ${modelsToFix?.length || 0} models with missing version information`);
    
    // Update each model with the default version ID
    const updates = [];
    if (modelsToFix && modelsToFix.length > 0) {
      for (const model of modelsToFix) {
        console.log(`🔄 Updating model ${model.id}: Setting version information`);
        
        const { error: updateError } = await supabase
          .from("models")
          .update({ 
            version_id: defaultVersionId,
            replicate_version: defaultVersionId,
            updated_at: new Date().toISOString()
          })
          .eq("id", model.id);
        
        if (updateError) {
          console.error(`❌ Error updating model ${model.id}:`, updateError);
        } else {
          updates.push({ id: model.id, name: model.name });
        }
      }
    }
    
    // Get all models to verify the fixes worked
    const { data: allModels, error: allModelsError } = await supabase
      .from("models")
      .select("id, name, status, version_id, replicate_version")
      .in("status", ["completed", "Ready"])
      .order("created_at", { ascending: false });
    
    if (allModelsError) {
      console.error("❌ Error fetching all models:", allModelsError);
    }
    
    return NextResponse.json({
      success: true,
      fixed: updates,
      models: allModels || []
    });
  } catch (error) {
    console.error("❌ Error in fix-versions endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 