import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Initialize Supabase client with admin rights
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Migration endpoint to fix trigger_word values for existing models
 * Extracts trigger words from description field and updates the models
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
    
    // Get models with null/empty trigger_word but with description containing a trigger word
    const { data: models, error: fetchError } = await supabase
      .from("models")
      .select("*")
      .or('trigger_word.is.null,trigger_word.eq.""');
      
    if (fetchError) {
      console.error("Error fetching models:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch models" },
        { status: 500 }
      );
    }
    
    console.log(`Found ${models.length} models without trigger words`);
    
    // Process models to extract trigger words from description
    const updates = [];
    const triggerWordRegex = /trigger word "([^"]+)"/i;
    
    for (const model of models) {
      if (model.description) {
        const match = model.description.match(triggerWordRegex);
        if (match && match[1]) {
          const extractedTriggerWord = match[1];
          console.log(`Extracted trigger word "${extractedTriggerWord}" from model ${model.id}`);
          
          // Update the model
          const { error: updateError } = await supabase
            .from("models")
            .update({ trigger_word: extractedTriggerWord })
            .eq("id", model.id);
            
          if (updateError) {
            console.error(`Error updating model ${model.id}:`, updateError);
            updates.push({
              id: model.id,
              status: "error",
              error: updateError.message
            });
          } else {
            updates.push({
              id: model.id,
              status: "updated",
              trigger_word: extractedTriggerWord
            });
          }
        } else {
          // Fallback to using model name as trigger word
          if (model.name) {
            const { error: updateError } = await supabase
              .from("models")
              .update({ trigger_word: model.name })
              .eq("id", model.id);
              
            if (updateError) {
              console.error(`Error updating model ${model.id} with name:`, updateError);
              updates.push({
                id: model.id,
                status: "error",
                error: updateError.message
              });
            } else {
              updates.push({
                id: model.id,
                status: "updated",
                trigger_word: model.name,
                message: "Used model name as trigger word"
              });
            }
          } else {
            updates.push({
              id: model.id,
              status: "skipped",
              message: "No description or name containing trigger word"
            });
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: models.length,
      updates
    });
    
  } catch (error: any) {
    console.error("Error in trigger word migration:", error);
    return NextResponse.json(
      { 
        error: "Migration failed", 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 