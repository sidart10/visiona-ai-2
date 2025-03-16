/**
 * API utility functions for frontend components
 */
import { 
  UserProfile, 
  Model, 
  Photo, 
  Generation, 
  ApiResponse, 
  PaginatedResponse 
} from './types';

/**
 * Fetch user profile data
 * @returns User profile data or error
 */
export async function fetchUserProfile(): Promise<ApiResponse<UserProfile>> {
  try {
    const response = await fetch('/api/user/profile');
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Fetch user models
 * @param options Optional pagination parameters
 * @returns List of user models or error
 */
export async function fetchUserModels(options = { limit: 10, page: 1 }): Promise<PaginatedResponse<Model>> {
  try {
    const { limit, page } = options;
    const response = await fetch(`/api/models?limit=${limit}&page=${page}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user models');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user models:', error);
    throw error;
  }
}

/**
 * Fetch user photos
 * @param options Optional pagination parameters
 * @returns List of user photos or error
 */
export async function fetchUserPhotos(options = { limit: 10, page: 1 }): Promise<PaginatedResponse<Photo>> {
  try {
    const { limit, page } = options;
    const response = await fetch(`/api/photos?limit=${limit}&page=${page}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user photos');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user photos:', error);
    throw error;
  }
}

/**
 * Upload photos to the server
 * @param files Array of File objects to upload
 * @returns Result of the upload operation
 */
export async function uploadPhotos(files: File[]): Promise<ApiResponse<{ photoUrls: string[] }>> {
  try {
    const formData = new FormData();
    
    // Append each file to the form data
    files.forEach((file, index) => {
      formData.append(`photo${index}`, file);
    });
    
    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload photos');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error uploading photos:', error);
    throw error;
  }
}

/**
 * Start model training
 * @param trainingData Training data including photos and parameters
 * @returns Result of the training request
 */
export async function trainModel(trainingData: {
  photos: string[];
  triggerWord: string;
  trainingSteps?: number;
  loraRank?: number;
  optimizer?: string;
  learningRate?: number;
  resolution?: string;
  batchSize?: number;
}): Promise<ApiResponse<Model>> {
  try {
    const response = await fetch('/api/models/train', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trainingData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to start model training');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error starting model training:', error);
    throw error;
  }
}

/**
 * Generate images
 * @param generationData Data for image generation including prompt and model
 * @returns Result of the generation request
 */
export async function generateImages(generationData: {
  prompt: string;
  modelId: string;
  negativePrompt?: string;
  count?: number;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
}): Promise<ApiResponse<{ generations: Generation[] }>> {
  try {
    const response = await fetch('/api/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generationData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate images');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error generating images:', error);
    throw error;
  }
}

/**
 * Fetch user generations
 * @param options Optional pagination and filter parameters
 * @returns List of user generations or error
 */
export async function fetchUserGenerations(options = { limit: 20, page: 1, modelId: undefined as string | undefined }): Promise<PaginatedResponse<Generation>> {
  try {
    const { limit, page, modelId } = options;
    let url = `/api/generations?limit=${limit}&page=${page}`;
    
    if (modelId) {
      url += `&modelId=${modelId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user generations');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user generations:', error);
    throw error;
  }
} 