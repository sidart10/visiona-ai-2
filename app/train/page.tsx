"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Home,
  Cpu,
  ImageIcon,
  Grid,
  Upload,
  X,
  AlertTriangle,
  HelpCircle,
  Camera,
  CheckCircle,
  Hourglass,
  RefreshCw,
  Loader,
  Plus,
  LogOut,
} from "lucide-react"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Info, ChevronDown } from "lucide-react"
import { uploadPhotos, createModel, fetchUserProfile, fetchUserModels, deleteModel, formatModelsForUI, debugPhotoAccess } from "@/utils/api"
import { toast } from "react-toastify"

// Badge Component
type BadgeProps = {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const variantStyles = {
    default: "bg-gray-700 text-gray-200",
    success: "bg-green-500/20 text-green-500",
    warning: "bg-yellow-500/20 text-yellow-500",
    danger: "bg-red-500/20 text-red-500",
    info: "bg-[#1eb8cd]/20 text-[#1eb8cd]",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// Avatar Component
type AvatarProps = {
  src?: string
  alt?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = "User avatar", size = "md", className = "" }) => {
  const sizeStyles = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }

  const fallback = !src ? (
    <div
      className={`${sizeStyles[size]} rounded-full flex items-center justify-center bg-gradient-to-br from-[#1eb8cd] to-purple-500 text-white font-bold ${className}`}
    >
      {alt.slice(0, 2).toUpperCase()}
    </div>
  ) : null

  return (
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      className={`${sizeStyles[size]} rounded-full object-cover ${className}`}
    />
  )
}

// Photo Upload Area Component
type PhotoUploadAreaProps = {
  photos: File[]
  onAddPhotos: (files: File[]) => void
  onRemovePhoto: (index: number) => void
  className?: string
}

const PhotoUploadArea: React.FC<PhotoUploadAreaProps> = ({ photos, onAddPhotos, onRemovePhoto, className = "" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
    console.log("Drag over event triggered - added highlight border")
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    console.log("Drag leave event triggered - removed highlight border")
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    console.log("Drop event triggered - removed highlight border")

    if (e.dataTransfer.files) {
      const fileList = e.dataTransfer.files
      console.log("Files dropped:", fileList.length, "files")
      console.log("File types:", Array.from(fileList).map(f => f.type).join(', '))
      const filesArray = Array.from(fileList)
      const imageFiles = filesArray.filter((file) => file.type.startsWith("image/"))
      console.log("Image files filtered:", imageFiles.length, "images")
      if (imageFiles.length === 0) {
        console.warn("No valid image files were found among the dropped files")
      }
      onAddPhotos(imageFiles)
    } else {
      console.warn("No files detected in drop event")
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change event triggered");
    if (e.target.files) {
      const fileList = e.target.files;
      console.log(`File input has ${fileList.length} files selected`);
      
      // Log each file that was selected
      for (let i = 0; i < fileList.length; i++) {
        console.log(`Selected file ${i+1}/${fileList.length}: ${fileList[i].name} (${fileList[i].type}, ${Math.round(fileList[i].size/1024)}KB)`);
      }
      
      const filesArray = Array.from(fileList);
      console.log(`Converted FileList to array with ${filesArray.length} items`);
      
      onAddPhotos(filesArray);
    } else {
      console.warn("No files detected in file input");
    }
  }

  const triggerFileInput = () => {
    console.log("Attempting to trigger file input click")
    if (fileInputRef.current) {
      console.log("File input reference exists, triggering click")
      fileInputRef.current.click()
    } else {
      console.warn("File input reference is null, cannot trigger click")
    }
  }

  return (
    <div className={`${className}`}>
      {/* Drop Area */}
      <div
        className={`border-2 border-dashed ${dragActive ? 'border-[#1eb8cd] bg-[#1eb8cd]/5' : 'border-gray-700 bg-gray-900/20'} rounded-lg p-6 text-center hover:border-[#1eb8cd] transition-colors cursor-pointer`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
        />
        <div className="flex flex-col items-center">
          <Upload size={36} className="text-gray-400 mb-3" />
          <h3 className="text-white font-medium mb-1">Drop photos here</h3>
          <p className="text-gray-400 text-sm mb-3">Upload 10-20 clear photos or drag and drop them here</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10"
            onClick={(e) => {
              e.stopPropagation(); // Prevent the outer div's onClick from firing
              triggerFileInput();
            }}
          >
            <Camera className="mr-2 h-4 w-4" />
            Browse Files
          </Button>
        </div>
      </div>

      {/* Photos Preview */}
      {photos.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-medium">Uploaded Photos ({photos.length})</h3>
            <span className="text-sm text-gray-400">
              {photos.length < 10 ? `${10 - photos.length} more required` : "Minimum requirement met"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((photo, index) => {
              return (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md border border-gray-800"
                  />
                  <button
                    className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemovePhoto(index)
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Step Indicator Component
type StepIndicatorProps = {
  steps: string[]
  currentStep: number
  className?: string
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  index < currentStep
                    ? "bg-[#1eb8cd] text-white"
                    : index === currentStep
                      ? "bg-[#1eb8cd]/20 text-[#1eb8cd] border border-[#1eb8cd]"
                      : "bg-gray-800 text-gray-400"
                }`}
              >
                {index < currentStep ? <CheckCircle size={16} /> : <span>{index + 1}</span>}
              </div>
              <span className={`text-xs mt-1 ${index <= currentStep ? "text-white" : "text-gray-400"}`}>{step}</span>
            </div>

            {/* Connector Line (except after last step) */}
            {index < steps.length - 1 && (
              <div className={`flex-grow h-px ${index < currentStep ? "bg-[#1eb8cd]" : "bg-gray-800"}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// Training Status Component
const TrainingStatus: React.FC<{
  status: string
  progress: number
}> = ({ status, progress }) => {
  // Define all possible statuses in order
  const statuses = ["queued", "preparing", "training", "finalizing", "completed", "failed"];
  const currentStatusIndex = statuses.indexOf(status);
  
  // Calculate estimated time remaining based on progress and status
  const getTimeRemaining = () => {
    if (status === "completed" || status === "failed") {
      return null;
    }
    
    let totalTimeSeconds = 0;
    
    // Estimate based on which stage we're in and progress
    switch (status) {
      case "queued":
        return "Starting soon...";
      case "preparing":
        totalTimeSeconds = 5 * (100 - progress) / 100;
        break;
      case "training":
        totalTimeSeconds = 20 * (100 - progress) / 100;
        break;
      case "finalizing":
        totalTimeSeconds = 5 * (100 - progress) / 100;
        break;
    }
    
    // Format the time
    if (totalTimeSeconds < 60) {
      return `About ${Math.ceil(totalTimeSeconds)} seconds remaining`;
    } else {
      return `About ${Math.ceil(totalTimeSeconds / 60)} minutes remaining`;
    }
  };
  
  // Get status-specific message
  const getStatusMessage = () => {
    switch (status) {
      case "queued":
        return "Your model is in the queue and will start processing soon.";
      case "preparing":
        return "Preparing your photos for training...";
      case "training":
        return "Training your custom model. This may take a few minutes.";
      case "finalizing":
        return "Finalizing your model and preparing it for use.";
      case "completed":
        return "Your model is ready to use! You can now generate images with it.";
      case "failed":
        return "Training failed. Please try again or contact support.";
      default:
        return "";
    }
  };

  return (
    <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-medium">Training Status</h3>
        <Badge
          variant={
            status === "completed"
              ? "success"
              : status === "failed"
              ? "danger"
              : status === "queued"
              ? "warning"
              : "info"
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2 mb-4" />
      
      {/* Status timeline */}
      <div className="flex justify-between mb-4 mt-6">
        {statuses.slice(0, 5).map((s, index) => (
          <div key={s} className="flex flex-col items-center">
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                ${index < currentStatusIndex ? "bg-green-500 text-white" : 
                  index === currentStatusIndex ? 
                    (status === "failed" ? "bg-red-500 text-white" : "bg-[#1eb8cd] text-white") : 
                    "bg-gray-800 text-gray-500"}`}
            >
              {index < currentStatusIndex ? (
                <CheckCircle size={12} />
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-xs mt-1 
              ${index < currentStatusIndex ? "text-green-500" : 
                index === currentStatusIndex ? 
                  (status === "failed" ? "text-red-500" : "text-[#1eb8cd]") : 
                  "text-gray-500"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Status message */}
      <p className="text-sm text-gray-400 mb-2">{getStatusMessage()}</p>
      
      {/* Time remaining */}
      {getTimeRemaining() && (
        <p className="text-xs text-gray-500">{getTimeRemaining()}</p>
      )}

      {status === "failed" && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-400">
            Training failed. This could be due to issues with the uploaded photos or a temporary service interruption.
            Please try again or contact support if the problem persists.
          </p>
        </div>
      )}

      {status === "completed" && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <p className="text-sm text-green-400">
            Your model is ready to use! You can now start generating images with your custom AI model.
          </p>
        </div>
      )}
    </div>
  )
}

// Model Card Component
type ModelCardProps = {
  id: string
  name: string
  triggerWord: string
  createdAt: string
  isActive?: boolean
  thumbnailUrl?: string
  onSelect: () => void
  onDelete: () => void
  className?: string
}

const ModelCard: React.FC<ModelCardProps> = ({
  id,
  name,
  triggerWord,
  createdAt,
  isActive = false,
  thumbnailUrl,
  onSelect,
  onDelete,
  className = "",
}) => {
  return (
    <Card
      className={`bg-black border ${isActive ? "border-[#1eb8cd]" : "border-gray-800/50"} hover:border-gray-700 transition-all ${className}`}
    >
      <div className="relative h-32 bg-gray-900 group">
        {thumbnailUrl ? (
          <img src={thumbnailUrl || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={24} className="text-gray-600" />
          </div>
        )}
        {isActive && (
          <Badge variant="success" className="absolute top-2 left-2">
            Active
          </Badge>
        )}
        
        {/* Delete button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Confirm before deleting
            if (window.confirm(`Are you sure you want to delete model "${name}"?`)) {
              onDelete();
            }
          }}
          className="absolute top-2 right-2 bg-black/70 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
          title="Delete model"
        >
          <X size={16} />
        </button>
      </div>

      <CardContent className="p-4 cursor-pointer" onClick={onSelect}>
        <h3 className="text-white font-medium mb-1 truncate">{name}</h3>
        <p className="text-gray-400 text-xs mb-4">Created {createdAt}</p>
      </CardContent>
    </Card>
  )
}

// Main Training Page Component
export default function TrainPage() {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  // Constants
  const MIN_PHOTOS = 5
  const MAX_PHOTOS = 20
  
  // User data and quota state
  const [dataLoading, setDataLoading] = useState(false)
  const [userQuota, setUserQuota] = useState({
    models: {
      total: 0,
      remaining: 0
    }
  })
  
  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    avatarUrl: "",
    plan: "free",
    modelsCreated: 0,
    modelsLimit: 5,
  })
  
  // Photo upload state
  const [uploadStates, setUploadStates] = useState<Array<{
    file: File,
    status: 'uploading' | 'completed' | 'error',
    progress?: number,
    error?: string
  }>>([])
  
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{
    id: string,
    url: string,
    filename: string,
    storagePath: string
  }>>([])
  
  // Model data state
  const [modelName, setModelName] = useState("")
  const [modelDescription, setModelDescription] = useState("")
  const [triggerWord, setTriggerWord] = useState("")
  const [userModels, setUserModels] = useState<any[]>([])
  const [existingModels, setExistingModels] = useState<any[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Current step
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ["Upload Photos", "Enter Details", "Train Model"]

  // Navigation state
  const [activeNav, setActiveNav] = useState("train-model")

  // Profile dropdown state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // Training state
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatusProps["status"]>("queued")
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [modelCreationStatus, setModelCreationStatus] = useState<"idle" | "creating" | "success" | "error">("idle")

  // Advanced settings
  const [loraRank, setLoraRank] = useState(32)
  const [trainingSteps, setTrainingSteps] = useState(1000)
  const [optimizer, setOptimizer] = useState("AdamW8bit")
  const [learningRate, setLearningRate] = useState(1e-4)
  const [resolution, setResolution] = useState("512x512")
  const [batchSize, setBatchSize] = useState(1)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  // View state
  const [activeTab, setActiveTab] = useState("create")
  const [isLoading, setIsLoading] = useState(true)

  // Step progression checks
  const canProceedToStep2 = uploadedPhotos.length >= MIN_PHOTOS
  const canProceedToStep3 = triggerWord.length > 0

  // Load user data function
  async function loadUserData() {
    try {
      setDataLoading(true)
      setIsLoading(true)
      const response = await fetchUserProfile()
      
      if (!response.success) {
        toast.error(response.error || "Failed to load profile")
        return
      }
      
      setUserQuota({
        models: {
          total: response.profile?.quotas.models.total || 0,
          remaining: response.profile?.quotas.models.remaining || 0
        }
      })
      
      // Update user profile
      setUserProfile({
        name: user?.firstName || user?.username || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || "User",
        email: user?.emailAddresses[0]?.emailAddress || "",
        avatarUrl: user?.imageUrl || "",
        plan: response.profile?.subscription?.status || "free",
        modelsCreated: response.profile?.stats?.models || 0,
        modelsLimit: response.profile?.quotas?.models?.total || 5,
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to load user profile")
    } finally {
      setDataLoading(false)
      setIsLoading(false)
    }
  }

  // Load user models function
  async function loadUserModels() {
    try {
      setModelsLoading(true)
      const response = await fetchUserModels()
      
      if (!response.success) {
        toast.error(response.error || "Failed to load models")
        return
      }
      
      setUserModels(response.models || [])
      
      // Format models for the UI
      if (response.models && response.models.length > 0) {
        // Use the helper function to format models consistently
        // Cast the response.models to any to avoid TypeScript errors
        const formattedModels = formatModelsForUI(response.models as any);
        setExistingModels(formattedModels);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load models")
    } finally {
      setModelsLoading(false)
    }
  }

  // Load user data on component mount
  useEffect(() => {
    if (isUserLoaded && user) {
      loadUserData()
      loadUserModels()
    }
  }, [isUserLoaded, user])

  // Redirect if not logged in
  useEffect(() => {
    if (isUserLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isUserLoaded, user, router])

  // Handle sign out
  const handleSignOut = async () => {
    await signOut(() => router.push("/"))
  }

  // Handle photo uploads
  const handleAddPhotos = async (files: File[]) => {
    console.log(`handleAddPhotos called with ${files.length} files:`, files.map(f => f.name));
    if (!files.length) return;
    
    // Capture current state for logging
    const startingPhotoCount = uploadedPhotos.length;
    console.log(`Starting photo count: ${startingPhotoCount}/${MAX_PHOTOS}`);
    
    // Update UI immediately with loading state
    const newUploadStates = [...uploadStates];
    files.forEach((file, index) => {
      if (uploadedPhotos.length + index < MAX_PHOTOS) {
        newUploadStates.push({ file, status: "uploading", progress: 0 });
      } else {
        console.log(`Skipping file ${index+1} (${file.name}) - would exceed max photos limit of ${MAX_PHOTOS}`);
      }
    });
    setUploadStates(newUploadStates);
    console.log(`Updated upload states with ${newUploadStates.length - uploadStates.length} new items`);
    
    // Process each file one at a time
    for (let i = 0; i < files.length; i++) {
      if (uploadedPhotos.length + i >= MAX_PHOTOS) {
        console.log(`Reached maximum photo limit of ${MAX_PHOTOS}, stopping upload at file ${i+1}/${files.length}`);
        break;
      }
      
      const file = files[i];
      console.log(`Processing file ${i+1}/${files.length}: ${file.name} (${Math.round(file.size/1024)}KB)`);
      const stateIndex = uploadStates.length + i;
      
      try {
        // Upload individual file
        console.log(`Calling uploadPhotos API for file: ${file.name}`);
        const uploadResponse = await uploadPhotos([file]);
        console.log(`Upload response for ${file.name}:`, uploadResponse);
        
        if (!uploadResponse.success) {
          // Update upload state to show error
          const updatedStates = [...uploadStates];
          updatedStates[stateIndex] = { ...updatedStates[stateIndex], status: "error", error: uploadResponse.error };
          setUploadStates(updatedStates);
          toast.error(`Failed to upload ${file.name}: ${uploadResponse.error}`);
          console.error(`Upload failed for ${file.name}:`, uploadResponse.error);
          continue;
        }
        
        // Update upload state to show success
        const updatedStates = [...uploadStates];
        updatedStates[stateIndex] = { ...updatedStates[stateIndex], status: "completed" };
        setUploadStates(updatedStates);
        
        // Add to uploaded photos array
        const newUploadedPhoto = {
          id: uploadResponse.photo!.id,
          url: uploadResponse.photo!.url,
          filename: uploadResponse.photo!.filename,
          storagePath: uploadResponse.photo!.storage_path
        };
        console.log(`Adding new photo to state: ${newUploadedPhoto.filename} (id: ${newUploadedPhoto.id})`);
        
        // Important: Get the latest state when updating
        setUploadedPhotos(prevPhotos => {
          const newPhotos = [...prevPhotos, newUploadedPhoto];
          console.log(`Updated photos array, now has ${newPhotos.length} items`);
          return newPhotos;
        });
        
      } catch (error: any) {
        // Update upload state to show error
        const updatedStates = [...uploadStates];
        updatedStates[stateIndex] = { ...updatedStates[stateIndex], status: "error", error: error.message };
        setUploadStates(updatedStates);
        
        console.error(`Exception during upload of ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    
    console.log(`Completed handling ${files.length} files. Started with ${startingPhotoCount}, now have ${uploadedPhotos.length} photos`);
  };
  
  // Update the handleRemovePhoto function to also remove from server if needed
  const handleRemovePhoto = (index: number) => {
    console.log(`Removing photo at index ${index}`, uploadedPhotos[index]);
    // For now, just remove from local state
    setUploadedPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index))
    console.log("Photo removed, updated count:", uploadedPhotos.length - 1);
    
    // In a real implementation, you might want to also remove from the server
    // if the photo was already uploaded
  }

  // Navigate through steps
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Start training function
  async function startTraining() {
    if (uploadedPhotos.length < MIN_PHOTOS) {
      toast.error(`Please upload at least ${MIN_PHOTOS} photos`)
      return
    }

    if (!triggerWord) {
      toast.error("Please enter a trigger word")
      return
    }

    setIsSubmitting(true)
    setTrainingProgress(0)
    setTrainingStatus("queued")

    try {
      // Create a new model
      const photoIds = uploadedPhotos.map((photo) => photo.id)
      console.log("Starting model training with photoIds:", photoIds)
      
      const modelResponse = await createModel({
        name: modelName || triggerWord,
        triggerWord: triggerWord,
        photoIds: photoIds,
      })

      if (!modelResponse.success) {
        // If there's a photo access error, debug it
        if (modelResponse.error?.includes("photos do not exist") || 
            modelResponse.error?.includes("don't belong to you")) {
          console.log("Photo access error detected, running debug...")
          const debugResult = await debugPhotoAccess(photoIds)
          console.log("Photo access debug result:", debugResult)
        }
        
        throw new Error(modelResponse.error || "Failed to create model")
      }

      const newModel = modelResponse.model

      // Add the new model to our state
      if (newModel) {
        // Show a success message
        toast.success("Model created successfully! Training has started.")

        // Update the training status
        // Simulate the training process with status updates
        setTrainingStatus("queued")
        
        // Queued for 2 seconds
        setTimeout(() => {
          setTrainingStatus("preparing")
          
          // Preparing takes about 5 seconds
          let prepProgress = 0
          const prepInterval = setInterval(() => {
            prepProgress += 20
            setTrainingProgress(prepProgress)
            
            if (prepProgress >= 100) {
              clearInterval(prepInterval)
              setTrainingStatus("training")
              
              // Training stage - takes about 20 seconds total
              let trainProgress = 0
              const trainInterval = setInterval(() => {
                trainProgress += 5
                setTrainingProgress(trainProgress)
                
                if (trainProgress >= 100) {
                  clearInterval(trainInterval)
                  setTrainingStatus("finalizing")
                  
                  // Finalizing stage - takes about 5 seconds
                  let finalizeProgress = 0
                  const finalizeInterval = setInterval(() => {
                    finalizeProgress += 20
                    setTrainingProgress(finalizeProgress)
                    
                    if (finalizeProgress >= 100) {
                      clearInterval(finalizeInterval)
                      setTrainingStatus("completed")
                      
                      // Refresh the user data to show the updated model
                      loadUserData()
                      loadUserModels()
                      
                      // Set form back to initial state
                      setIsSubmitting(false)
                      setUploadedPhotos([])
                      setModelName("")
                      setTriggerWord("")
                      setCurrentStep(0)
                    }
                  }, 1000)
                }
              }, 1000)
            }
          }, 1000)
        }, 2000)
      }
    } catch (error: any) {
      console.error("Training error:", error)
      toast.error(error.message || "Failed to start training")
      setIsSubmitting(false)
      setTrainingStatus("failed")
    }
  }

  // Reset training form
  const resetTrainingForm = () => {
    setUploadedPhotos([])
    setModelName("")
    setModelDescription("")
    setTriggerWord("")
    setCurrentStep(0)
    setTrainingStatus("queued")
    setTrainingProgress(0)
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
    { id: "train-model", label: "Train Model", icon: <Cpu size={20} />, href: "/train" },
    { id: "generate-images", label: "Generate Images", icon: <ImageIcon size={20} />, href: "/generate" },
    { id: "gallery", label: "Gallery", icon: <Grid size={20} />, href: "/gallery" },
  ]

  // Render thumbnails of uploaded photos
  const renderPhotoThumbnails = () => {
    return uploadedPhotos.map((photo, index) => (
      <div key={index} className="relative group">
        <img
          src={photo.url}
          alt={`Upload ${index + 1}`}
          className="w-full h-24 object-cover rounded-md border border-gray-800"
        />
        <button
          className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            handleRemovePhoto(index)
          }}
        >
          <X size={14} />
        </button>
      </div>
    ))
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-800/50">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-[#1eb8cd]">Visiona</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-md text-sm transition duration-200 ${
                activeNav === item.id
                  ? "bg-gray-800/50 text-[#1eb8cd]"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/20"
              }`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-800/50">
          <Link
            href="/account"
            className="flex items-center text-gray-400 hover:text-white hover:bg-gray-800/20 p-2 rounded-md transition-colors cursor-pointer"
          >
            <Avatar size="md" alt={userProfile.name} />
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{userProfile.name}</p>
              <Badge variant={userProfile.plan === "premium" ? "success" : "default"}>
                {userProfile.plan === "premium" ? "Premium" : "Free"}
              </Badge>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800/20 mt-2"
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-black border-b border-gray-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Train AI Model</h1>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center">
                <Badge variant="info" className="mr-2">
                  {userProfile.plan === "premium" ? "Premium" : "Free"}
                </Badge>
                <span className="text-sm text-gray-400">
                  {userProfile.plan === "premium" ? "Unlimited models" : `${existingModels.length}/5 models created`}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/20">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-5xl mx-auto">
          {/* Tabs */}
          <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-gray-800/20 border-b border-gray-800">
              <TabsTrigger
                value="create"
                className="data-[state=active]:text-[#1eb8cd] data-[state=active]:border-b-2 data-[state=active]:border-[#1eb8cd] data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                Create New Model
              </TabsTrigger>
              <TabsTrigger
                value="existing"
                className="data-[state=active]:text-[#1eb8cd] data-[state=active]:border-b-2 data-[state=active]:border-[#1eb8cd] data-[state=active]:shadow-none data-[state=active]:bg-transparent"
              >
                My Models ({existingModels.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              {/* Free Tier Limit Warning */}
              {userProfile.plan !== "premium" && existingModels.length >= 5 && (
                <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <AlertTriangle size={20} className="text-yellow-500 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-white font-medium mb-1">Model Limit Reached</h3>
                        <p className="text-sm text-gray-400 mb-3">
                          You've reached the limit of 5 models on the free plan. Upgrade to Premium for unlimited
                          models.
                        </p>
                        <Button className="bg-[#1eb8cd] hover:bg-[#19a3b6]" size="sm">
                          Upgrade to Premium
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step Indicator */}
              <StepIndicator steps={steps} currentStep={currentStep} className="mb-8" />

              {/* Step Content */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  {/* Step 1: Upload Photos */}
                  {currentStep === 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
                      <p className="text-gray-400 mb-6">
                        Upload 10-20 clear photos of yourself. For best results, include different angles, expressions,
                        and lighting conditions.
                      </p>

                      <PhotoUploadArea
                        photos={[]} 
                        onAddPhotos={handleAddPhotos}
                        onRemovePhoto={handleRemovePhoto}
                        className=""
                      />
                      
                      {/* Display uploaded photos */}
                      {uploadedPhotos.length > 0 && (
                        <div className="mt-6">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white font-medium">Uploaded Photos ({uploadedPhotos.length})</h3>
                            <span className="text-sm text-gray-400">
                              {uploadedPhotos.length < 10 ? `${10 - uploadedPhotos.length} more required` : "Minimum requirement met"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {renderPhotoThumbnails()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Model Details */}
                  {currentStep === 1 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Model Details</h2>
                      <p className="text-gray-400 mb-6">
                        Configure your AI model details and training parameters. These settings will determine how your
                        model learns from your photos.
                      </p>

                      <div className="space-y-6">
                        {/* Trigger Word */}
                        <div>
                          <div className="flex items-center">
                            <Label htmlFor="trigger-word" className="text-gray-300 mb-1">
                              Trigger Word <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative inline-block ml-1">
                              <Button variant="ghost" size="icon" className="h-4 w-4 text-gray-400 hover:text-gray-300">
                                <Info size={14} />
                              </Button>
                              <span className="sr-only">
                                The trigger word is used in prompts to activate your model
                              </span>
                            </div>
                          </div>
                          <Input
                            id="trigger-word"
                            placeholder="TOK"
                            value={triggerWord}
                            onChange={(e) => {
                              // Remove spaces from trigger word as they type
                              const value = e.target.value.replace(/\s+/g, "")
                              setTriggerWord(value)
                            }}
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Pick a unique word like "TOK" or something related to what you're training. You'll use this
                            word in prompts to activate your model.
                          </p>
                        </div>

                        {/* Training Parameters */}
                        <div className="mt-6">
                          <h3 className="text-sm font-medium text-white mb-3">Training Parameters</h3>

                          {/* Training Steps */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <Label htmlFor="training-steps" className="text-gray-300">
                                Training Steps
                              </Label>
                              <span className="text-sm text-white">{trainingSteps}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">100</span>
                              <Slider
                                id="training-steps"
                                value={[trainingSteps]}
                                onValueChange={(value) => setTrainingSteps(value[0])}
                                min={100}
                                max={4000}
                                step={100}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500">4000</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              More steps can improve quality but take longer. Recommended: 500-2000.
                            </p>
                          </div>

                          {/* LoRA Rank */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <Label htmlFor="lora-rank" className="text-gray-300">
                                LoRA Rank
                              </Label>
                              <span className="text-sm text-white">{loraRank}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">1</span>
                              <Slider
                                id="lora-rank"
                                value={[loraRank]}
                                onValueChange={(value) => setLoraRank(value[0])}
                                min={1}
                                max={128}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500">128</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              Higher ranks capture more detail but require more training. Default: 16
                            </p>
                          </div>
                        </div>

                        {/* Advanced Settings */}
                        <div className="border border-gray-800/50 rounded-lg overflow-hidden">
                          <Collapsible>
                            <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left bg-gray-900/50">
                              <h3 className="text-sm font-medium text-white">Advanced Training Options</h3>
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-4 border-t border-gray-800/50">
                              <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3 mb-4">
                                  <div className="flex">
                                    <Info size={16} className="text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-300">
                                      These settings are pre-optimized for best results, but you can adjust them if you
                                      understand how they affect model training.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Optimizer */}
                                  <div className="space-y-2">
                                    <Label htmlFor="optimizer" className="text-sm text-gray-300">
                                      Optimizer
                                    </Label>
                                    <select
                                      id="optimizer"
                                      value={optimizer}
                                      onChange={(e) => setOptimizer(e.target.value)}
                                      className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-[#1eb8cd]"
                                    >
                                      <option value="adamw8bit">adamw8bit</option>
                                      <option value="adam8bit">adam8bit</option>
                                      <option value="lion">lion</option>
                                      <option value="sgd">sgd</option>
                                    </select>
                                    <p className="text-xs text-gray-500">Optimizer algorithm for training</p>
                                  </div>

                                  {/* Learning Rate */}
                                  <div className="space-y-2">
                                    <Label htmlFor="learning-rate" className="text-sm text-gray-300">
                                      Learning Rate
                                    </Label>
                                    <div className="flex items-center">
                                      <Input
                                        id="learning-rate"
                                        type="number"
                                        value={learningRate}
                                        onChange={(e) => setLearningRate(Number.parseFloat(e.target.value))}
                                        min={0.0001}
                                        max={0.01}
                                        step={0.0001}
                                        className="bg-gray-900 border-gray-700 text-white"
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500">Recommended: 0.0001-0.001</p>
                                  </div>

                                  {/* Resolution */}
                                  <div className="space-y-2">
                                    <Label htmlFor="resolution" className="text-sm text-gray-300">
                                      Resolution
                                    </Label>
                                    <select
                                      id="resolution"
                                      value={resolution}
                                      onChange={(e) => setResolution(e.target.value)}
                                      className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-[#1eb8cd]"
                                    >
                                      <option value="512">512 × 512</option>
                                      <option value="768">768 × 768</option>
                                      <option value="1024">1024 × 1024</option>
                                    </select>
                                    <p className="text-xs text-gray-500">Higher resolution requires more VRAM</p>
                                  </div>

                                  {/* Batch Size */}
                                  <div className="space-y-2">
                                    <Label htmlFor="batch-size" className="text-sm text-gray-300">
                                      Batch Size
                                    </Label>
                                    <div className="flex items-center">
                                      <Input
                                        id="batch-size"
                                        type="number"
                                        value={batchSize}
                                        onChange={(e) => setBatchSize(Number.parseInt(e.target.value))}
                                        min={1}
                                        max={8}
                                        step={1}
                                        className="bg-gray-900 border-gray-700 text-white"
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Higher values use more VRAM but train faster
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Train Model */}
                  {currentStep === 2 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Train Model</h2>
                      <p className="text-gray-400 mb-6">
                        Review your information and start the training process. This may take 5-10 minutes.
                      </p>

                      <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-1">Trigger Word</h3>
                            <p className="text-white">{triggerWord}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-1">Photos Uploaded</h3>
                            <p className="text-white">{uploadedPhotos.length} photos</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-1">Training Steps</h3>
                            <p className="text-white">{trainingSteps}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-1">LoRA Rank</h3>
                            <p className="text-white">{loraRank}</p>
                          </div>
                          {/* Only show advanced parameters if they've been changed from defaults */}
                          {(optimizer !== "adamw8bit" ||
                            learningRate !== 0.0004 ||
                            resolution !== "512" ||
                            batchSize !== 1) && (
                            <div className="md:col-span-2">
                              <h3 className="text-sm font-medium text-gray-400 mb-1">Advanced Settings</h3>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  Optimizer: <span className="text-[#1eb8cd]">{optimizer}</span>
                                </div>
                                <div>
                                  Learning Rate: <span className="text-[#1eb8cd]">{learningRate}</span>
                                </div>
                                <div>
                                  Resolution:{" "}
                                  <span className="text-[#1eb8cd]">
                                    {resolution} × {resolution}
                                  </span>
                                </div>
                                <div>
                                  Batch Size: <span className="text-[#1eb8cd]">{batchSize}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {trainingStatus === "queued" ? (
                        <div className="text-center">
                          <Button className="bg-[#1eb8cd] hover:bg-[#19a3b6] mb-4" onClick={startTraining}>
                            Start Training
                          </Button>
                          <p className="text-sm text-gray-400">This process will take approximately 5-10 minutes.</p>
                        </div>
                      ) : (
                        <TrainingStatus
                          status={trainingStatus}
                          progress={trainingProgress}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Back
                </Button>

                {currentStep < 2 ? (
                  <Button
                    className="bg-[#1eb8cd] hover:bg-[#19a3b6]"
                    onClick={goToNextStep}
                    disabled={(currentStep === 0 && !canProceedToStep2) || (currentStep === 1 && !canProceedToStep3)}
                  >
                    Continue
                  </Button>
                ) : (
                  trainingStatus === "completed" && (
                    <Button
                      className="bg-[#1eb8cd] hover:bg-[#19a3b6]"
                      onClick={() => {
                        resetTrainingForm()
                        setActiveTab("existing")
                      }}
                    >
                      View My Models
                    </Button>
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="existing">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">My Models</h2>
                <p className="text-gray-400">Select a model to use for generating images or create a new one.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Model Card */}
                {(userProfile.plan === "premium" || existingModels.length < 5) && (
                  <Card
                    className="bg-black border-dashed border-2 border-gray-800 hover:border-[#1eb8cd]/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setActiveTab("create")
                      setCurrentStep(0)
                      resetTrainingForm()
                    }}
                  >
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 rounded-full bg-[#1eb8cd]/10 flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-[#1eb8cd]" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">Create New Model</h3>
                      <p className="text-sm text-gray-400 text-center">Upload photos and train a new AI model</p>
                    </CardContent>
                  </Card>
                )}

                {/* Existing Models */}
                {existingModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    id={model.id}
                    name={model.name}
                    triggerWord={model.triggerWord}
                    createdAt={model.createdAt}
                    isActive={model.isActive}
                    thumbnailUrl={model.thumbnailUrl}
                    onSelect={() => {
                      setExistingModels((prev) =>
                        prev.map((m) => ({
                          ...m,
                          isActive: m.id === model.id,
                        })),
                      )
                    }}
                    onDelete={async () => {
                      try {
                        const response = await deleteModel(model.id);
                        if (response.success) {
                          toast.success("Model deleted successfully");
                          setExistingModels((prev) => prev.filter((m) => m.id !== model.id));
                          
                          // Reload user data to update remaining model count
                          loadUserData();
                        } else {
                          toast.error(response.error || "Failed to delete model");
                        }
                      } catch (error) {
                        console.error("Error deleting model:", error);
                        toast.error("An error occurred while deleting the model");
                      }
                    }}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

