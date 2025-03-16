import { NextRequest, NextResponse } from "next/server";
import { currentUser, auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin, getOrCreateUser } from "@/utils/supabase-admin";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-supabase-role': 'service_role',
      },
    },
  }
);

// GET user models
export async function GET(req: NextRequest) {
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

    // Optional query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("models")
      .select("*, model_photos(photo_id)", { count: "exact" })
      .eq("user_id", supabaseUser.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Execute query
    const { data: models, error, count } = await query;

    if (error) {
      console.error("Error fetching models:", error);
      return NextResponse.json(
        { error: "Failed to fetch models" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      models,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error("Error getting models:", error);
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