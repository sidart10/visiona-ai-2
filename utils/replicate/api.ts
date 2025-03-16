/**
 * Utility functions for interacting with the Replicate API
 */

/**
 * Start a model training job on Replicate
 * @param zipUrl URL of the ZIP file containing training images
 * @param triggerWord The trigger word to use for the model
 * @returns Object with training information or error
 */
export async function startModelTraining(
  zipUrl: string,
  triggerWord: string
) {
  try {
    // Ensure we have the API token
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set");
    }

    // Define the training parameters
    const trainingParams = {
      input: {
        instance_prompt: `a photo of ${triggerWord} person`,
        class_prompt: "a photo of a person",
        instance_data: zipUrl,
        max_train_steps: 2000,
        learning_rate: 1e-6,
        lr_scheduler: "constant",
        lr_warmup_steps: 0
      }
    };

    // Call the Replicate API to start training
    const response = await fetch("https://api.replicate.com/v1/trainings", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // This would be the actual model to use for training
        // For example: "stability-ai/sdxl-lora"
        model: "stability-ai/sdxl-lora",
        input: trainingParams.input
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      model: data.model,
      version: data.version
    };
  } catch (error) {
    console.error("Error starting model training:", error);
    return { error: String(error) };
  }
}

/**
 * Check the status of a training job on Replicate
 * @param trainingId The ID of the training job
 * @returns Object with training status or error
 */
export async function checkTrainingStatus(trainingId: string) {
  try {
    // Ensure we have the API token
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set");
    }

    // Call the Replicate API to check training status
    const response = await fetch(`https://api.replicate.com/v1/trainings/${trainingId}`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      model: data.model,
      version: data.version,
      output: data.output
    };
  } catch (error) {
    console.error("Error checking training status:", error);
    return { error: String(error) };
  }
}

/**
 * Generate an image using a trained model on Replicate
 * @param modelVersion The version ID of the trained model
 * @param prompt The prompt to use for generation
 * @param options Additional generation options
 * @returns Object with generation result or error
 */
export async function generateImage(
  modelVersion: string,
  prompt: string,
  options: {
    negativePrompt?: string;
    width?: number;
    height?: number;
    numInferenceSteps?: number;
    guidanceScale?: number;
  } = {}
) {
  try {
    // Ensure we have the API token
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set");
    }

    // Set default options
    const {
      negativePrompt = "",
      width = 512,
      height = 512,
      numInferenceSteps = 30,
      guidanceScale = 7.5
    } = options;

    // Call the Replicate API to generate an image
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          prompt,
          negative_prompt: negativePrompt,
          width,
          height,
          num_inference_steps: numInferenceSteps,
          guidance_scale: guidanceScale
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      output: data.output
    };
  } catch (error) {
    console.error("Error generating image:", error);
    return { error: String(error) };
  }
}

/**
 * Check the status of a prediction (image generation) on Replicate
 * @param predictionId The ID of the prediction
 * @returns Object with prediction status or error
 */
export async function checkPredictionStatus(predictionId: string) {
  try {
    // Ensure we have the API token
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set");
    }

    // Call the Replicate API to check prediction status
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      output: data.output
    };
  } catch (error) {
    console.error("Error checking prediction status:", error);
    return { error: String(error) };
  }
} 