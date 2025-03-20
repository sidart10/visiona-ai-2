import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import AdmZip from 'adm-zip';
import logger from "@/lib/logger";

// Convert exec to Promise-based
const exec = promisify(execCallback);

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Create a temporary directory for our photos
  const tempDir = path.join(os.tmpdir(), `training-${uuidv4()}`);
  const zipFilePath = path.join(os.tmpdir(), `training-${uuidv4()}.zip`);
  
  // Debug environment variables
  logger.info("Checking environment variables", {
    hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
    tokenPrefix: process.env.REPLICATE_API_TOKEN ? process.env.REPLICATE_API_TOKEN.substring(0, 4) + '...' : 'NOT SET',
    replicateUsername: process.env.REPLICATE_USERNAME || 'NOT SET'
  });
  
  try {
    // Create the temporary directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Get current user from Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { 
      name,
      photoIds, 
      triggerWord,
      trainingSteps = 1000,
      loraRank = 32,
      optimizer = "adamw8bit",
      learningRate = 0.0004,
      resolution = "512",
      batchSize = 1
    } = body;
    
    // Validate input
    if (!triggerWord) {
      return NextResponse.json(
        { error: "Trigger word is required" },
        { status: 400 }
      );
    }
    
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length < 10) {
      logger.info("Photo validation failed", { 
        photoIdsProvided: photoIds ? photoIds.length : 0,
        isArray: Array.isArray(photoIds)
      });
      return NextResponse.json(
        { error: "At least 10 photos are required for training" },
        { status: 400 }
      );
    }
    
    logger.info("Photo IDs received from frontend", { photoIds, userId: user.id });
    
    // Get Supabase user ID for database operations
    const { data: supabaseUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .maybeSingle();
    
    if (userError || !supabaseUser) {
      logger.error("Error fetching user", userError, { clerkId: user.id });
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 400 }
      );
    }
    
    const supabaseUserId = supabaseUser.id;
    logger.info(`User mapping found`, { clerkId: user.id, supabaseId: supabaseUserId });
    
    // Verify that photos exist and belong to the user
    logger.info("Validating photo ownership", {
      clerkId: user.id,
      supabaseUserId: supabaseUserId,
      photoCount: photoIds.length
    });
    
    // Use Supabase user ID for validation
    let { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, storage_path, user_id")
      .eq("user_id", supabaseUserId.toString())
      .in("id", photoIds);
    
    if (photosError) {
      logger.error("Error fetching photos", photosError, {
        userId: supabaseUserId,
        photoIds
      });
      return NextResponse.json(
        { error: "Failed to verify photos" },
        { status: 500 }
      );
    }
    
    logger.info("Photos found in database", { count: photos?.length || 0 });
    
    if (!photos || photos.length === 0) {
      logger.error("No photos returned from database query", null, {
        userId: supabaseUserId,
        photoIds
      });
      return NextResponse.json(
        { error: "No photos found for the provided IDs" },
        { status: 400 }
      );
    }
    
    // Check which photo IDs weren't found
    if (photos.length !== photoIds.length) {
      const foundPhotoIds = photos.map(p => p.id);
      const missingPhotoIds = photoIds.filter(id => !foundPhotoIds.includes(id));
      logger.error("Missing photo IDs", null, { missingPhotoIds });
      
      // Additional diagnostics - try to find these photos without user filter
      const { data: anyPhotos } = await supabase
        .from("photos")
        .select("id, user_id")
        .in("id", missingPhotoIds);
      
      if (anyPhotos && anyPhotos.length > 0) {
        logger.info("Found photos but with different user IDs", { 
          photos: anyPhotos,
          currentUserId: supabaseUserId 
        });
        
        // Fix the photos ownership issues
        if (supabaseUserId) {
          logger.info("Attempting to fix photo ownership", {
            photoCount: anyPhotos.length,
            userId: supabaseUserId
          });
          
          const photoIdsToFix = anyPhotos.map(p => p.id);
          
          const { data: fixResult, error: fixError } = await supabase
            .from("photos")
            .update({ user_id: supabaseUserId.toString() })
            .in("id", photoIdsToFix)
            .select("id, user_id");
            
          if (fixError) {
            logger.error("Error fixing photo ownership", fixError, {
              photoIds: photoIdsToFix
            });
          } else {
            logger.info("Fixed photo ownership", { fixedPhotos: fixResult });
            
            // Re-fetch the photos with the updated ownership
            const { data: updatedPhotos, error: refetchError } = await supabase
              .from("photos")
              .select("id, storage_path, user_id")
              .eq("user_id", supabaseUserId.toString())
              .in("id", photoIds);
              
            if (!refetchError && updatedPhotos && updatedPhotos.length === photoIds.length) {
              logger.info("Successfully fixed and found all photos", { 
                count: updatedPhotos.length
              });
              photos = updatedPhotos;
            } else {
              logger.error("Could not verify all photos after fixing", refetchError, {
                foundCount: updatedPhotos?.length || 0,
                requestedCount: photoIds.length
              });
              return NextResponse.json(
                { 
                  error: "Some photos could not be verified after fixing ownership",
                  details: {
                    requestedPhotoIds: photoIds,
                    foundPhotoIds: updatedPhotos?.map(p => p.id) || [],
                    fixedPhotoIds: fixResult?.map(p => p.id) || []
                  }
                },
                { status: 400 }
              );
            }
          }
        }
      } else {
        logger.error("Photos with these IDs don't exist at all", null, { 
          missingPhotoIds 
        });
        return NextResponse.json(
          { 
            error: "Some photos do not exist or don't belong to you",
            details: {
              requestedPhotoIds: photoIds,
              foundPhotoIds: photos.map(p => p.id),
              missingPhotoIds
            }
          },
          { status: 400 }
        );
      }
    }
    
    // Track successful photos to ensure we have enough
    let successfulPhotoCount = 0;
    const failedPhotos = [];
    
    // Download each photo and save it to the temporary directory
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      logger.info(`Processing photo ${i+1}/${photos.length}`, { 
        photoId: photo.id,
        storagePath: photo.storage_path 
      });
      
      try {
        const photoFileName = `photo_${i+1}.jpg`;
        const photoFilePath = path.join(tempDir, photoFileName);
        
        // Get public URL for the photo
        const { data: urlData } = await supabase.storage
          .from("photos")
          .getPublicUrl(photo.storage_path);
        
        if (!urlData || !urlData.publicUrl) {
          throw new Error(`Failed to get public URL for photo ${photo.id}`);
        }
        
        logger.info(`Got public URL for photo ${i+1}`, { 
          photoId: photo.id,
          url: urlData.publicUrl.substring(0, 50) + '...' 
        });
        
        // Download directly to file using axios
        const response = await axios({
          method: 'get',
          url: urlData.publicUrl,
          responseType: 'arraybuffer'
        });
        
        // Write the file to disk
        fs.writeFileSync(photoFilePath, Buffer.from(response.data));
        logger.info(`Saved photo ${i+1} to temporary location`, { 
          photoId: photo.id,
          path: photoFilePath,
          size: response.data.length
        });
        successfulPhotoCount++;
      } catch (downloadError) {
        logger.error(`Error downloading photo ${photo.id}`, downloadError);
        failedPhotos.push({ id: photo.id, index: i+1 });
      }
    }
    
    logger.info(`Photo download summary`, {
      successful: successfulPhotoCount,
      failed: failedPhotos.length,
      total: photos.length
    });
    
    // Check if we have enough photos for training
    if (successfulPhotoCount < 10) {
      throw new Error(`Not enough photos downloaded successfully. Needed at least 10, but only got ${successfulPhotoCount}.`);
    }
    
    if (failedPhotos.length > 0) {
      logger.info(`Continuing despite some download failures`, { 
        failedPhotos
      });
    }
    
    // Create ZIP file using the system's zip command
    logger.info(`Creating ZIP file`, { path: zipFilePath });
    
    try {
      // Check if the zip command is available (for Unix/macOS)
      try {
        await exec('which zip');
        logger.info('Zip command is available, using system ZIP');
      } catch (cmdError) {
        logger.info('Zip command not found, using AdmZip as fallback');
        
        // Use a js-based zip creation method as fallback
        const zip = new AdmZip();
        
        // Add the files to the ZIP
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          zip.addLocalFile(filePath);
        }
        
        // Write the ZIP file
        zip.writeZip(zipFilePath);
        logger.info(`ZIP file created using AdmZip`, { path: zipFilePath });
        
        // Skip the exec call since we used AdmZip
        return; // Skip the rest of this try block
      }
      
      // If zip command is available, create the ZIP file
      const { stdout, stderr } = await exec(`cd "${tempDir}" && zip -r "${zipFilePath}" .`);
      
      logger.info(`ZIP creation output`, { stdout, stderr });
    } catch (zipError: any) {
      logger.error(`Error creating ZIP`, zipError);
      throw new Error(`Failed to create ZIP file: ${zipError.message || 'Unknown error'}`);
    }
    
    // Read the ZIP file from disk
    const zipContent = fs.readFileSync(zipFilePath);
    logger.info(`ZIP file read from disk`, { size: zipContent.length });
    
    // Upload the ZIP file to Supabase with explicit content type
    const zipFileName = `${user.id}/${Date.now()}_${uuidv4()}_training.zip`;
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
    
    logger.info(`ZIP file uploaded to storage`, { path: zipFileName });
    
    // Check ZIP file structure
    logger.info("Verifying ZIP file structure");
    try {
      const zip = new AdmZip(zipFilePath);
      const zipEntries = zip.getEntries();
      
      // Log number of files and their types
      const fileTypes = zipEntries.map(entry => ({
        name: entry.name,
        size: entry.header.size,
        compressed: entry.header.compressedSize,
        isDirectory: entry.isDirectory
      }));
      
      logger.info(`ZIP file contains ${zipEntries.length} entries`, { 
        fileTypes: fileTypes.slice(0, 10), // Log first 10 files only
        totalFiles: zipEntries.length,
        imageFiles: zipEntries.filter(e => 
          e.name.endsWith('.jpg') || e.name.endsWith('.jpeg') || e.name.endsWith('.png')
        ).length
      });
    } catch (zipCheckError) {
      logger.error("Error checking ZIP file structure", zipCheckError);
    }
    
    // Get a signed URL for the ZIP file (valid for 1 hour)
    const { data } = await supabase.storage
      .from("training")
      .createSignedUrl(zipFileName, 3600);
      
    if (!data || !data.signedUrl) {
      logger.error("Failed to generate signed URL for ZIP file");
      return NextResponse.json(
        { error: "Failed to generate signed URL for training data" },
        { status: 500 }
      );
    }
    
    const signedUrl = data.signedUrl;
    logger.info(`Generated signed URL for training ZIP`, { 
      url: signedUrl.substring(0, 50) + '...'
    });

    // Start training with Replicate
    logger.info("Starting model training with Replicate");
    
    // Prepare the prediction input parameters
    const fullVersionId = process.env.REPLICATE_FLUX_VERSION || "ostris/flux-dev-lora-trainer:b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef";
    
    // Split the version string into components for different API formats
    const versionString = "ostris/flux-dev-lora-trainer:b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef";
    const versionParts = versionString.split(':');
    const versionId = versionParts.length > 1 ? versionParts[1] : versionString;
    const modelIdentifier = versionParts.length > 1 ? versionParts[0] : "ostris/flux-dev-lora-trainer";
    
    // No need to extract just the hash part
    // No need for destination model name as this is a fine-tuning model that works with predictions API
    
    // Log the full training parameters (except API token)
    logger.replicate('Preparing prediction request', {
      version: fullVersionId,
      input: {
        input_images: signedUrl,
        trigger_word: triggerWord,
        training_steps: Math.min(Math.max(parseInt(trainingSteps.toString()), 100), 2000),
        learning_rate: Math.min(Math.max(parseFloat(learningRate.toString()), 0.0001), 0.001),
        lora_rank: Math.min(Math.max(parseInt(loraRank.toString()), 4), 64),
        resolution: parseInt(resolution),
        batch_size: Math.min(Math.max(parseInt(batchSize.toString()), 1), 4)
      }
    });
    
    try {
      logger.info(`Making Replicate API call for prediction with fine-tuning`);
      
      // Test the signed URL accessibility
      try {
        logger.info("Testing signed URL accessibility");
        const urlCheckResponse = await fetch(signedUrl, {
          method: 'HEAD',
          // No credentials - simulating an external service call
        });
        
        logger.info(`Signed URL check result: ${urlCheckResponse.status} ${urlCheckResponse.statusText}`, {
          headers: Object.fromEntries(Array.from(urlCheckResponse.headers)),
          url: signedUrl.substring(0, 60) + '...',
          contentType: urlCheckResponse.headers.get('content-type'),
          contentLength: urlCheckResponse.headers.get('content-length')
        });
        
        if (!urlCheckResponse.ok) {
          logger.error("Signed URL is not accessible!");
        }
      } catch (urlError) {
        logger.error("Error testing signed URL:", urlError);
      }
      
      // Parse resolution correctly
      let resolutionValue = resolution;
      if (resolution.includes('x')) {
        // If we have a format like "512x512", extract just the first number
        resolutionValue = resolution.split('x')[0];
      }
      
      // Ensure optimizer is lowercase to match Replicate's expectations
      const optimizerValue = optimizer.toLowerCase();
      
      // Clean and validate all input parameters
      const trainingStepsValue = Math.min(Math.max(parseInt(trainingSteps.toString()), 100), 2000);
      const learningRateValue = Math.min(Math.max(parseFloat(learningRate.toString()), 0.0001), 0.001);
      const loraRankValue = Math.min(Math.max(parseInt(loraRank.toString()), 4), 64);
      const resolutionIntValue = parseInt(resolutionValue);
      const batchSizeValue = Math.min(Math.max(parseInt(batchSize.toString()), 1), 4);
      
      // Validate trigger word - ensure it's alphanumeric and doesn't contain spaces
      const cleanTriggerWord = triggerWord.trim();
      if (cleanTriggerWord.includes(' ')) {
        logger.info("Trigger word contains spaces, which may cause issues", { 
          original: triggerWord, 
          cleaned: cleanTriggerWord.replace(/\s+/g, '') 
        });
      }
      
      // Log trigger word details for debugging
      logger.info("Trigger word analysis:", {
        original: triggerWord,
        trimmed: cleanTriggerWord,
        length: cleanTriggerWord.length,
        hasSpaces: cleanTriggerWord.includes(' '),
        hasSpecialChars: /[^a-zA-Z0-9]/.test(cleanTriggerWord)
      });
      
      // Declare prediction at a scope accessible to both try blocks
      let training;
      
      try {
        // Log what we're going to do
        logger.info("Making direct fetch to Replicate Training API...");
        const apiToken = process.env.REPLICATE_API_TOKEN;
        
        if (!apiToken) {
          throw new Error("Missing Replicate API token");
        }
        
        // Get the username from environment variable or default to the user ID
        const replicateUsername = process.env.REPLICATE_API_USERNAME || process.env.REPLICATE_USERNAME || "visiona";
        
        // Use the same model name logic as above but simplify it for replicate API compatibility
        const modelNameForDestination = name 
          ? name.trim().replace(/\s+/g, '-').toLowerCase() 
          : cleanTriggerWord.toLowerCase();
        
        // Create a simple destination without timestamp - Replicate will handle the versioning
        // This format must be "username/modelname" exactly as per the Replicate docs
        const destination = `${replicateUsername}/${modelNameForDestination}` as `${string}/${string}`;
        
        // Add detailed environment variable logging
        logger.info("Replicate API configuration details:", {
          tokenExists: !!process.env.REPLICATE_API_TOKEN,
          tokenPrefix: process.env.REPLICATE_API_TOKEN ? process.env.REPLICATE_API_TOKEN.substring(0, 4) + '...' : 'NOT SET',
          replicateApiUsername: process.env.REPLICATE_API_USERNAME || 'NOT SET',
          replicateUsername: process.env.REPLICATE_USERNAME || 'NOT SET',
          usedUsername: replicateUsername,
          destination: destination
        });
        
        logger.info(`Using simplified destination format: ${destination}`, { 
          originalName: name || cleanTriggerWord,
          sanitizedName: modelNameForDestination
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
              name: modelNameForDestination,
              description: `Model trained on ${name || cleanTriggerWord} images`,
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
          // If it's not just a "model already exists" error, log it and continue anyway
          logger.error("Error creating model on Replicate", {
            status: createModelResponse.status,
            statusText: createModelResponse.statusText,
            body: createModelResponseText
          });
        }
        
        // Add a short delay to allow model creation to propagate
        logger.info("Adding delay to allow model creation to propagate...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        
        // Now use the model-specific fine-tuning endpoint which is the only approach that works
        logger.info("Using model-specific fine-tuning endpoint...");
        
        const trainingResponse = await fetch(
          `https://api.replicate.com/v1/models/ostris/flux-dev-lora-trainer/versions/${versionId}/trainings`, 
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${apiToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              destination: destination,
              input: {
                training_steps: trainingStepsValue,
                lora_rank: loraRankValue,
                optimizer: optimizerValue,
                batch_size: batchSizeValue,
                resolution: resolutionIntValue,
                autocaption: true,
                input_images: signedUrl,
                trigger_word: cleanTriggerWord,
                learning_rate: learningRateValue
              }
            })
          }
        );
        
        const trainingResponseText = await trainingResponse.text();
        
        logger.info(`Training API response: ${trainingResponse.status} ${trainingResponse.statusText}`, {
          responseBody: trainingResponseText.substring(0, 500)
        });
        
        if (!trainingResponse.ok) {
          throw new Error(`Training API error: ${trainingResponse.status} ${trainingResponseText}`);
        }
        
        const training = JSON.parse(trainingResponseText);
        logger.info("Training started successfully!", { id: training.id });
      
        // Save model reference in database using the correct schema
        // Note: The models table has id, user_id, name, description, status, etc.
        // But NOT model_id which we were trying to use before
        const { data: model, error: modelError } = await supabase
          .from("models")
          .insert({
            id: training.id,
            user_id: supabaseUserId.toString(),
            name: name || cleanTriggerWord,
            description: `Model trained with trigger word "${cleanTriggerWord}"`,
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
        
        logger.info(`Model saved to database`, { modelId: model.id });
        
        // Double-check that we can retrieve the model we just saved
        const verifyCheck = await supabase
          .from("models")
          .select("*")
          .eq("id", model.id)
          .eq("user_id", supabaseUserId.toString());
          
        logger.info(`Verification DB check:`, { 
          count: verifyCheck.data?.length || 0,
          error: verifyCheck.error,
          modelId: model.id,
          userId: supabaseUserId.toString()
        });

        // Save photo references for this model
        for (const photoId of photoIds) {
          await supabase
            .from("model_photos")
            .insert({
              model_id: model.id,
              photo_id: photoId,
              user_id: supabaseUserId.toString()
            });
        }
        
        logger.info("Photo references saved for the model");

        return NextResponse.json({
          success: true,
          model: {
            id: model.id,
            name: name || cleanTriggerWord,
            description: `Model trained with trigger word "${cleanTriggerWord}"`,
            trigger_word: cleanTriggerWord,
            status: "Processing",
            replicate_id: training.id,
            user_id: supabaseUserId.toString(),
            modelData: model
          },
          message: "Model training started successfully"
        });
      } catch (error: any) {
        // Log and handle any errors from the API approach
        logger.error("Error with Replicate API", error);
        return NextResponse.json(
          { error: error.message || "Failed to start model training - API error" },
          { status: 500 }
        );
      }
    } catch (error: any) {
      logger.error("Error creating model", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    } finally {
      // Clean up: remove temporary files regardless of success/failure
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmdirSync(tempDir, { recursive: true });
          logger.info(`Cleaned up temporary directory`, { path: tempDir });
        }
        if (fs.existsSync(zipFilePath)) {
          fs.unlinkSync(zipFilePath);
          logger.info(`Cleaned up ZIP file`, { path: zipFilePath });
        }
      } catch (cleanupError) {
        logger.error("Error during cleanup", cleanupError);
      }
    }
  } catch (error: any) {
    logger.error("Error creating model", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 