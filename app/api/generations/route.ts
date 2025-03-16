import { NextRequest, NextResponse } from "next/server";
import { currentUser, auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";
import OpenAI from "openai";
import { supabaseAdmin, getOrCreateUser } from "@/utils/supabase-admin";

// Initialize clients
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

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// GET user generations
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const modelId = searchParams.get("modelId");
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("generations")
      .select("*", { count: "exact" })
      .eq("user_id", supabaseUser.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by model if provided
    if (modelId) {
      query = query.eq("model_id", modelId);
    }

    // Execute query
    const { data: generations, error, count } = await query;

    if (error) {
      console.error("Error fetching generations:", error);
      return NextResponse.json(
        { error: "Failed to fetch generations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      generations,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error("Error getting generations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST to create new generation
export async function POST(req: NextRequest) {
  try {
    // Authenticate user with Clerk
    const session = await auth();
    let clerkUserId = session?.userId;
    let user;
    
    if (!clerkUserId) {
      user = await currentUser();
      if (!user || !user.id) {
        return NextResponse.json(
          { error: "Unauthorized" },
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

    // Parse request body
    const { modelId, prompt, negativePrompt, numberOfImages = 1 } = await req.json();

    // Validate input
    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Valid prompt is required" },
        { status: 400 }
      );
    }

    // Verify model exists and belongs to user
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .eq("user_id", supabaseUser.id)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Check if the model is ready
    if (model.status !== "ready") {
      return NextResponse.json(
        { error: "Model is not ready for generation" },
        { status: 400 }
      );
    }

    // Enhance prompt with OpenAI (optional)
    let enhancedPrompt = prompt;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI that improves image generation prompts. Your task is to enhance the user's prompt to create better images from a text-to-image model. Add more details, artistic styles, lighting, and other elements that will create a more vivid and aesthetically pleasing image. Keep your response to just the enhanced prompt text without explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200
      });

      if (completion.choices[0]?.message?.content) {
        enhancedPrompt = completion.choices[0].message.content;
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      // Continue with original prompt if enhancement fails
    }

    // Number of images to generate (limit to reasonable number)
    const imagesToGenerate = Math.min(numberOfImages, 4);
    
    // Create predictions in Replicate
    const predictions = [];
    for (let i = 0; i < imagesToGenerate; i++) {
      const prediction = await replicate.predictions.create({
        version: model.replicate_version,
        input: {
          prompt: `${enhancedPrompt}`,
          negative_prompt: negativePrompt || "",
          num_inference_steps: 40,
          guidance_scale: 7.5,
        },
      });
      predictions.push(prediction);
    }

    // Create generation records in database
    const generationRecords = predictions.map(prediction => ({
      user_id: supabaseUser.id,
      model_id: modelId,
      replicate_id: prediction.id,
      prompt: prompt,
      enhanced_prompt: enhancedPrompt,
      negative_prompt: negativePrompt || null,
      status: "pending",
      parameters: {
        num_inference_steps: 40,
        guidance_scale: 7.5,
      },
      created_at: new Date().toISOString(),
    }));

    const { data: generations, error: insertError } = await supabase
      .from("generations")
      .insert(generationRecords)
      .select();

    if (insertError) {
      console.error("Error saving generations:", insertError);
      return NextResponse.json(
        { error: "Failed to save generation information" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      generations,
      message: "Image generation started successfully"
    });

  } catch (error) {
    console.error("Error generating images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a generation
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
          { error: "Unauthorized" },
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

    // Get generation ID from query params
    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get("id");

    if (!generationId) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    // Verify generation ownership
    const { data: generation, error: fetchError } = await supabase
      .from("generations")
      .select("*")
      .eq("id", generationId)
      .eq("user_id", supabaseUser.id)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: "Generation not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Delete the generation record
    const { error: deleteError } = await supabase
      .from("generations")
      .delete()
      .eq("id", generationId)
      .eq("user_id", supabaseUser.id);

    if (deleteError) {
      console.error("Error deleting generation:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete generation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Generation deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting generation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 