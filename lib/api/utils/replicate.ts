import Replicate from 'replicate';

// Initialize Replicate client with API key from environment variables
export const getReplicateClient = () => {
  const apiKey = process.env.REPLICATE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing Replicate API key');
  }
  
  return new Replicate({ auth: apiKey });
};

// Interface for LoRA training parameters
export interface LoraTrainingParams {
  userId: string;
  instanceName: string;
  images: string[];
  webhookUrl?: string;
  numTrainingSteps?: number;
  learningRate?: number;
  resolution?: number;
}

// Default training parameters for Flux LoRA trainer
const DEFAULT_TRAINING_PARAMS = {
  numTrainingSteps: 1000,
  learningRate: 1e-4,
  resolution: 512,
};

/**
 * Start a LoRA training job with Flux
 * @param params Training parameters including user images and settings
 * @returns The prediction object from Replicate
 */
export async function startLoraTraining(params: LoraTrainingParams) {
  const replicate = getReplicateClient();
  const {
    userId,
    instanceName,
    images,
    webhookUrl,
    numTrainingSteps = DEFAULT_TRAINING_PARAMS.numTrainingSteps,
    learningRate = DEFAULT_TRAINING_PARAMS.learningRate,
    resolution = DEFAULT_TRAINING_PARAMS.resolution,
  } = params;

  try {
    // Start the training job
    const prediction = await replicate.predictions.create({
      version: process.env.REPLICATE_FLUX_VERSION || 'flux/lora:latest',
      input: {
        input_images: images,
        instance_prompt: `a photo of ${instanceName}`,
        num_train_epochs: numTrainingSteps,
        learning_rate: learningRate,
        resolution,
      },
      webhook: webhookUrl,
      webhook_events_filter: ["completed", "failed"],
    });

    return prediction;
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