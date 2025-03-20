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
    console.log("🚀 Processing image generation request");
    
    // Authenticate user with Clerk
    const session = await auth();
    let clerkUserId = session?.userId;
    let user;
    
    if (!clerkUserId) {
      user = await currentUser();
      if (!user || !user.id) {
        console.log("❌ Authentication failed: No user found");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      clerkUserId = user.id;
    } else {
      user = await currentUser();
    }

    console.log(`✅ User authenticated: ${clerkUserId}`);

    // Get Supabase user from Clerk ID
    const email = user?.emailAddresses?.[0]?.emailAddress || '';
    const supabaseUser = await getOrCreateUser(clerkUserId, email);
    console.log(`✅ Supabase user found: ${supabaseUser.id}`);

    // Parse request body
    const body = await req.json();
    const { modelId, prompt, negativePrompt, numberOfImages = 1 } = body;
    
    console.log("📦 Request payload:", { 
      modelId, 
      promptLength: prompt?.length,
      hasNegativePrompt: !!negativePrompt,
      numberOfImages
    });

    // Validate input
    if (!modelId) {
      console.log("❌ Validation failed: Missing modelId");
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string") {
      console.log("❌ Validation failed: Invalid prompt", { prompt });
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

    if (modelError) {
      console.log("❌ Model query error:", modelError);
      return NextResponse.json(
        { error: "Error fetching model details" },
        { status: 500 }
      );
    }
    
    if (!model) {
      console.log("❌ Model not found:", { modelId, userId: supabaseUser.id });
      return NextResponse.json(
        { error: "Model not found or you don't have permission" },
        { status: 404 }
      );
    }
    
    console.log("📋 Model details:", { 
      id: model.id,
      name: model.name,
      status: model.status,
      version_id: model.version_id,
      replicate_version: model.replicate_version,
      trigger_word: model.trigger_word,
    });

    // Check if the model is ready
    if (model.status?.toLowerCase() !== "completed" && 
        model.status?.toLowerCase() !== "ready") {
      console.log("❌ Model not ready:", { status: model.status });
      return NextResponse.json(
        { error: "Model is not ready for generation" },
        { status: 400 }
      );
    }
    
    // Check for required version information
    if (!model.version_id && !model.replicate_version) {
      console.log("❌ Missing version information:", { 
        version_id: model.version_id,
        replicate_version: model.replicate_version 
      });
      return NextResponse.json(
        { error: "Model is missing required version information" },
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
    try {
      console.log("⏳ Starting image generation with Replicate");
      
      // Determine which version ID to use
      const versionToUse = model.replicate_version || model.version_id;
      if (!versionToUse) {
        console.log("❌ No valid version ID found for model:", model.id);
        return NextResponse.json(
          { error: "Model does not have a valid version ID" },
          { status: 400 }
        );
      }
      
      console.log("✅ Using version:", versionToUse);
      
      for (let i = 0; i < imagesToGenerate; i++) {
        console.log(`⏳ Creating prediction ${i+1}/${imagesToGenerate}`);
        
        try {
          const prediction = await replicate.predictions.create({
            version: versionToUse,
            input: {
              prompt: `${enhancedPrompt}`,
              negative_prompt: negativePrompt || "",
              num_inference_steps: 40,
              guidance_scale: 7.5,
            },
          });
          
          console.log(`✅ Prediction ${i+1} created:`, { id: prediction.id });
          predictions.push(prediction);
        } catch (predictionError: any) {
          console.error(`❌ Error creating prediction ${i+1}:`, predictionError.message);
          // Log more details from the error
          if (predictionError.response) {
            console.error('Response status:', predictionError.response.status);
            console.error('Response data:', predictionError.response.data);
          }
          throw predictionError; // Re-throw to be handled by outer catch
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to generate images:", error.message);
      return NextResponse.json(
        { error: `Failed to generate images: ${error.message}` },
        { status: 500 }
      );
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