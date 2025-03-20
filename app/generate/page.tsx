"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Home,
  Cpu,
  ImageIcon,
  Grid,
  Wand2,
  Sparkles,
  CheckCircle,
  Loader,
  Download,
  BookmarkPlus,
  RefreshCw,
  HelpCircle,
  LogOut,
  Plus,
  User,
  ChevronDown,
} from "lucide-react"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Upload, X } from "lucide-react"
import { generateImages as apiGenerateImages, fetchUserModels, fetchUserProfile, formatModelsForUI } from "@/utils/api"
import { toast } from "react-toastify"
import { Generation } from "@/utils/types"

// Custom Style Component
interface CustomStyle {
  id: string
  name: string
  prompt: string
  aspectRatio: string
  isDefault?: boolean
}

// Define proper types for our components
interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

interface AvatarProps {
  src?: string
  alt?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

interface PromptSuggestionProps {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
}

interface ModelPillProps {
  model: {
    id: string | number
    name: string
    thumbnailUrl?: string
  }
  isSelected: boolean
  onSelect: (id: string | number) => void
}

interface GeneratedImageProps {
  src?: string
  prompt: string
  onDownload: () => void
  onSaveToGallery: () => void
  onRegenerateVariation: () => void
  loading?: boolean
}

interface UserModel {
  id: string | number
  name: string
  triggerWord: string
  thumbnailUrl?: string
  description?: string
  isActive?: boolean
  status?: string
  canGenerate?: boolean
}

// Badge Component
const Badge = ({ children, variant = "default", className = "" }: BadgeProps) => {
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
const Avatar = ({ src, alt = "User avatar", size = "md", className = "" }: AvatarProps) => {
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

  return src ? (
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      className={`${sizeStyles[size]} rounded-full object-cover ${className}`}
    />
  ) : (
    fallback
  )
}

// Prompt Suggestion Button
const PromptSuggestion = ({ children, onClick, active = false }: PromptSuggestionProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm transition-all ${
        active
          ? "bg-[#1eb8cd]/20 text-[#1eb8cd] border border-[#1eb8cd]/30"
          : "bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-transparent"
      }`}
    >
      {children}
    </button>
  )
}

// Model Selection Pill
const ModelPill = ({ model, isSelected, onSelect }: ModelPillProps) => {
  return (
    <button
      onClick={() => onSelect(model.id)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
        isSelected ? "bg-[#1eb8cd] text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
      }`}
    >
      {model.thumbnailUrl ? (
        <img
          src={model.thumbnailUrl || "/placeholder.svg"}
          alt={model.name}
          className="w-5 h-5 rounded-full object-cover"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1eb8cd] to-purple-500 flex items-center justify-center">
          <span className="text-[8px] font-bold">{model.name.charAt(0)}</span>
        </div>
      )}
      <span className="text-sm font-medium">{model.name}</span>
      {isSelected && <CheckCircle size={14} className="ml-1" />}
    </button>
  )
}

// Generated Image Component
const GeneratedImage = ({ src, prompt, onDownload, onSaveToGallery, onRegenerateVariation, loading = false }: GeneratedImageProps) => {
  return (
    <div className="bg-black border border-gray-800/50 rounded-lg overflow-hidden group">
      {/* Image */}
      <div className="aspect-square relative bg-gray-900">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader size={36} className="text-[#1eb8cd] animate-spin mb-3" />
              <p className="text-gray-400">Generating image...</p>
            </div>
          </div>
        ) : (
          <img
            src={src || "/placeholder.svg"}
            alt={prompt}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        )}

        {/* Overlay actions on hover */}
        {!loading && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onDownload}
              className="rounded-full bg-black/50 border-white/20 hover:bg-black/80 hover:border-white/40"
            >
              <Download size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onSaveToGallery}
              className="rounded-full bg-black/50 border-white/20 hover:bg-black/80 hover:border-white/40"
            >
              <BookmarkPlus size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onRegenerateVariation}
              className="rounded-full bg-black/50 border-white/20 hover:bg-black/80 hover:border-white/40"
            >
              <RefreshCw size={18} />
            </Button>
          </div>
        )}
      </div>

      {/* Prompt preview */}
      <div className="p-3">
        <p className="text-sm text-gray-300 line-clamp-1" title={prompt}>
          {prompt}
        </p>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  // Navigation state
  const [activeNav, setActiveNav] = useState("generate-images")
  const router = useRouter()
  const { signOut } = useClerk()
  const { user, isLoaded: isUserLoaded } = useUser()

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    avatarUrl: "",
    plan: "free",
    dailyGenerations: 0,
    dailyGenerationsLimit: 20,
  })

  // Available models state
  const [models, setModels] = useState<UserModel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Selected model (will be set after models are loaded)
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [showModelSelector, setShowModelSelector] = useState(false)

  // Prompt state
  const [prompt, setPrompt] = useState("")
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false)

  // Generation parameters
  const [negativePrompt, setNegativePrompt] = useState("")
  const [imageCount, setImageCount] = useState(1)
  const [guidanceScale, setGuidanceScale] = useState(7.5)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [useAdvancedSettings, setUseAdvancedSettings] = useState(false)
  const [preset, setPreset] = useState("photorealistic")

  // Custom styles state
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>([
    {
      id: "photorealistic",
      name: "Photorealistic",
      prompt: "photorealistic, high quality, detailed, 8k resolution, professional lighting",
      aspectRatio: "1:1",
      isDefault: true,
    },
    {
      id: "cinematic",
      name: "Cinematic",
      prompt: "cinematic, movie scene, dramatic lighting, film grain, widescreen",
      aspectRatio: "16:9",
      isDefault: true,
    },
    {
      id: "anime",
      name: "Anime/Stylized",
      prompt: "anime style, vibrant colors, stylized, detailed illustration",
      aspectRatio: "1:1",
      isDefault: true,
    },
    {
      id: "artistic",
      name: "Artistic",
      prompt: "artistic, painterly style, expressive, creative, fine art",
      aspectRatio: "4:5",
      isDefault: true,
    },
    {
      id: "portrait",
      name: "Portrait",
      prompt: "portrait, professional photography, studio lighting, high detail",
      aspectRatio: "4:5",
      isDefault: true,
    },
    {
      id: "youtube",
      name: "YouTube Thumbnail",
      prompt: "eye-catching YouTube thumbnail, vibrant colors, clear focal point, attention-grabbing",
      aspectRatio: "16:9",
      isDefault: false,
    },
  ])

  const [showCreateStyleDialog, setShowCreateStyleDialog] = useState(false)
  const [newStyle, setNewStyle] = useState<CustomStyle>({
    id: "",
    name: "",
    prompt: "",
    aspectRatio: "1:1",
  })

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<{
    id: string | number;
    src: string;
    prompt: string;
  }[]>([])
  const [generatedImagesLoading, setGeneratedImagesLoading] = useState(false)

  // UI state
  const [showSettings, setShowSettings] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null)

  // Advanced settings state
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [promptStrength, setPromptStrength] = useState(0.8)
  const [modelType, setModelType] = useState("dev")
  const [inferenceSteps, setInferenceSteps] = useState(28)
  const [outputFormat, setOutputFormat] = useState("webp")
  const [outputQuality, setOutputQuality] = useState(80)
  const [loraScale, setLoraScale] = useState(1)

  // Prompt example suggestions
  const promptSuggestions = [
    { id: "professional", text: "Professional headshot" },
    { id: "casual", text: "Casual portrait" },
    { id: "adventure", text: "Adventure scene" },
    { id: "cyberpunk", text: "Cyberpunk style" },
    { id: "fantasy", text: "Fantasy character" },
  ]

  // Aspect ratio options
  const aspectRatioOptions = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "4:5", label: "Portrait (4:5)" },
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Mobile (9:16)" },
  ]

  // Add seed state
  const [seed, setSeed] = useState<number | null>(null);
  const [randomSeed, setRandomSeed] = useState(true);

  // Helper function to generate a random seed
  const generateRandomSeed = () => {
    return Math.floor(Math.random() * 2147483647);
  };

  // Ensure seed is set when needed
  useEffect(() => {
    if (randomSeed && !seed) {
      setSeed(generateRandomSeed());
    }
  }, [randomSeed, seed]);

  // Load user data and models
  useEffect(() => {
    async function loadUserData() {
      if (!isUserLoaded || !user) return
      
      try {
        setIsLoading(true)
        
        // Fetch user profile data
        const profileData = await fetchUserProfile()
        
        if (!profileData.success) {
          console.error("Profile data error:", profileData.error)
          toast.error(profileData.error || "Failed to fetch profile data")
          setIsLoading(false)
          return
        }
        
        // Update user profile
        setUserProfile({
          name: user.firstName || user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || "User",
          email: user.emailAddresses[0]?.emailAddress || "",
          avatarUrl: user.imageUrl || "",
          plan: profileData.profile?.subscription?.status || "free",
          dailyGenerations: profileData.profile?.quotas?.generations?.used || 0,
          dailyGenerationsLimit: profileData.profile?.quotas?.generations?.total || 20,
        })
        
        // Load user models
        await loadUserModels()
      } catch (error) {
        console.error("Error loading user data:", error)
        toast.error("Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserData()
  }, [isUserLoaded, user])

  // Load user models
  async function loadUserModels() {
    try {
      console.log("🔍 Starting to fetch user models...");
      const modelsData = await fetchUserModels({ limit: 20, page: 1 });
      console.log("📊 Raw API response:", modelsData);
      console.log("📊 Raw models array:", modelsData.models);
      
      if (modelsData.models && modelsData.models.length > 0) {
        console.log("✅ API returned models. Count:", modelsData.models.length);
        
        // Log each model's structure to understand their format
        modelsData.models.forEach((model: any, index: number) => {
          console.log(`Model ${index + 1}:`, {
            id: model.id,
            name: model.name,
            trigger_word: model.trigger_word,
            status: model.status,
            progress: model.progress
          });
        });
        
        // Format models using the helper function - force the correct type
        const formattedModels = formatModelsForUI(modelsData.models as any) as UserModel[];
        console.log("🔄 After formatting:", formattedModels);
        
        // Log each formatted model
        formattedModels.forEach((model, index) => {
          console.log(`Formatted model ${index + 1}:`, {
            id: model.id,
            name: model.name,
            triggerWord: model.triggerWord,
            status: model.status,
            isActive: model.isActive
          });
        });
        
        // Consider all models for display, but mark their status appropriately
        const availableModels = formattedModels.filter(model => {
          // We'll show all models, but only mark them as active if they meet our criteria
          const isGenerationReady = 
            model.isActive || 
            model.status === "ready" || 
            model.status === "completed" ||
            model.status === "succeeded" ||
            model.status === "active" ||
            model.status === "done";
            
          // Add a property to indicate if the model can be used for generation
          model.canGenerate = isGenerationReady;
          
          console.log(`Model ${model.name} (${model.id}) status check:`, {
            status: model.status,
            isActive: model.isActive,
            canGenerate: model.canGenerate,
            triggerWord: model.triggerWord || "none"
          });
          
          // Show all models, even processing ones
          return true;
        });
        
        console.log("🔍 Available models after filtering:", availableModels);
        
        if (availableModels.length > 0) {
          console.log("✅ Setting models state with available models:", availableModels.length);
          setModels(availableModels);
          
          // If there's no selected model or the selected model is no longer available,
          // set the first available model as selected
          if (!selectedModel || !availableModels.some(m => String(m.id) === selectedModel)) {
            console.log("🔄 Setting selected model to:", availableModels[0].id);
            setSelectedModel(String(availableModels[0].id));
          }
          
          console.log("📌 Selected model ID:", selectedModel);
        } else {
          // No completed models found
          console.log("⚠️ No available models found after filtering");
          setModels([]);
          setSelectedModel("");
        }
      } else {
        // No models found at all
        console.log("⚠️ No models returned from API");
        setModels([]);
        setSelectedModel("");
      }
    } catch (error) {
      console.error("❌ Error loading user models:", error);
      toast.error("Failed to load your models");
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    await signOut(() => router.push("/"))
  }

  const getSelectedModelDetails = () => {
    if (!models || models.length === 0) {
      return { id: null, name: "No models available", triggerWord: "", thumbnailUrl: "", canGenerate: false };
    }
    
    const selectedModelObject = models.find((model) => String(model.id) === selectedModel);
    
    // If we have a valid selection, return it
    if (selectedModelObject) {
      return selectedModelObject;
    }
    
    // If we don't have a valid selection but have models available, 
    // select the first one automatically
    if (models.length > 0) {
      console.log("No selected model found, automatically selecting the first available model");
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        setSelectedModel(String(models[0].id));
      }, 0);
      return models[0];
    }
    
    // Fallback if nothing is found
    return { id: null, name: "No models available", triggerWord: "", thumbnailUrl: "", canGenerate: false };
  }

  // Handle style selection
  const handleStyleChange = (styleId: string) => {
    const selectedStyle = customStyles.find((style) => style.id === styleId)
    if (selectedStyle) {
      setPreset(styleId)

      // If the prompt is empty or the user confirms, update the prompt with the style's prompt
      if (!prompt || window.confirm("Would you like to apply this style's prompt template?")) {
        const modelDetails = getSelectedModelDetails()
        const triggerWord = modelDetails.triggerWord

        // Combine the trigger word with the style's prompt
        const newPrompt = `${triggerWord}, ${selectedStyle.prompt}`
        setPrompt(newPrompt)
      }

      // Update aspect ratio
      setAspectRatio(selectedStyle.aspectRatio)
    }
  }

  // Handle prompt enhancement
  const enhancePrompt = async () => {
    if (!prompt) {
      toast.warning("Please enter a prompt to enhance");
      return;
    }
    
    if (!selectedModel) {
      toast.warning("Please select a model first");
      setShowModelSelector(true);
      return;
    }

    setIsEnhancingPrompt(true);

    try {
      // Get the model details with trigger word
      const modelDetails = getSelectedModelDetails();
      const triggerWord = modelDetails.triggerWord || "";
      
      // In a real implementation, you would call an API to enhance the prompt
      // For now, we'll use a simple enhancement logic with a delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Make sure the trigger word is included
      let enhancedPrompt = prompt;
      if (triggerWord && !prompt.toLowerCase().includes(triggerWord.toLowerCase())) {
        enhancedPrompt = `${triggerWord}, ${enhancedPrompt}`;
      }
      
      // Add quality boosting terms based on selected style
      const selectedStyle = customStyles.find(style => style.id === preset);
      if (selectedStyle && selectedStyle.prompt) {
        // Extract style-specific terms that aren't already in the prompt
        const styleTerms = selectedStyle.prompt
          .split(',')
          .map(term => term.trim())
          .filter(term => term && !enhancedPrompt.toLowerCase().includes(term.toLowerCase()));
        
        if (styleTerms.length > 0) {
          enhancedPrompt = `${enhancedPrompt}, ${styleTerms.join(', ')}`;
        }
      }
      
      // Add general quality terms if not already present
      const qualityTerms = [
        "high quality", 
        "detailed", 
        "8k resolution", 
        "sharp focus", 
        "professional lighting"
      ];
      
      const missingQualityTerms = qualityTerms.filter(
        term => !enhancedPrompt.toLowerCase().includes(term.toLowerCase())
      );
      
      if (missingQualityTerms.length > 0) {
        enhancedPrompt = `${enhancedPrompt}, ${missingQualityTerms.join(', ')}`;
      }
      
      // Update the prompt
      setPrompt(enhancedPrompt);
      toast.success("Prompt enhanced with quality improvements");
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      toast.error("Failed to enhance prompt. Please try again.");
    } finally {
      setIsEnhancingPrompt(false);
    }
  }

  // Handle image generation
  const handleGenerateImages = async () => {
    // Validate that we have a model selected
    if (!selectedModel) {
      toast.warning("Please select a model first");
      setShowModelSelector(true); // Open the model selector
      return;
    }
    
    // Validate that we have a prompt
    if (!prompt || prompt.trim() === "") {
      toast.warning("Please enter a prompt");
      if (promptInputRef.current && promptInputRef.current instanceof HTMLTextAreaElement) {
        promptInputRef.current.focus();
      }
      return;
    }

    // Check if we have enough remaining generations
    if (userProfile.dailyGenerations >= userProfile.dailyGenerationsLimit) {
      toast.error(
        userProfile.plan === "premium"
          ? "You've reached your daily limit. Try again tomorrow."
          : "You've reached your free tier limit. Upgrade to Premium for more generations."
      )
      return
    }

    setIsGenerating(true)
    
    try {
      // Get the model details with trigger word
      const modelDetails = models.find(model => String(model.id) === selectedModel);
      if (!modelDetails) {
        throw new Error("Selected model not found");
      }
      
      const triggerWord = modelDetails.triggerWord || "";
      
      // Combine trigger word with the prompt if it's not already included
      let fullPrompt = prompt;
      if (triggerWord && !prompt.toLowerCase().includes(triggerWord.toLowerCase())) {
        toast.info(`Adding model trigger word: "${triggerWord}" to your prompt`);
        fullPrompt = `${triggerWord}, ${prompt}`;
      }
      
      console.log("Generating images with prompt:", fullPrompt);
      
      // Set up parameters for the API call - matching the expected format from the API
      const generationParams = {
        prompt: fullPrompt,
        negativePrompt: negativePrompt,
        modelId: selectedModel,
        count: imageCount, // Use count instead of numberOfImages
        guidanceScale: guidanceScale, // Use guidanceScale instead of guidance_scale
        steps: inferenceSteps,
        seed: randomSeed ? undefined : (seed || undefined), // Ensure we don't pass null
      };
      
      console.log("Generation parameters:", generationParams);
      
      // Clear existing images and show loading state
      setGeneratedImages([]);
      setGeneratedImagesLoading(true);
      
      // Generate temporary loading images
      const tempImages = new Array(imageCount).fill(0).map((_, i) => ({
        id: `temp-${Date.now()}-${i}`,
        src: "/placeholder.svg",
        prompt: fullPrompt,
      }));
      
      setGeneratedImages(tempImages);
      
      // Call the API to generate images
      const result = await apiGenerateImages(generationParams);
      console.log("API generation result:", result);

      if (result.success) {
        // Wait a short time before checking for results - the API might need time to process
        toast.info("Starting image generation, please wait...");
        
        // In a real implementation, we would poll the API for the generation results
        // For now, we'll simulate a delay and show some sample images
        setTimeout(() => {
          // Check the response structure
          if (result.data?.generations) {
            const generationsArray = result.data.generations;
            console.log("Generations array:", generationsArray);
            
            if (generationsArray.length > 0) {
              setGeneratedImages(
                generationsArray.map((gen, i) => ({
                  id: gen.id || `gen-${Date.now()}-${i}`,
                  src: gen.image_url || "/placeholder.svg",
                  prompt: fullPrompt,
                }))
              );
              toast.success("Images generated successfully!");
            } else {
              // No generations found
              toast.warning("No images were generated. Please try again.");
            }
          } else if (result.generations && Array.isArray(result.generations)) {
            // Direct generations array in the result (old API format)
            const generationsArray = result.generations;
            console.log("Generations array (old format):", generationsArray);
            
            if (generationsArray.length > 0) {
              setGeneratedImages(
                generationsArray.map((gen: any, i: number) => ({
                  id: gen.id || `gen-${Date.now()}-${i}`,
                  src: gen.image_url || gen.url || "/placeholder.svg",
                  prompt: fullPrompt,
                }))
              );
              toast.success("Images generated successfully!");
            } else {
              toast.warning("No images were generated. Please try again.");
            }
          } else {
            // If API returned success but in a different format than expected
            console.log("Unexpected API response format:", result);
            toast.info("Generation process started. Your images will appear in the gallery once ready.");
          }
          
          setGeneratedImagesLoading(false);
          
          // Increment used generations
          setUserProfile({
            ...userProfile,
            dailyGenerations: userProfile.dailyGenerations + 1
          });
        }, 2000);
      } else {
        setGeneratedImagesLoading(false);
        toast.error(result.error || "Failed to generate images");
      }
    } catch (error) {
      console.error("Error generating images:", error);
      setGeneratedImagesLoading(false);
      toast.error(`Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle download
  const handleDownload = (index: number) => {
    const image = generatedImages[index]
    if (!image || !image.src) return
    
    // Create a temporary anchor element to download the image
    const link = document.createElement('a')
    link.href = image.src
    link.download = `generated-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("Image downloaded successfully!")
  }

  // Handle save to gallery
  const handleSaveToGallery = (index: number) => {
    // Note: In a real app, you would call an API to save the image to the user's gallery
    // For now, we'll just show a success message
    toast.success("Image saved to gallery!")
  }

  // Handle regenerate variation
  const handleRegenerateVariation = (index: number) => {
    const image = generatedImages[index]
    if (!image) return
    
    // Set the current prompt to regenerate a similar image
    setPrompt(`${prompt} (variation)`)
    
    // Trigger generation with the updated prompt
    handleGenerateImages()
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: { id: string, text: string }) => {
    setActiveSuggestion(suggestion.id)

    const modelDetails = getSelectedModelDetails()
    const triggerWord = modelDetails.triggerWord

    // Add the trigger word to the suggestion text
    setPrompt(`${triggerWord}, ${suggestion.text}`)
  }

  // Handle create new style
  const handleCreateStyle = () => {
    // Check if we're editing an existing style
    const isEditing = newStyle.id !== ""

    if (isEditing) {
      // Update existing style
      const updatedStyles = customStyles.map((style) => (style.id === newStyle.id ? newStyle : style))

      setCustomStyles(updatedStyles)
    } else {
      // Generate an ID from the name for new style
      const id = newStyle.name.toLowerCase().replace(/\s+/g, "-")

      const styleToAdd = {
        ...newStyle,
        id,
      }

      setCustomStyles([...customStyles, styleToAdd])
      setPreset(id)
    }

    setShowCreateStyleDialog(false)

    // Reset the new style form
    setNewStyle({
      id: "",
      name: "",
      prompt: "",
      aspectRatio: "1:1",
    })
  }

  // Handle delete style
  const handleDeleteStyle = (styleId: string) => {
    // Don't allow deleting default styles
    const styleToDelete = customStyles.find((style) => style.id === styleId)
    if (styleToDelete?.isDefault) {
      alert("Default styles cannot be deleted.")
      return
    }

    setCustomStyles(customStyles.filter((style) => style.id !== styleId))

    // If the deleted style was selected, reset to photorealistic
    if (preset === styleId) {
      setPreset("photorealistic")
    }
  }

  // Navigation items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
    { id: "train-model", label: "Train Model", icon: <Cpu size={20} />, href: "/train" },
    { id: "generate-images", label: "Generate Images", icon: <ImageIcon size={20} />, href: "/generate" },
    { id: "gallery", label: "Gallery", icon: <Grid size={20} />, href: "/gallery" },
  ]

  // Usage stats (mock data)
  const usageStats = {
    used: 45,
    limit: userProfile.plan === "premium" ? 100 : 20,
    resetTime: "12 hours",
  }

  // Get remaining generations
  const getRemainingGenerations = () => {
    return userProfile.dailyGenerationsLimit - userProfile.dailyGenerations
  }

  // Ref for prompt input
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  // Focus prompt input on mount
  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.focus()
    }
  }, [])

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
            <Avatar src={userProfile.avatarUrl} size="md" alt={userProfile.name} />
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
            onClick={handleSignOut}
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Generate Images</h1>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center">
                <Badge variant="info" className="mr-2">
                  {userProfile.plan === "premium" ? "Premium" : "Free"}
                </Badge>
                <span className="text-sm text-gray-400">
                  {getRemainingGenerations()} / {usageStats.limit} generations left
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-gray-900/80 border-gray-700 hover:bg-gray-800 hover:border-gray-600 rounded-full h-9 w-9"
                    >
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Help & Tips</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6">
            {/* Prompt input section */}
            <div className="mb-8">
              <div className="relative">
                {/* Model selector button */}
                <div className="flex flex-col w-full mb-3 relative">
                  <Button
                    variant="outline"
                    className={`flex items-center ${
                      models && models.length > 0 && selectedModel 
                        ? "bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-gray-600" 
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    } w-full`}
                    onClick={() => {
                      console.log("🖱️ Model selector button clicked");
                      console.log("📋 Current models state:", models);
                      console.log("🔍 Models array length:", models ? models.length : 0);
                      console.log("📌 Current selected model:", selectedModel);
                      console.log("👁️ Current showModelSelector state:", showModelSelector);
                      setShowModelSelector(!showModelSelector);
                      console.log("👁️ New showModelSelector state:", !showModelSelector);
                    }}
                  >
                    <User size={16} className={`mr-2 ${selectedModel ? "text-[#1eb8cd]" : "text-amber-400"}`} />
                    <span className="mr-1">Model:</span>
                    {selectedModel ? (
                      <span className="font-medium text-[#1eb8cd]">{getSelectedModelDetails().name}</span>
                    ) : (
                      <span className="font-medium text-amber-400">Please select a model</span>
                    )}
                    {models && models.length > 0 && <ChevronDown size={16} className="ml-2" />}
                  </Button>
                  
                  {showModelSelector && models && models.length > 0 && (
                    (() => {
                      console.log("🔍 Dropdown render condition met:");
                      console.log("  - showModelSelector:", showModelSelector);
                      console.log("  - models exists:", !!models);
                      console.log("  - models.length:", models?.length);
                      return (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            <div className="px-2 py-1 text-xs text-gray-400 font-medium">Your Models</div>
                            {models.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  console.log("🖱️ Model selected:", model.id, model.name);
                                  setSelectedModel(String(model.id));
                                  setShowModelSelector(false);
                                  // Reset the prompt when changing models
                                  const newTriggerWord = model.triggerWord || "";
                                  // Only update the prompt if it's empty or if the user confirms
                                  if (!prompt || window.confirm("Would you like to update your prompt with the new model's trigger word?")) {
                                    setPrompt(newTriggerWord ? `${newTriggerWord}, ` : "");
                                  }
                                }}
                                className={`flex items-center w-full p-2 rounded-md text-left ${
                                  selectedModel === String(model.id)
                                    ? "bg-[#1eb8cd]/20 text-[#1eb8cd]"
                                    : "text-gray-300 hover:bg-gray-800"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-800 mr-2 flex items-center justify-center overflow-hidden">
                                  {model.thumbnailUrl ? (
                                    <img
                                      src={model.thumbnailUrl || "/placeholder.svg"}
                                      alt={model.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold">{model.name.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{model.name}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {model.status === "processing" ? (
                                      <span className="flex items-center">
                                        <Loader size={10} className="animate-spin mr-1" />
                                        Processing...
                                      </span>
                                    ) : model.triggerWord ? (
                                      <span className="text-green-400">Trigger: {model.triggerWord}</span>
                                    ) : (
                                      <span className="text-amber-400">No trigger word</span>
                                    )}
                                  </p>
                                </div>
                                {selectedModel === String(model.id) && <CheckCircle size={16} className="text-[#1eb8cd]" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })()
                  )}
                  
                  {(!models || models.length === 0) && !isLoading && (
                    <div className="mt-2 text-sm text-amber-400">
                      <p>You don't have any completed models yet. <Link href="/train" className="underline">Train a model</Link> to get started.</p>
                    </div>
                  )}
                  
                  {isLoading && (
                    <div className="mt-2 text-sm text-gray-400 flex items-center">
                      <Loader size={14} className="animate-spin mr-2" />
                      <span>Loading your models...</span>
                    </div>
                  )}
                </div>

                {/* Prompt input with magic button */}
                <div className="relative mb-3 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1eb8cd]/20 to-purple-500/20 rounded-xl blur-xl opacity-30 group-focus-within:opacity-50 transition-opacity"></div>
                  <div className="relative flex flex-col bg-gray-900/90 backdrop-blur-sm border border-gray-800 hover:border-gray-700 focus-within:border-[#1eb8cd]/50 rounded-xl overflow-hidden transition-all shadow-lg">
                    {selectedModel && getSelectedModelDetails().triggerWord && (
                      <div className="px-4 pt-2 pb-1 flex items-center">
                        <Badge variant="info" className="mr-2">Trigger Word</Badge>
                        <span className="text-xs text-gray-400">{getSelectedModelDetails().triggerWord}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Textarea
                        ref={promptInputRef}
                        placeholder={selectedModel ? "Describe what you want to create with your model..." : "Select a model first, then describe what you want to generate..."}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="flex-grow bg-transparent border-0 focus-visible:ring-0 resize-none py-4 h-[60px] text-white placeholder-gray-500"
                      />

                      <div className="flex-shrink-0 pr-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={enhancePrompt}
                                disabled={!prompt || isEnhancingPrompt || !selectedModel}
                                className="rounded-lg bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 mr-2"
                              >
                                {isEnhancingPrompt ? (
                                  <Loader size={18} className="animate-spin text-[#1eb8cd]" />
                                ) : (
                                  <Sparkles size={18} className="text-[#1eb8cd]" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enhance Prompt with AI</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <Button
                          onClick={handleGenerateImages}
                          disabled={!prompt || isGenerating || !selectedModel || !getSelectedModelDetails().canGenerate}
                          className={`rounded-lg ${
                            getSelectedModelDetails().canGenerate 
                              ? "bg-[#1eb8cd] hover:bg-[#19a3b6]"
                              : "bg-gray-700 cursor-not-allowed"
                          } text-white`}
                        >
                          {isGenerating ? (
                            <>
                              <Loader size={16} className="animate-spin mr-2" />
                              Generating...
                            </>
                          ) : !selectedModel ? (
                            <>
                              <Wand2 size={16} className="mr-2" />
                              Select a model
                            </>
                          ) : !getSelectedModelDetails().canGenerate ? (
                            <>
                              <Loader size={16} className="animate-spin mr-2" />
                              Model processing...
                            </>
                          ) : (
                            <>
                              <Wand2 size={16} className="mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt suggestions */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {promptSuggestions.map((suggestion) => (
                    <PromptSuggestion
                      key={suggestion.id}
                      active={activeSuggestion === suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.text}
                    </PromptSuggestion>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings and generation options */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-medium">Generation Settings</h2>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedSettings(true)}
                  className="border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10 rounded-md"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      d="M8 2C7.44772 2 7 2.44772 7 3C7 3.55228 7.44772 4 8 4C8.55228 4 9 3.55228 9 3C9 2.44772 8.55228 2 8 2Z"
                      fill="currentColor"
                    />
                    <path
                      d="M8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7Z"
                      fill="currentColor"
                    />
                    <path
                      d="M7 13C7 12.4477 7.44772 12 8 12C8.55228 12 9 12.4477 9 13C9 13.5523 8.55228 14 8 14C7.44772 14 7 13.5523 7 13Z"
                      fill="currentColor"
                    />
                  </svg>
                  Advanced Settings
                </Button>
              </div>

              {/* Quick settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/80 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="quick-preset" className="text-sm font-medium">
                      Style
                    </Label>
                    <Badge variant="default" className="bg-gray-800">
                      {customStyles.find((s) => s.id === preset)?.name || preset}
                    </Badge>
                  </div>
                  <Select value={preset} onValueChange={handleStyleChange}>
                    <SelectTrigger id="quick-preset" className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                      {customStyles.map((style) => (
                        <div key={style.id} className="relative group">
                          <SelectItem value={style.id} className="pr-16">
                            {style.name}
                          </SelectItem>
                          {!style.isDefault && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const styleToEdit = { ...style }
                                  setNewStyle(styleToEdit)
                                  setShowCreateStyleDialog(true)
                                }}
                                className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-[#1eb8cd] transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteStyle(style.id)
                                }}
                                className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="py-2 px-2 border-t border-gray-700 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-center text-[#1eb8cd] hover:bg-[#1eb8cd]/10"
                          onClick={() => {
                            setNewStyle({
                              id: "",
                              name: "",
                              prompt: "",
                              aspectRatio: "1:1",
                            })
                            setShowCreateStyleDialog(true)
                          }}
                        >
                          <Plus size={14} className="mr-1" />
                          Create New Style
                        </Button>
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/80 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="quick-aspect" className="text-sm font-medium">
                      Aspect Ratio
                    </Label>
                    <Badge variant="default" className="bg-gray-800">
                      {aspectRatio}
                    </Badge>
                  </div>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger id="quick-aspect" className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {aspectRatioOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/80 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-4">
                    <Label htmlFor="quick-count" className="text-sm font-medium">
                      Number of Images
                    </Label>
                    <Badge variant="default" className="bg-gray-800">
                      {imageCount}
                    </Badge>
                  </div>
                  <Slider
                    id="quick-count"
                    min={1}
                    max={4}
                    step={1}
                    value={[imageCount]}
                    onValueChange={(value) => setImageCount(value[0])}
                  />
                </div>
              </div>
            </div>

            {/* Generated images */}
            {(isGenerating || generatedImagesLoading || generatedImages.length > 0) && (
              <div className="mt-8 border-t border-gray-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Generated Images</h2>
                  {(isGenerating || generatedImagesLoading) && (
                    <div className="flex items-center text-gray-400">
                      <Loader size={14} className="animate-spin mr-2" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  )}
                </div>

                {/* Loading placeholders */}
                {(isGenerating || generatedImagesLoading) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array(imageCount)
                      .fill(null)
                      .map((_, index) => (
                        <GeneratedImage
                          key={`loading-${index}`}
                          src=""
                          prompt={prompt}
                          onDownload={() => {}}
                          onSaveToGallery={() => {}}
                          onRegenerateVariation={() => {}}
                          loading={true}
                        />
                      ))}
                  </div>
                )}

                {/* Actual generated images */}
                {!isGenerating && !generatedImagesLoading && generatedImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {generatedImages.map((image, index) => (
                      <GeneratedImage
                        key={`image-${String(image.id || index)}`}
                        src={image.src}
                        prompt={image.prompt}
                        onDownload={() => handleDownload(index)}
                        onSaveToGallery={() => handleSaveToGallery(index)}
                        onRegenerateVariation={() => handleRegenerateVariation(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Advanced Settings Sheet */}
      <Sheet open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
        <SheetContent className="w-full sm:max-w-md bg-black border-gray-800 text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Advanced Settings</SheetTitle>
            <SheetDescription className="text-gray-400">Fine-tune your image generation parameters</SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* Seed Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white">Seed</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="random-seed" className="text-sm text-gray-400">Random</Label>
                  <input
                    id="random-seed"
                    type="checkbox"
                    checked={randomSeed}
                    onChange={(e) => setRandomSeed(e.target.checked)}
                    className="rounded bg-gray-800 border-gray-600"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  value={seed !== null ? seed : ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      setSeed(value);
                    } else if (e.target.value === '') {
                      setSeed(null);
                    }
                  }}
                  type="number"
                  placeholder="Enter seed value"
                  className="bg-gray-900 border-gray-700 text-white"
                  disabled={randomSeed}
                />
                <Button
                  variant="outline"
                  onClick={() => setSeed(generateRandomSeed())}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  disabled={randomSeed}
                >
                  Refresh
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Setting a specific seed allows you to reproduce the same image with identical parameters.
              </p>
            </div>

            {/* Image File */}
            <div className="space-y-2">
              <Label className="text-white">Image File</Label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-[#1eb8cd] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0])
                    }
                  }}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400 mb-1">Enter a URL, paste a file, or drag a file over</p>
                  <p className="text-xs text-gray-500">
                    Input image for image to image or inpainting mode. If provided, aspect ratio, width, and height
                    inputs are ignored.
                  </p>
                </label>
              </div>
              {imageFile && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-300">{imageFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-500"
                    onClick={() => {
                      setImageFile(null)
                    }}
                  >
                    <X size={16} className="mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Prompt Strength */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="prompt-strength" className="text-white">
                  Prompt Strength
                </Label>
                <span className="text-sm text-white">{promptStrength}</span>
              </div>
              <Slider
                id="prompt-strength"
                min={0}
                max={1}
                step={0.01}
                value={[promptStrength]}
                onValueChange={(value) => setPromptStrength(value[0])}
              />
              <p className="text-xs text-gray-500">
                Prompt strength when using img2img. 1.0 corresponds to full destruction of information in image.
                <br />
                Default: 0.8
              </p>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model-type" className="text-white">
                Model
              </Label>
              <Select value={modelType} onValueChange={setModelType}>
                <SelectTrigger id="model-type" className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="dev">dev</SelectItem>
                  <SelectItem value="schnell">schnell</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Which model to run inference with. The dev model performs best with around 28 inference steps but the
                schnell model only needs 4 steps.
                <br />
                Default: "dev"
              </p>
            </div>

            {/* Number of Inference Steps */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="inference-steps" className="text-white">
                  Number of Inference Steps
                </Label>
                <span className="text-sm text-white">{inferenceSteps}</span>
              </div>
              <Slider
                id="inference-steps"
                min={1}
                max={50}
                step={1}
                value={[inferenceSteps]}
                onValueChange={(value) => setInferenceSteps(value[0])}
              />
              <p className="text-xs text-gray-500">
                Number of denoising steps. More steps can give more detailed images, but take longer.
                <br />
                Default: 28
              </p>
            </div>

            {/* Guidance Scale */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="guidance-scale" className="text-white">
                  Guidance Scale
                </Label>
                <span className="text-sm text-white">{guidanceScale}</span>
              </div>
              <Slider
                id="guidance-scale"
                min={0}
                max={10}
                step={0.1}
                value={[guidanceScale]}
                onValueChange={(value) => setGuidanceScale(value[0])}
              />
              <p className="text-xs text-gray-500">
                Guidance scale for the diffusion process. Lower values can give more realistic images. Good values to
                try are 2, 2.5, 3, and 3.5.
                <br />
                Default: 3
              </p>
            </div>

            {/* Output Format */}
            <div className="space-y-2">
              <Label htmlFor="output-format" className="text-white">
                Output Format
              </Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger id="output-format" className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="webp">webp</SelectItem>
                  <SelectItem value="png">png</SelectItem>
                  <SelectItem value="jpeg">jpeg</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Format of the output images.
                <br />
                Default: "webp"
              </p>
            </div>

            {/* Output Quality */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="output-quality" className="text-white">
                  Output Quality
                </Label>
                <span className="text-sm text-white">{outputQuality}</span>
              </div>
              <Slider
                id="output-quality"
                min={0}
                max={100}
                step={1}
                value={[outputQuality]}
                onValueChange={(value) => setOutputQuality(value[0])}
                disabled={outputFormat === "png"}
              />
              <p className="text-xs text-gray-500">
                Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not
                relevant for .png outputs.
                <br />
                Default: 80
              </p>
            </div>

            {/* Lora Scale */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="lora-scale" className="text-white">
                  Lora Scale
                </Label>
                <span className="text-sm text-white">{loraScale}</span>
              </div>
              <Slider
                id="lora-scale"
                min={-1}
                max={3}
                step={0.1}
                value={[loraScale]}
                onValueChange={(value) => setLoraScale(value[0])}
              />
              <p className="text-xs text-gray-500">
                Determines how strongly the main LoRA should be applied. Sane results between 0 and 1 for base
                inference. For go_fast, we apply a 1.5x multiplier to this value; we've generally seen good performance
                when scaling the base value by that amount. You may still need to experiment to find the best value for
                your particular LoRA.
                <br />
                Default: 1
              </p>
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSettings(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={() => setShowAdvancedSettings(false)} className="bg-[#1eb8cd] hover:bg-[#19a3b6]">
              Apply Settings
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Create Custom Style Dialog */}
      <Dialog open={showCreateStyleDialog} onOpenChange={setShowCreateStyleDialog}>
        <DialogContent className="bg-black border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>{newStyle.id ? "Edit Style" : "Create Custom Style"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create your own style preset with custom prompt and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="style-name">Style Name</Label>
              <Input
                id="style-name"
                value={newStyle.name}
                onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
                placeholder="YouTube Thumbnail"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style-prompt">Prompt Template</Label>
              <Textarea
                id="style-prompt"
                value={newStyle.prompt}
                onChange={(e) => setNewStyle({ ...newStyle, prompt: e.target.value })}
                placeholder="eye-catching YouTube thumbnail, vibrant colors, clear focal point, attention-grabbing"
                className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
              />
              <p className="text-xs text-gray-500">
                This will be combined with your model's trigger word when generating images
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style-aspect">Default Aspect Ratio</Label>
              <Select
                value={newStyle.aspectRatio}
                onValueChange={(value) => setNewStyle({ ...newStyle, aspectRatio: value })}
              >
                <SelectTrigger id="style-aspect" className="bg-gray-900 border-gray-700">
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {aspectRatioOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateStyleDialog(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStyle}
              disabled={!newStyle.name || !newStyle.prompt}
              className="bg-[#1eb8cd] hover:bg-[#19a3b6]"
            >
              {newStyle.id ? "Save Changes" : "Create Style"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

