import Replicate from 'replicate';

// Initialize Replicate client with API key from environment variables
export const getReplicateClient = () => {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  
  if (!apiKey) {
    throw new Error('Missing Replicate API token (REPLICATE_API_TOKEN)');
  }
  
  return new Replicate({ auth: apiKey });
};

// Interface for LoRA training parameters
export interface LoraTrainingParams {
  userId: string;
  instanceName: string;
  images: string; // URL to the zip file containing images
  triggerWord: string;
  webhookUrl?: string;
  numTrainingSteps?: number;
  learningRate?: number;
  resolution?: number;
  rank?: number;
  batchSize?: number;
}

// Default training parameters for Flux LoRA trainer
const DEFAULT_TRAINING_PARAMS = {
  numTrainingSteps: 1000,
  learningRate: 1e-4,
  resolution: 512,
  rank: 32,
  batchSize: 1
};

/**
 * Start a LoRA training job with Flux
 * @param params Training parameters including user images and settings
 * @returns The training object from Replicate
 */
export async function startLoraTraining(params: LoraTrainingParams) {
  const {
    userId,
    instanceName,
    images,
    triggerWord,
    webhookUrl,
    numTrainingSteps = DEFAULT_TRAINING_PARAMS.numTrainingSteps,
    learningRate = DEFAULT_TRAINING_PARAMS.learningRate,
    resolution = DEFAULT_TRAINING_PARAMS.resolution,
    rank = DEFAULT_TRAINING_PARAMS.rank,
    batchSize = DEFAULT_TRAINING_PARAMS.batchSize,
  } = params;

  try {
    // Get API token directly from environment
    const apiToken = process.env.REPLICATE_API_TOKEN;
    
    if (!apiToken) {
      throw new Error('Missing Replicate API token (REPLICATE_API_TOKEN)');
    }
    
    // Parse resolution if it's in string format
    let resolutionValue = resolution;
    if (typeof resolutionValue === 'string' || resolutionValue.toString().includes('x')) {
      const resolutionStr = resolutionValue.toString();
      if (resolutionStr.includes('x')) {
        resolutionValue = parseInt(resolutionStr.split('x')[0]);
      }
    }
    
    // Create a properly formatted destination
    const username = process.env.REPLICATE_API_USERNAME || process.env.REPLICATE_USERNAME || 'visiona';
    const sanitizedModelName = instanceName.replace(/\s+/g, '-').toLowerCase();
    const destination = `${username}/${sanitizedModelName}` as `${string}/${string}`;
    
    console.log(`[DEBUG] Using Replicate API token: ${apiToken.substring(0, 5)}...`);
    console.log(`[DEBUG] Destination: ${destination}`);
    
    // Configure webhook
    const webhookConfig: { 
      webhook?: string;
      webhook_events_filter?: string[];
    } = {};
    
    if (webhookUrl) {
      webhookConfig.webhook = webhookUrl;
      webhookConfig.webhook_events_filter = ["completed"];
    }
    
    // Create the model first on Replicate before using it as a destination
    console.log("First creating model on Replicate via /v1/models...");
    try {
      const createModelResponse = await fetch(
        `https://api.replicate.com/v1/models`, 
        {
          method: "POST",
          headers: {
            "Authorization": `Token ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            owner: username,
            name: sanitizedModelName,
            description: `Model trained with "${instanceName}" images and trigger word "${triggerWord}"`,
            visibility: "private",
            hardware: "cpu"
          })
        }
      );
      
      const createModelResponseText = await createModelResponse.text();
      console.log(`Create model response: ${createModelResponse.status} ${createModelResponse.statusText}`, 
        createModelResponseText.substring(0, 500));
      
      // Continue even if model already exists (which would give a 409 conflict error)
      if (!createModelResponse.ok && createModelResponse.status !== 409) {
        console.error("Error creating model on Replicate", 
          createModelResponse.status, createModelResponse.statusText, createModelResponseText);
      }
    } catch (createModelError) {
      console.error("Error creating model:", createModelError);
      // Continue anyway to attempt the training
    }
    
    // Add a short delay to allow model creation to propagate
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    
    // Use the model-specific fine-tuning endpoint that works
    const versionId = "b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef";
    
    // Make direct API call to the model-specific endpoint
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
          input: {
            input_images: images,
            trigger_word: triggerWord,
            training_steps: numTrainingSteps, 
            learning_rate: learningRate,
            lora_rank: rank,
            resolution: resolutionValue,
            batch_size: batchSize,
            optimizer: "adamw8bit",
            autocaption: true
          },
          ...webhookConfig
        })
      }
    );
    
    // Handle non-OK responses
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Replicate API error:', response.status, responseText);
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`Replicate API error: ${errorData.detail || 'Unknown error'}`);
      } catch (parseError) {
        throw new Error(`Replicate API error (${response.status}): ${responseText}`);
      }
    }
    
    // Parse successful response
    const data = await response.json();
    console.log('Training started successfully:', data);
    return data;
  } catch (error) {
    console.error('Error starting LoRA training job:', error);
    throw error;
  }
}

/**
 * Generate images using a trained LoRA model
 * @param modelId The Replicate model ID to use for generation
 * @param prompt The text prompt for image generation
 * @param loraModel The trained LoRA model URL
 * @param options Additional generation options
 * @returns The prediction object from Replicate
 */
export async function generateImages(
  modelId: string,
  prompt: string,
  loraModel: string,
  options = {}
) {
  const replicate = getReplicateClient();
  
  try {
    const prediction = await replicate.predictions.create({
      version: modelId,
      input: {
        prompt: prompt,
        lora_url: loraModel,
        num_outputs: 4,
        ...options,
      },
    });

    return prediction;
  } catch (error) {
    console.error('Error generating images with LoRA model:', error);
    throw error;
  }
}

/**
 * Check the status of a Replicate prediction
 * @param id The prediction ID to check
 * @returns The prediction status and output (if available)
 */
export async function checkPredictionStatus(id: string) {
  const replicate = getReplicateClient();
  
  try {
    const prediction = await replicate.predictions.get(id);
    return prediction;
  } catch (error) {
    console.error('Error checking prediction status:', error);
    throw error;
  }
}

/**
 * Check the status of a Replicate training
 * @param id The training ID to check
 * @returns The training status and output (if available)
 */
export async function checkTrainingStatus(id: string) {
  const replicate = getReplicateClient();
  
  try {
    const training = await replicate.trainings.get(id);
    return training;
  } catch (error) {
    console.error('Error checking training status:', error);
    throw error;
  }
}

/**
 * Cancel a running prediction
 * @param id The prediction ID to cancel
 * @returns The canceled prediction
 */
export async function cancelPrediction(id: string) {
  const replicate = getReplicateClient();
  
  try {
    const prediction = await replicate.predictions.cancel(id);
    return prediction;
  } catch (error) {
    console.error('Error canceling prediction:', error);
    throw error;
  }
} 