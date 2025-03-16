import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Get the auth token from cookies
    const cookieStore = cookies();
    const authToken = cookieStore.get("__session")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const { prompt, triggerWord } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Ensure we have an API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Create the system message
    const systemMessage = `You are an expert AI image prompt engineer. Your task is to enhance the user's prompt to create a more detailed and visually appealing image.
    
    Guidelines:
    1. Maintain the original intent and subject of the prompt
    2. Add details about lighting, composition, style, and mood
    3. Include relevant artistic references if appropriate
    4. Keep the enhanced prompt concise (under 200 characters if possible)
    5. Do NOT include any explanations or commentary in your response, ONLY the enhanced prompt
    6. If a trigger word is provided, make sure it remains in the prompt
    
    The user will provide a basic prompt, and you will return an enhanced version.`;

    // Create the user message
    const userMessage = triggerWord 
      ? `Enhance this prompt for AI image generation. Make sure to keep the trigger word "${triggerWord}" in the prompt: ${prompt}`
      : `Enhance this prompt for AI image generation: ${prompt}`;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    // Extract the enhanced prompt
    const enhancedPrompt = response.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      return NextResponse.json(
        { error: "Failed to enhance prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      original: prompt,
      enhanced: enhancedPrompt
    });
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 