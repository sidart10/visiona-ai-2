/**
 * Shared type definitions for the application
 */

// User model interface
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  created_at: string;
  subscription: {
    status: string;
  };
  stats: {
    photos: number;
    models: number;
    generations: number;
  };
  quotas: {
    models: {
      total: number;
      used: number;
      remaining: number;
    };
    generations: {
      total: number;
      used: number;
      remaining: number;
    };
  };
}

// Model interface
export interface Model {
  id: string;
  name: string;
  trigger_word?: string;
  status: string;
  progress?: number;
  created_at: string;
  user_id: string;
  version_id?: string;
}

// Photo interface
export interface Photo {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
  created_at: string;
  user_id: string;
}

// Generation interface
export interface Generation {
  id: string;
  prompt: string;
  negative_prompt?: string;
  image_url: string;
  width: number;
  height: number;
  steps: number;
  guidance_scale: number;
  seed: number;
  created_at: string;
  user_id: string;
  model_id: string;
}

// UI Custom Style interface
export interface CustomStyle {
  id: string;
  name: string;
  prompt: string;
  aspectRatio: string;
  isDefault?: boolean;
}

// Frontend UserModel interface
export interface UserModel {
  id: string | number;
  name: string;
  triggerWord?: string;
  status?: string;
  progress?: number | null;
  createdAt: string;
  isActive?: boolean;
  thumbnailUrl?: string;
}

// Frontend UserImage interface
export interface UserImage {
  id: string | number;
  thumbnail: string;
  prompt: string;
  createdAt: string;
}

// Photo fix result interface
export interface PhotoFixResult {
  success: boolean;
  count?: number;
  fixed_ids?: string[];
  error?: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  
  // For specific response types
  profile?: UserProfile;
  models?: T[];
  photos?: T[];
  generations?: T[];
  photo?: {
    id: string;
    url: string;
    storage_path: string;
    filename: string;
  };
  model?: Model;
  
  // For debug endpoints
  fix_result?: PhotoFixResult;
  user_id?: string;
  found_photos?: number;
  total_requested?: number;
  owned_by_others?: number;
  other_user_ids?: string[];
  non_existent_photos?: string[];
  user_photos?: any[];
  other_user_photos?: any[];
}

export interface PaginatedResponse<T> {
  success?: boolean;
  data?: T[];
  models?: T[]; // For model responses
  generations?: T[]; // For generation responses
  photos?: T[]; // For photo responses
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 