import { NextRequest, NextResponse } from "next/server";
import { currentUser, auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getOrCreateUser } from "@/utils/supabase-admin";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET user models
export async function GET(req: NextRequest) {
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
    
    // Get all models for the user
    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select(`
        id,
        name, 
        description,
        status,
        created_at,
        updated_at,
        trained_at,
        error_message,
        model_photos (
          id,
          photo_id,
          photo:photos (
            id,
            storage_path
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (modelsError) {
      console.error("Error fetching models:", modelsError);
      return NextResponse.json(
        { error: "Failed to fetch models", success: false },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      models: models || []
    });
    
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a user model
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user with Clerk
    const session = await auth();
    let clerkUserId = session?.userId;
    let user;
    
    if (!clerkUserId) {
      user = await currentUser();
      if (!user || !user.id) {
        return NextResponse.json(
          { error: "Unauthorized", success: false },
          { status: 401 }
        );
      }
      clerkUserId = user.id;
    } else {
      user = await currentUser();
    }

    // Get Supabase user from Clerk ID
    const email = user?.emailAddresses?.[0]?.emailAddress || '';
    const supabaseUser = await getOrCreateUser(clerkUserId, email);

    // Get model ID from query params
    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get("id");

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Verify model ownership
    const { data: model, error: fetchError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .eq("user_id", supabaseUser.id)
      .single();

    if (fetchError || !model) {
      return NextResponse.json(
        { error: "Model not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Delete model photos links
    const { error: linkError } = await supabase
      .from("model_photos")
      .delete()
      .eq("model_id", modelId);

    if (linkError) {
      console.error("Error deleting model photo links:", linkError);
      // Continue even if this fails
    }

    // Delete model generations
    const { error: genError } = await supabase
      .from("generations")
      .delete()
      .eq("model_id", modelId);

    if (genError) {
      console.error("Error deleting model generations:", genError);
      // Continue even if this fails
    }

    // Delete the model
    const { error: deleteError } = await supabase
      .from("models")
      .delete()
      .eq("id", modelId)
      .eq("user_id", supabaseUser.id);

    if (deleteError) {
      console.error("Error deleting model:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Model deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting model:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 