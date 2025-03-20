import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import logger from "@/lib/logger";

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Authenticate user with Clerk
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const {
      photos,
      triggerWord,
      trainingSteps = 1500,
      loraRank = 16,
      optimizer = "adamw8bit",
      learningRate = 0.0004,
      resolution = "512",
      batchSize = 1
    } = await req.json();

    // Validate input
    if (!triggerWord) {
      return NextResponse.json(
        { error: "Trigger word is required" },
        { status: 400 }
      );
    }

    logger.info("Training request received", {
      triggerWord,
      photoCount: photos?.length || 0,
      trainingSteps,
      loraRank,
      optimizer,
      learningRate,
      resolution,
      batchSize,
      userId: user.id
    });

    if (!photos || !Array.isArray(photos) || photos.length < 10) {
      logger.info("Photo validation failed", { 
        photosProvided: photos ? photos.length : 0,
        isArray: Array.isArray(photos),
        firstFewPhotos: Array.isArray(photos) ? photos.slice(0, 3).map(p => p.substring(0, 30) + '...') : null
      });
      return NextResponse.json(
        { error: "At least 10 photos are required for training" },
        { status: 400 }
      );
    }

    // Create a ZIP file containing all the photos
    const zip = new JSZip();
    const zipFolder = zip.folder("training_photos");
    
    // Download each photo and add it to the ZIP
    try {
      logger.info("Starting photo download for ZIP creation", { photoCount: photos.length });
      
      for (let i = 0; i < photos.length; i++) {
        const photoUrl = photos[i];
        logger.info(`Processing photo ${i+1}/${photos.length}`, {
          urlPreview: photoUrl.substring(0, 30) + '...'
        });
        
        try {
          const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
          logger.info(`Downloaded photo ${i+1}`, { size: response.data.byteLength });
          
          const filename = `photo_${i+1}.jpg`;
          zipFolder?.file(filename, response.data);
        } catch (photoError: any) {
          logger.error(`Error downloading photo ${i+1}`, photoError, {
            urlPreview: photoUrl.substring(0, 30) + '...'
          });
          throw new Error(`Failed to download photo at index ${i}: ${photoError.message}`);
        }
      }
    } catch (error) {
      logger.error("Error downloading photos for ZIP", error);
      return NextResponse.json(
        { error: "Failed to download photos for training" },
        { status: 500 }
      );
    }
    
    // Generate ZIP file
    logger.info("Generating ZIP file");
    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    logger.info("ZIP file generated", { size: zipContent.length });
    
    // Upload the ZIP file to Supabase
    const zipFileName = `${user.id}/${Date.now()}_${uuidv4()}_training.zip`;
    
    logger.info("Uploading ZIP file to storage", { path: zipFileName });
    const { error: zipUploadError } = await supabase.storage
      .from("training")
      .upload(zipFileName, zipContent, {
        contentType: "application/zip",
        upsert: false
      });
      
    if (zipUploadError) {
      logger.error("Error uploading ZIP file to storage", zipUploadError);
      return NextResponse.json(
        { error: "Failed to prepare training data" },
        { status: 500 }
      );
    }
    
    logger.info("ZIP file uploaded successfully");
    
    // Get a signed URL for the ZIP file (valid for 1 hour)
    const { data } = await supabase.storage
      .from("training")
      .createSignedUrl(zipFileName, 3600);
      
    if (!data || !data.signedUrl) {
      logger.error("Failed to generate signed URL for training data");
      return NextResponse.json(
        { error: "Failed to generate signed URL for training data" },
        { status: 500 }
      );
    }

    const signedUrl = data.signedUrl;
    logger.info("Generated signed URL for training ZIP", {
      url: signedUrl.substring(0, 30) + '...'
    });

    // Start training with Replicate
    try {
      // Prepare the prediction input parameters
      const validVersionId = "ostris/flux-dev-lora-trainer:b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef";
      
      // Get the API token directly
      const apiToken = process.env.REPLICATE_API_TOKEN;
      if (!apiToken) {
        throw new Error("Missing Replicate API token");
      }
      
      // Create a destination for the trained model
      const replicateUsername = process.env.REPLICATE_API_USERNAME || process.env.REPLICATE_USERNAME || "visiona";
      const modelName = triggerWord.toLowerCase().replace(/\s+/g, '-');
      const destination = `${replicateUsername}/${modelName}` as `${string}/${string}`;
      
      // Add detailed logging for debugging
      logger.info("Replicate API configuration details:", {
        tokenExists: !!process.env.REPLICATE_API_TOKEN,
        tokenPrefix: process.env.REPLICATE_API_TOKEN ? process.env.REPLICATE_API_TOKEN.substring(0, 4) + '...' : 'NOT SET',
        replicateApiUsername: process.env.REPLICATE_API_USERNAME || 'NOT SET',
        replicateUsername: process.env.REPLICATE_USERNAME || 'NOT SET',
        usedUsername: replicateUsername,
        destination: destination
      });
      
      // Format prediction input with safe values
      const input = {
        input_images: signedUrl,
        trigger_word: triggerWord,
        training_steps: Math.min(Math.max(parseInt(trainingSteps.toString()), 100), 2000),
        learning_rate: Math.min(Math.max(parseFloat(learningRate.toString()), 0.0001), 0.001),
        lora_rank: Math.min(Math.max(parseInt(loraRank.toString()), 4), 64),
        resolution: parseInt(resolution),
        batch_size: Math.min(Math.max(parseInt(batchSize.toString()), 1), 4),
        optimizer: optimizer.toLowerCase()
      };
      
      // Configure webhook if app URL is valid HTTPS
      const webhookConfig: { 
        webhook?: string;
        webhook_events_filter?: string[];
      } = {};
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl && appUrl.startsWith('https://')) {
        logger.info("Configuring webhook", { url: `${appUrl}/api/webhooks/replicate/completed` });
        webhookConfig.webhook = `${appUrl}/api/webhooks/replicate/completed`;
        webhookConfig.webhook_events_filter = ["completed"];
      } else {
        logger.info('Skipping webhook configuration - valid HTTPS URL required');
      }
      
      // Log the request parameters
      logger.replicate('Preparing direct API request', {
        version: validVersionId,
        input: input,
        destination: destination,
        ...webhookConfig
      });
      
      // Create the model first on Replicate before using it as a destination
      logger.info("First creating model on Replicate via /v1/models...");
      const createModelResponse = await fetch(
        `https://api.replicate.com/v1/models`, 
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            owner: replicateUsername,
            name: modelName,
            description: `Model trained with trigger word "${triggerWord}"`,
            visibility: "private",
            hardware: "cpu"
          })
        }
      );
      
      const createModelResponseText = await createModelResponse.text();
      
      logger.info(`Create model response: ${createModelResponse.status} ${createModelResponse.statusText}`, {
        responseBody: createModelResponseText.substring(0, 500)
      });
      
      // Continue even if model already exists (which would give a 409 conflict error)
      if (!createModelResponse.ok && createModelResponse.status !== 409) {
        logger.error("Error creating model on Replicate", {
          status: createModelResponse.status,
          statusText: createModelResponse.statusText,
          body: createModelResponseText
        });
        // Continue anyway, as the model might already exist
      }
      
      // Add a short delay to allow model creation to propagate
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      // Use the model-specific fine-tuning endpoint which is the only approach that works
      logger.info(`Making direct API call to model-specific endpoint...`);
      
      // Extract just the version ID hash
      const versionId = "b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef";
      
      const response = await fetch(
        `https://api.replicate.com/v1/models/ostris/flux-dev-lora-trainer/versions/${versionId}/trainings`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            destination: destination,
            input: input,
            ...webhookConfig
          })
        }
      );
      
      // Handle response
      const responseText = await response.text();
      
      logger.info(`API response: ${response.status} ${response.statusText}`, {
        responseBody: responseText.substring(0, 500)
      });
      
      if (!response.ok) {
        logger.error(`Replicate API error: ${response.status}`, { 
          response: responseText,
          destination: destination 
        });
        throw new Error(`Replicate API error: ${response.status} - ${responseText}`);
      }
      
      const training = JSON.parse(responseText);
      logger.info("Replicate training started successfully", { trainingId: training.id });

      // Save model reference in database using the correct schema
      const { data: model, error: modelError } = await supabase
        .from("models")
        .insert({
          id: training.id,
          user_id: user.id,
          name: triggerWord,
          trigger_word: triggerWord,
          description: `Model trained with trigger word "${triggerWord}"`,
          status: "Processing",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (modelError) {
        logger.error("Error saving model to database", modelError);
        return NextResponse.json(
          { error: "Failed to save model information" },
          { status: 500 }
        );
      }

      logger.info("Model saved to database", { modelId: model.id });

      // Save photo references for this model
      for (const photoUrl of photos) {
        await supabase
          .from("model_photos")
          .insert({
            model_id: model.id,
            photo_url: photoUrl,
            user_id: user.id
          });
      }

      logger.info("Photo references saved for model");

      return NextResponse.json({
        success: true,
        model: {
          id: model.id,
          trigger_word: triggerWord,
          status: "Processing",
          replicate_id: training.id,
        },
        message: "Model training started successfully"
      });
    } catch (error: any) {
      // Enhanced error logging with axios-style error handling
      logger.error("Replicate API error during model training", error);
      
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
        logger.error("Replicate API detailed error", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: errorData,
          url: error.response.url || error.config?.url,
          method: error.response.method || error.config?.method
        });
      }
      
      // Get version from outer scope for error details
      const versionUsed = process.env.REPLICATE_FLUX_VERSION || 
                          "ostris/flux-dev-lora-trainer:b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef";
      
      // Enhanced error reporting with much more detailed information
      return NextResponse.json(
        { 
          error: "Failed to start model training with Replicate",
          message: errorMessage,
          details: {
            statusCode: error.response?.status,
            statusText: error.response?.statusText,
            data: errorData,
            versionUsed: versionUsed,
            // Include basic input parameters for debugging
            inputParams: {
              triggerWord,
              trainingSteps,
              resolution
            }
          }
        },
        { status: error.response?.status || 500 }
      );
    }

  } catch (error: any) {
    logger.error("Error starting model training", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 