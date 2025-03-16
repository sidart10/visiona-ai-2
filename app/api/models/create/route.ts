import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Get current user from Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user exists in Supabase
    const { data: supabaseUser, error: queryError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();
    
    if (queryError) {
      console.error("Error querying user:", queryError);
      return NextResponse.json(
        { error: "Error accessing user database" },
        { status: 500 }
      );
    }
    
    // If user doesn't exist in Supabase, create them
    let userId: string;
    
    if (!supabaseUser) {
      // Create user record
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating user:", insertError);
        return NextResponse.json(
          { error: "Failed to create user record" },
          { status: 500 }
        );
      }
      
      userId = newUser.id;
    } else {
      userId = supabaseUser.id;
    }
    
    // Parse request body
    const body = await req.json();
    const { name, description, photoIds, triggerWord } = body;
    
    // Validate input - use triggerWord as fallback for name
    const modelName = name || triggerWord;
    if (!modelName) {
      return NextResponse.json(
        { error: "Model name or trigger word is required" },
        { status: 400 }
      );
    }
    
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length < 5) {
      return NextResponse.json(
        { error: "At least 5 photos are required" },
        { status: 400 }
      );
    }
    
    // Verify that photos exist and belong to the user
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id")
      .eq("user_id", userId)
      .in("id", photoIds);
    
    if (photosError) {
      console.error("Error fetching photos:", photosError);
      return NextResponse.json(
        { error: "Failed to verify photos" },
        { status: 500 }
      );
    }
    
    if (!photos || photos.length !== photoIds.length) {
      return NextResponse.json(
        { error: "Some photos do not exist or don't belong to you" },
        { status: 400 }
      );
    }
    
    // Check user's model quota
    const { count: modelsCount, error: countError } = await supabase
      .from("models")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    
    if (countError) {
      console.error("Error checking model quota:", countError);
      return NextResponse.json(
        { error: "Failed to check model quota" },
        { status: 500 }
      );
    }
    
    // For now, using a simple free tier limit of 5 models
    const MAX_FREE_TIER_MODELS = 5;
    if ((modelsCount || 0) >= MAX_FREE_TIER_MODELS) {
      return NextResponse.json(
        { error: "You have reached the maximum number of models for your plan" },
        { status: 403 }
      );
    }
    
    // Create new model in database
    console.log("Attempting to create model with data:", {
      id: uuidv4(),
      user_id: userId,
      name: modelName,
      description: description || "",
      status: "pending",
      // Log that we're trying to use trigger_word
      trigger_word: triggerWord || modelName // This might be causing the error if column doesn't exist
    });
    
    // Check the database schema to see if trigger_word column exists
    try {
      const { data: schemaInfo, error: schemaError } = await supabase
        .from('models')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        console.error("Error checking schema:", schemaError);
      } else {
        console.log("Model table first record:", schemaInfo[0]);
        console.log("Available columns in models table:", schemaInfo[0] ? Object.keys(schemaInfo[0]) : "No records found");
      }
    } catch (schemaCheckError) {
      console.error("Failed to check schema:", schemaCheckError);
    }
    
    // Try creating the model without the trigger_word field for now
    const modelDataToInsert = {
      id: uuidv4(),
      user_id: userId,
      name: modelName,
      description: description || "",
      status: "pending"
    };
    
    // Only add trigger_word if it's confirmed to exist in the schema
    // This is a temporary fix until we confirm the schema issue
    // const { data: model, error: modelError } = await supabase
    //   .from("models")
    //   .insert({
    //     id: uuidv4(),
    //     user_id: userId,
    //     name: modelName,
    //     description: description || "",
    //     status: "pending",
    //     trigger_word: triggerWord || modelName // Use triggerWord if provided, otherwise use modelName
    //   })
    //   .select()
    //   .single();
    
    const { data: model, error: modelError } = await supabase
      .from("models")
      .insert(modelDataToInsert)
      .select()
      .single();
    
    if (modelError) {
      console.error("Error creating model:", modelError);
      return NextResponse.json(
        { error: "Failed to create model" },
        { status: 500 }
      );
    }
    
    // Associate photos with the model
    const modelPhotos = photoIds.map(photoId => ({
      model_id: model.id,
      photo_id: photoId,
      user_id: userId
    }));
    
    const { error: associationError } = await supabase
      .from("model_photos")
      .insert(modelPhotos);
    
    if (associationError) {
      console.error("Error associating photos with model:", associationError);
      // Rollback the model creation
      await supabase.from("models").delete().eq("id", model.id);
      return NextResponse.json(
        { error: "Failed to associate photos with model" },
        { status: 500 }
      );
    }
    
    // Schedule the model for training (in a real app, you would enqueue a job)
    // Here we'll just update the status to simulate this
    await supabase
      .from("models")
      .update({ status: "training" })
      .eq("id", model.id);
    
    return NextResponse.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        description: model.description,
        status: "training",
        created_at: model.created_at,
        // Since trigger_word doesn't exist in the database yet, use the value from request instead
        trigger_word: triggerWord || modelName 
      }
    });
    
  } catch (error) {
    console.error("Error creating model:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 