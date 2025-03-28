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

// Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
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
const Avatar = ({ src, alt = "User avatar", size = "md", className = "" }) => {
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
const PromptSuggestion = ({ children, onClick, active = false }) => {
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
const ModelPill = ({ model, isSelected, onSelect }) => {
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
const GeneratedImage = ({ src, prompt, onDownload, onSaveToGallery, onRegenerateVariation, loading = false }) => {
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

// Custom Style Component
interface CustomStyle {
  id: string
  name: string
  prompt: string
  aspectRatio: string
  isDefault?: boolean
}

export default function GeneratePage() {
  // Navigation state
  const [activeNav, setActiveNav] = useState("generate-images")

  // User profile state (mock data)
  const [userProfile, setUserProfile] = useState({
    name: "Jane Cooper",
    email: "jane.cooper@example.com",
    avatarUrl: "",
    plan: "premium",
  })

  // Available models (mock data)
  const [models, setModels] = useState([
    {
      id: "model-1",
      name: "jane123",
      triggerWord: "jane123",
      thumbnailUrl: "/placeholder.svg?height=100&width=100",
      description: "Perfect for professional headshots and business contexts.",
    },
    {
      id: "model-2",
      name: "janecasual",
      triggerWord: "janecasual",
      thumbnailUrl: "/placeholder.svg?height=100&width=100",
      description: "Ideal for everyday scenarios and casual environments.",
    },
    {
      id: "model-3",
      name: "janecreative",
      triggerWord: "janecreative",
      thumbnailUrl: "/placeholder.svg?height=100&width=100",
      description: "Artistic and creative representations for unique contexts.",
    },
  ])

  // Selected model
  const [selectedModel, setSelectedModel] = useState(models[0].id)
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
  const [generatedImages, setGeneratedImages] = useState([])

  // UI state
  const [showSettings, setShowSettings] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(null)

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

  // Get the selected model details
  const getSelectedModelDetails = () => {
    return models.find((model) => model.id === selectedModel) || models[0]
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
  const enhancePrompt = () => {
    if (!prompt) return

    setIsEnhancingPrompt(true)

    // Simulate API call to enhance the prompt
    setTimeout(() => {
      const modelDetails = getSelectedModelDetails()
      const triggerWord = modelDetails.triggerWord

      // Create an enhanced version of the prompt with the trigger word
      const enhancedPrompt = `${triggerWord}, ${prompt}, ${preset === "photorealistic" ? "photorealistic" : preset} style, high quality, detailed, 8k resolution, professional lighting`
      setPrompt(enhancedPrompt)
      setIsEnhancingPrompt(false)
    }, 1500)
  }

  // Handle image generation
  const generateImages = () => {
    if (!prompt) return

    setIsGenerating(true)

    // Clear previous generated images
    setGeneratedImages([])

    // Simulate API call to generate images
    setTimeout(() => {
      const newImages = Array(imageCount)
        .fill(null)
        .map((_, index) => ({
          src: `/placeholder.svg?height=512&width=512&text=Generated+Image+${index + 1}`,
          prompt: prompt,
        }))

      setGeneratedImages(newImages)
      setIsGenerating(false)
    }, 3000)
  }

  // Handle download
  const handleDownload = (index) => {
    // In a real app, this would trigger a download of the image
    console.log(`Downloading image ${index}`)
  }

  // Handle save to gallery
  const handleSaveToGallery = (index) => {
    // In a real app, this would save the image to the user's gallery
    console.log(`Saving image ${index} to gallery`)
  }

  // Handle regenerate variation
  const handleRegenerateVariation = (index) => {
    // In a real app, this would generate a variation of the selected image
    console.log(`Generating variation of image ${index}`)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
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
    return usageStats.limit - usageStats.used
  }

  // Ref for prompt input
  const promptInputRef = useRef(null)

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
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="bg-gray-900/90 border-gray-700 hover:bg-gray-800 hover:border-[#1eb8cd]/50 text-white rounded-lg"
                  >
                    <User size={16} className="mr-2 text-[#1eb8cd]" />
                    <span className="mr-1">Model:</span>
                    <span className="font-medium text-[#1eb8cd]">{getSelectedModelDetails().name}</span>
                    <ChevronDown size={16} className="ml-2" />
                  </Button>

                  {showModelSelector && (
                    <div className="absolute top-12 left-0 z-50 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-3 w-64">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Select Model</h3>
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id)
                              setShowModelSelector(false)
                            }}
                            className={`flex items-center w-full p-2 rounded-md text-left ${
                              selectedModel === model.id
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
                              <p className="text-xs text-gray-400 truncate">{model.triggerWord}</p>
                            </div>
                            {selectedModel === model.id && <CheckCircle size={16} className="text-[#1eb8cd]" />}
                          </button>
                        ))}
                      </div>
                      <div className="pt-2 mt-2 border-t border-gray-800">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-[#1eb8cd] p-0 h-auto"
                          onClick={() => {
                            setShowModelSelector(false)
                            window.location.href = "/train"
                          }}
                        >
                          <Plus size={14} className="mr-1" />
                          Train New Model
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompt input with magic button */}
                <div className="relative mb-3 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1eb8cd]/20 to-purple-500/20 rounded-xl blur-xl opacity-30 group-focus-within:opacity-50 transition-opacity"></div>
                  <div className="relative flex items-center bg-gray-900/90 backdrop-blur-sm border border-gray-800 hover:border-gray-700 focus-within:border-[#1eb8cd]/50 rounded-xl overflow-hidden transition-all shadow-lg">
                    <Textarea
                      ref={promptInputRef}
                      placeholder="Describe the image you want to generate..."
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
                              disabled={!prompt || isEnhancingPrompt}
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
                            <p>Enhance Prompt</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Button
                        onClick={generateImages}
                        disabled={!prompt || isGenerating}
                        className="rounded-lg bg-[#1eb8cd] hover:bg-[#19a3b6] text-white"
                      >
                        {isGenerating ? (
                          <>
                            <Loader size={16} className="animate-spin mr-2" />
                            Generating...
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
            {(isGenerating || generatedImages.length > 0) && (
              <div>
                <h2 className="text-lg font-medium mb-4">Generated Images</h2>

                {/* Loading placeholders */}
                {isGenerating && (
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
                {!isGenerating && generatedImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {generatedImages.map((image, index) => (
                      <GeneratedImage
                        key={`image-${index}`}
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

