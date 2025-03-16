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

    // Get model ID from query parameter
    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get("id");

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Get the model from the database
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .eq("user_id", user.id)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found or you don't have permission" },
        { status: 404 }
      );
    }

    // If the model is already completed or failed, return the current status
    if (model.status !== "training") {
      return NextResponse.json({
        model: {
          id: model.id,
          name: model.name,
          status: model.status,
          replicate_id: model.replicate_id,
          replicate_version: model.replicate_version,
          created_at: model.created_at,
          updated_at: model.updated_at,
          photo_count: model.photo_count,
        }
      });
    }

    // Check status on Replicate
    const trainingStatus = await replicate.trainings.get(model.replicate_id);

    // Map Replicate status to our application status
    let appStatus = model.status;
    if (trainingStatus.status === "succeeded") {
      appStatus = "ready";
      
      // Update the model in the database
      const { error: updateError } = await supabase
        .from("models")
        .update({
          status: "ready",
          replicate_version: trainingStatus.version,
          updated_at: new Date().toISOString()
        })
        .eq("id", modelId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating model status:", updateError);
        // Continue even if update fails
      }
    } else if (trainingStatus.status === "failed") {
      appStatus = "failed";
      
      // Update the model in the database
      const { error: updateError } = await supabase
        .from("models")
        .update({
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", modelId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating model status:", updateError);
        // Continue even if update fails
      }
    }

    return NextResponse.json({
      model: {
        id: model.id,
        name: model.name,
        status: appStatus,
        replicate_id: model.replicate_id,
        replicate_version: trainingStatus.version || model.replicate_version,
        progress: trainingStatus.progress || 0,
        created_at: model.created_at,
        updated_at: new Date().toISOString(),
        photo_count: model.photo_count,
      }
    });

  } catch (error) {
    console.error("Error checking model status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 