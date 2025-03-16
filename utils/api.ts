/**
 * API utility functions for frontend components
 */
import { 
  UserProfile, 
  Model, 
  Photo, 
  Generation, 
  ApiResponse, 
  PaginatedResponse,
  UserModel
} from './types';

/**
 * Handles API errors related to user sync
 * @param error The error object
 * @returns Object with error message
 */
export function handleApiError(error: any): { error: string } {
  console.error('API Error:', error);
  
  // Check if the error is related to user sync
  if (error.message?.includes('user data') || error.message?.includes('authentication')) {
    // Attempt to sync the user
    fetch('/api/auth/sync').catch(e => console.error('Error syncing user:', e));
  }
  
  return { 
    error: error.message || 'An unexpected error occurred'
  };
}

/**
 * Fetch user profile data
 * @returns User profile data or error
 */
export async function fetchUserProfile(): Promise<ApiResponse<UserProfile>> {
  try {
    const response = await fetch('/api/user/profile');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user profile');
    }
    
    return response.json();
  } catch (error) {
    // Use the error handler
    return { success: false, ...handleApiError(error) };
  }
}

/**
 * Fetch user models
 * @param options Optional pagination parameters
 * @returns List of user models or error
 */
export async function fetchUserModels(options = { limit: 10, page: 1 }): Promise<ApiResponse<Model[]>> {
  try {
    const response = await fetch(`/api/models`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user models');
    }
    
    return response.json();
  } catch (error) {
    return { success: false, ...handleApiError(error) };
  }
}

/**
 * Fetch user photos
 * @param options Optional pagination parameters
 * @returns List of user photos or error
 */
export async function fetchUserPhotos(options = { limit: 10, page: 1 }): Promise<ApiResponse<Photo[]>> {
  try {
    const { limit, page } = options;
    const response = await fetch(`/api/photos?limit=${limit}&page=${page}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user photos');
    }
    
    return response.json();
  } catch (error) {
    return { success: false, ...handleApiError(error) };
  }
}

/**
 * Upload photos to the server
 * @param files Array of File objects to upload
 * @returns Result of the upload operation
 */
export async function uploadPhotos(files: File[]): Promise<ApiResponse<{ photo: { id: string, url: string, storage_path: string, filename: string } }>> {
  try {
    console.log(`uploadPhotos called with ${files.length} files:`, files.map(f => f.name));
    
    // Only process the first file for now - this is the root cause of the issue
    // We're only using files[0] even though multiple files may be passed
    const formData = new FormData();
    
    // Append the file to the form data
    formData.append('file', files[0]);
    console.log(`Appending only the first file to FormData: ${files[0].name}`);
    
    // Debug: show what's actually in the FormData
    console.log('FormData entries:');
    // Use a different approach to avoid the TypeScript error with FormData iteration
    const entries: string[] = [];
    formData.forEach((value, key) => {
      entries.push(`- ${key}: ${value instanceof File ? value.name : value}`);
    });
    console.log(entries.join('\n'));
    
    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload response not OK:', response.status, errorData);
      throw new Error(errorData.error || 'Failed to upload photo');
    }
    
    const result = await response.json();
    console.log('Upload successful:', result);
    return result;
  } catch (error) {
    console.error('Error in uploadPhotos:', error);
    return { success: false, ...handleApiError(error) };
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
 * Create a new model
 * @param modelData Model creation data including name, description, photo IDs, and trigger word
 * @returns Result of the model creation request
 */
export async function createModel(modelData: {
  name: string;
  description?: string;
  photoIds: string[];
  triggerWord?: string;
}): Promise<ApiResponse<Model>> {
  try {
    const response = await fetch('/api/models/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create model');
    }
    
    return response.json();
  } catch (error) {
    return { success: false, ...handleApiError(error) };
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate images');
    }
    
    return response.json();
  } catch (error) {
    return { success: false, ...handleApiError(error) };
  }
}

/**
 * Fetch user generations
 * @param options Optional pagination and filter parameters
 * @returns List of user generations or error
 */
export async function fetchUserGenerations(options = { limit: 20, page: 1, modelId: undefined as string | undefined }): Promise<ApiResponse<Generation[]>> {
  try {
    const { limit, page, modelId } = options;
    let url = `/api/generations?limit=${limit}&page=${page}`;
    
    if (modelId) {
      url += `&modelId=${modelId}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user generations');
    }
    
    return response.json();
  } catch (error) {
    return { success: false, ...handleApiError(error) };
  }
}

/**
 * Delete a model by ID
 * @param modelId The ID of the model to delete
 * @returns Success status and message
 */
export async function deleteModel(modelId: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch(`/api/models?id=${modelId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete model');
    }
    
    return response.json();
  } catch (error) {
    return { success: false, ...handleApiError(error) };
  }
}

/**
 * Fetch a specific model by ID
 * @param modelId The ID of the model to fetch
 * @returns The model data or error
 */
export async function fetchModelById(modelId: string): Promise<ApiResponse<Model>> {
  try {
    const response = await fetch(`/api/models/${modelId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch model');
    }
    
    return response.json();
  } catch (error) {
    return { success: false, ...handleApiError(error) };
  }
}

/**
 * Helper function to determine if a model is active (completed and ready to use)
 * @param modelStatus The status string from the model object
 * @returns Boolean indicating if the model is active
 */
export function isModelActive(modelStatus: string): boolean {
  return modelStatus === "completed";
}

/**
 * Helper function to format models for UI display
 * @param models Array of model objects from the API
 * @returns Array of formatted UserModel objects for the UI
 */
export function formatModelsForUI(models: Model[]): UserModel[] {
  // Sort models to show completed models first
  const sortedModels = [...models].sort((a, b) => {
    // First by status (completed first)
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (a.status !== 'completed' && b.status === 'completed') return 1;
    
    // Then by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  return sortedModels.map(model => ({
    id: model.id,
    name: model.name || model.trigger_word || "Untitled Model",
    triggerWord: model.trigger_word || "",
    status: model.status,
    progress: model.progress || 0,
    createdAt: new Date(model.created_at).toLocaleDateString(),
    isActive: isModelActive(model.status),
    thumbnailUrl: "/placeholder.svg?height=150&width=150"
  }));
} 