import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import logger from "@/lib/logger";

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user with Clerk
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const modelId = params.id;
    
    // First, get the Supabase user ID that corresponds to the Clerk user ID
    const { data: supabaseUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();
    
    if (userError || !supabaseUser) {
      logger.error("Error mapping Clerk user to Supabase user", { 
        error: userError,
        clerkId: user.id 
      });
      return NextResponse.json(
        { 
          success: false,
          error: "User not found in database" 
        },
        { status: 400 }
      );
    }
    
    const supabaseUserId = supabaseUser.id;
    
    logger.info(`Fetching model by ID`, { 
      modelId, 
      clerkUserId: user.id,
      supabaseUserId: supabaseUserId
    });

    // Get model from database using Supabase user ID
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .eq("user_id", supabaseUserId.toString())
      .single();

    logger.info(`Model query details`, {
      query: {
        id: modelId,
        user_id: supabaseUserId
      },
      result: model ? 'Found' : 'Not found',
      error: modelError
    });
    
    // Try the query again with a different approach - just to debug
    const debugFetch = await supabase
      .from("models")
      .select("*")
      .limit(10);
      
    logger.info(`Debug: All recent models in database`, {
      count: debugFetch.data?.length || 0,
      models: debugFetch.data?.map(m => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name
      }))
    });

    if (modelError) {
      logger.error(`Error fetching model from database`, { 
        error: modelError,
        modelId, 
        userId: supabaseUserId
      });
      return NextResponse.json(
        { 
          success: false,
          error: "Error fetching model" 
        },
        { status: 500 }
      );
    }

    if (!model) {
      logger.error(`Model not found or access denied`, { 
        modelId, 
        userId: supabaseUserId
      });
      return NextResponse.json(
        { 
          success: false,
          error: "Model not found or access denied" 
        },
        { status: 404 }
      );
    }

    // If model is already Ready or Failed, return current status
    if (model.status === "Ready" || model.status === "Failed") {
      return NextResponse.json({
        success: true,
        model: {
          id: model.id,
          name: model.name,
          description: model.description,
          status: model.status,
          error_message: model.error_message,
          created_at: model.created_at,
          updated_at: model.updated_at,
          progress: model.status === "Ready" ? 100 : 0
        }
      });
    }

    // Check training status with Replicate
    try {
      // Use trainings.get instead of predictions.get
      logger.info(`Checking training status with Replicate`, { 
        trainingId: model.id
      });
      
      const training = await replicate.trainings.get(model.id);
      
      let status = model.status;
      let progress = 0;
      let errorMessage = model.error_message;
      
      // Map Replicate status to our status
      if (training.status === "succeeded") {
        status = "Ready";
        progress = 100;
      } else if (training.status === "failed") {
        status = "Failed";
        // Extract error message if available
        if (training.error) {
          errorMessage = typeof training.error === 'string' 
            ? training.error 
            : JSON.stringify(training.error);
        }
      } else if (training.status === "canceled") {
        status = "Failed";
        errorMessage = "Training was canceled";
      } else if (training.status === "processing" || training.status === "starting") {
        // If we're in processing state for too long without progress, check if there might be an issue
        const createdAt = new Date(training.created_at);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreation > 2 && !training.metrics) {
          // If processing for more than 2 hours with no metrics, something might be wrong
          status = "Processing";
          progress = 0;
        } else {
          status = "Processing";
          
          // Calculate progress if available
          if (training.metrics && typeof training.metrics === 'object' && 'training_progress' in training.metrics) {
            const trainingProgress = training.metrics.training_progress as number;
            progress = Math.round(trainingProgress * 100);
          } else if (training.logs) {
            // Try to extract progress from logs as fallback
            const logs = training.logs.toString();
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
      if (status !== model.status || errorMessage !== model.error_message) {
        let versionId = null;
        if (training.output && typeof training.output === 'object' && 'version' in training.output) {
          versionId = training.output.version;
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
        
        logger.info(`Updating model status in database`, { 
          modelId,
          oldStatus: model.status,
          newStatus: status,
          progress
        });
        
        await supabase
          .from("models")
          .update(updateData)
          .eq("id", model.id);
      }
      
      return NextResponse.json({
        success: true,
        model: {
          id: model.id,
          name: model.name,
          description: model.description,
          status,
          progress,
          created_at: model.created_at,
          updated_at: new Date().toISOString(),
          error_message: errorMessage,
          replicate_status: training.status,
          version_id: model.version_id,
        }
      });
    } catch (error: any) {
      logger.error(`Error checking Replicate training status`, { 
        error: error.message,
        modelId: model.id
      });
      
      // Check if it's a 404 error, meaning the training doesn't exist
      if (error.message && error.message.includes("404")) {
        // Mark the model as failed since the training doesn't exist
        await supabase
          .from("models")
          .update({
            status: "Failed",
            error_message: "Training job not found on Replicate",
            updated_at: new Date().toISOString(),
          })
          .eq("id", model.id);
        
        return NextResponse.json({
          success: true,
          model: {
            id: model.id,
            name: model.name,
            description: model.description,
            status: "Failed",
            error_message: "Training job not found on Replicate",
            created_at: model.created_at,
            updated_at: new Date().toISOString(),
            progress: 0
          }
        });
      }
      
      // Return current status from database
      return NextResponse.json({
        success: true,
        model: {
          id: model.id,
          name: model.name,
          description: model.description,
          status: model.status,
          created_at: model.created_at,
          updated_at: model.updated_at,
          error: "Could not check status with Replicate: " + error.message,
          progress: 0
        }
      });
    }
  } catch (error: any) {
    logger.error(`Error fetching model status`, { error: error.message });
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error: " + error.message 
      },
      { status: 500 }
    );
  }
}

// Update to use App Router config
export const dynamic = 'force-dynamic'; 