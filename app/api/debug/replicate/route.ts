import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import logger from "@/lib/logger";

// Initialize Replicate client with API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

/**
 * Debug endpoint to test Replicate API calls directly
 * This helps isolate API configuration issues
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { 
      version,
      input = {},
      simplifiedTest = false
    } = await req.json();
    
    // Use provided version or fall back to environment variable
    const versionId = version || process.env.REPLICATE_FLUX_VERSION;
    
    if (!versionId) {
      return NextResponse.json(
        { error: "No version ID provided or configured" },
        { status: 400 }
      );
    }
    
    logger.info("Debug: Testing Replicate API connection", {
      versionId,
      input,
      simplifiedTest
    });
    
    // If simplifiedTest is true, use a basic prediction to test connectivity
    // This avoids any complex input validation and just tests basic API connectivity
    if (simplifiedTest) {
      // Make a simple prediction that doesn't require complex inputs
      // This tests if the API connection and authentication work
      const prediction = await replicate.predictions.create({
        version: versionId,
        input: input || { dummy: "test" }
      });
      
      logger.info("Debug: Simple test prediction created", { predictionId: prediction.id });
      
      return NextResponse.json({
        success: true,
        message: "Simple test prediction created successfully",
        predictionId: prediction.id,
        prediction
      });
    }
    
    // Otherwise, make the actual prediction with provided input
    const prediction = await replicate.predictions.create({
      version: versionId,
      input
    });
    
    logger.info("Debug: Prediction created", { predictionId: prediction.id });
    
    return NextResponse.json({
      success: true,
      message: "Prediction created successfully",
      predictionId: prediction.id,
      prediction
    });
    
  } catch (error: any) {
    // Enhanced error logging with axios-style error handling
    logger.error("Debug: Replicate API error", error);
    
    // Capture complete response data if available
    let errorData = null;
    let errorMessage = error.message || "Unknown error";
    
    if (error.response) {
      // Extract the response data (this handles both axios and fetch-style responses)
      try {
        errorData = typeof error.response.data === 'object' 
          ? error.response.data 
          : JSON.parse(error.response.data);
      } catch (parseError: any) {
        // If can't parse as JSON, use as string
        errorData = {
          raw: error.response.data,
          parseError: parseError.message
        };
      }
      
      // Get a better error message if available
      if (errorData?.detail || errorData?.title) {
        errorMessage = errorData.detail || errorData.title;
      }
      
      // Log the complete error information
      logger.error("Debug: Replicate API detailed error", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: errorData,
        url: error.response.url || error.config?.url,
        method: error.response.method || error.config?.method
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to test Replicate API",
        message: errorMessage,
        details: {
          statusCode: error.response?.status,
          statusText: error.response?.statusText,
          data: errorData
        }
      },
      { status: error.response?.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic"; 