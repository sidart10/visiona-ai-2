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
    console.log('🔄 Fetching user models with options:', options);
    
    const response = await fetch(`/api/models`);
    console.log('📥 Models API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error fetching models:', errorData);
      throw new Error(errorData.error || 'Failed to fetch user models');
    }
    
    const responseData = await response.json();
    console.log('✅ Models API successful response:', {
      success: responseData.success,
      hasModels: !!responseData.models,
      modelCount: responseData.models?.length || 0,
    });
    
    return responseData;
  } catch (error) {
    console.error('❌ Exception in fetchUserModels:', error);
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
    
    if (files.length === 0) {
      throw new Error('No files provided for upload');
    }
    
    // Process each file - we'll upload just the first file and return its result
    // This function is called for each file individually from the handleAddPhotos function
    const formData = new FormData();
    
    // Append the file to the form data
    formData.append('file', files[0]);
    console.log(`Preparing to upload file: ${files[0].name}`);
    
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
 * Determines if a model is considered active based on its status
 */
export function isModelActive(status: string | undefined): boolean {
  // Add detailed logging
  console.log('📊 Checking if model is active:', { status });
  
  if (!status) {
    console.log('⚠️ No status provided, returning false');
    return false;
  }
  
  // Convert to lowercase for case-insensitive comparison
  const statusLower = status.toLowerCase();
  
  // Consider all non-error statuses as potentially active
  // Only explicitly exclude statuses that indicate the model isn't ready
  const isNotActive = [
    'failed',
    'error',
    'cancelled',
    'canceled'
  ].includes(statusLower);
  
  // If it's explicitly not active, return false
  if (isNotActive) {
    console.log(`🔍 Model with status "${status}" is not active`);
    return false;
  }
  
  // For all other statuses (including 'completed', 'ready', 'processing', etc.)
  // consider the model as potentially active
  console.log(`🔍 Model with status "${status}" is considered active`);
  return true;
}

/**
 * Helper function to format models for UI display
 * @param models Array of model objects from the API
 * @returns Array of formatted UserModel objects for the UI
 */
export function formatModelsForUI(models: Model[]): UserModel[] {
  console.log('🔍 Formatting models for UI, received:', models?.length || 0, 'models');
  
  // Sort models to show completed models first
  const sortedModels = [...models].sort((a, b) => {
    // First by status (completed first)
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (a.status !== 'completed' && b.status === 'completed') return 1;
    
    // Then by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  console.log('🔄 Models sorted by status and date');
  
  const formattedModels = sortedModels.map(model => {
    const active = isModelActive(model.status);
    console.log(`📝 Formatting model: ${model.name || model.id}`, { 
      id: model.id,
      status: model.status,
      isActive: active,
      triggerWord: model.trigger_word || ""
    });
    
    return {
      id: model.id,
      name: model.name || model.trigger_word || "Untitled Model",
      triggerWord: model.trigger_word || "",
      status: model.status,
      progress: model.progress || 0,
      createdAt: new Date(model.created_at).toLocaleDateString(),
      isActive: active,
      thumbnailUrl: "/placeholder.svg?height=150&width=150"
    };
  });
  
  console.log('✅ Models formatted:', formattedModels.length);
  return formattedModels;
}

/**
 * Debug photo access issues
 * @param photoIds Array of photo IDs to check access for
 * @param options Options for debugging photo access, including a fix option
 * @returns Debug information about photo access
 */
export async function debugPhotoAccess(photoIds: string[], options = { fix: false }): Promise<ApiResponse<any>> {
  try {
    const { fix } = options;
    console.log(`Debugging photo access for ${photoIds.length} photos, fix=${fix}`);
    
    const response = await fetch('/api/debug/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoIds, fix }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to debug photo access');
    }
    
    const result = await response.json();
    console.log('Debug result:', result);
    
    // If we fixed any photos, display a notification
    if (fix && result.fix_result?.success) {
      console.log(`Fixed ownership for ${result.fix_result.count} photos`);
    }
    
    return { success: true, ...result };
  } catch (error) {
    console.error('Error in debugPhotoAccess:', error);
    return { success: false, ...handleApiError(error) };
  }
} 