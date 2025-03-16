"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Home,
  Cpu,
  ImageIcon,
  Grid,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  X,
  Plus,
  Bookmark,
  BookmarkCheck,
  Maximize2,
  ArrowUpDown,
  LogOut,
} from "lucide-react"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchUserProfile, fetchUserGenerations, fetchUserModels } from "@/utils/api"
import { toast } from "react-toastify"

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

// Gallery Image Component
const GalleryImage = ({
  id,
  src,
  alt,
  prompt,
  date,
  model,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDownload,
  onDelete,
  onBookmark,
  isBookmarked,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative group rounded-lg overflow-hidden border ${
        isSelected ? "border-[#1eb8cd] ring-2 ring-[#1eb8cd]/20" : "border-gray-800/50 hover:border-gray-700"
      } transition duration-200`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(id)}
          className="bg-black/50 data-[state=checked]:bg-[#1eb8cd] data-[state=checked]:text-white border-gray-600"
        />
      </div>

      {/* Bookmark button */}
      <button
        className={`absolute top-2 right-2 z-10 p-1 rounded-full ${
          isBookmarked
            ? "bg-[#1eb8cd]/20 text-[#1eb8cd]"
            : "bg-black/50 text-gray-400 opacity-0 group-hover:opacity-100"
        } transition-opacity duration-200`}
        onClick={() => onBookmark(id, !isBookmarked)}
      >
        {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      </button>

      {/* Image */}
      <div className="aspect-square bg-gray-900 relative">
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          onClick={() => onView(id)}
        />

        {/* Image overlay with actions (visible on hover) */}
        <div
          className={`absolute inset-0 bg-black/70 flex items-center justify-center gap-2 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/30 hover:bg-black/50 hover:text-white"
            onClick={() => onView(id)}
          >
            <Maximize2 size={16} />
            <span className="sr-only">View</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/30 hover:bg-black/50 hover:text-white"
            onClick={() => onDownload(id)}
          >
            <Download size={16} />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/30 hover:bg-black/50 hover:text-white"
            onClick={() => onEdit(id)}
          >
            <Edit size={16} />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/30 hover:bg-black/50 text-red-400 hover:text-red-500"
            onClick={() => onDelete(id)}
          >
            <Trash2 size={16} />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>

      {/* Image info */}
      <div className="p-2 border-t border-gray-800/50">
        <p className="text-sm text-white line-clamp-1" title={prompt}>
          {prompt}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">{date}</p>
          <Badge variant="info" className="text-xs bg-[#1eb8cd]/20 text-[#1eb8cd]">
            {model}
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Empty State Component
const EmptyState = ({ onGenerateImages }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
        <ImageIcon size={24} className="text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No images yet</h3>
      <p className="text-gray-400 max-w-md mb-6">
        Start generating amazing AI images with your custom models or explore our gallery for inspiration.
      </p>
      <Button className="bg-[#1eb8cd] hover:bg-[#19a3b6]" size="lg" onClick={onGenerateImages}>
        <Plus size={18} className="mr-2" />
        Generate Images
      </Button>
    </div>
  )
}

// Bulk Action Menu Component
const BulkActionMenu = ({ selectedCount, onDownload, onDelete, onClearSelection }) => {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 py-2 px-4 flex items-center space-x-4">
      <span className="text-white text-sm">
        {selectedCount} {selectedCount === 1 ? "image" : "images"} selected
      </span>
      <Separator orientation="vertical" className="h-4" />
      <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700" onClick={onDownload}>
        <Download size={16} className="mr-2" />
        Download
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-400 hover:text-red-500 hover:bg-gray-700"
        onClick={onDelete}
      >
        <Trash2 size={16} className="mr-2" />
        Delete
      </Button>
      <Separator orientation="vertical" className="h-4" />
      <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700" onClick={onClearSelection}>
        <X size={16} className="mr-2" />
        Clear
      </Button>
    </div>
  )
}

export default function GalleryPage() {
  // Navigation state
  const [activeNav, setActiveNav] = useState("gallery")
  const router = useRouter()
  const { signOut } = useClerk()
  const { user, isLoaded: isUserLoaded } = useUser()

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    avatarUrl: "",
    plan: "free",
  })

  // Gallery state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedImages, setSelectedImages] = useState([])
  const [sortBy, setSortBy] = useState("newest")
  const [activeTab, setActiveTab] = useState("all")
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [viewingImage, setViewingImage] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [imagesToDelete, setImagesToDelete] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Gallery images
  const [images, setImages] = useState([])
  const [userModels, setUserModels] = useState([])

  // Load user data and images
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
        })
        
        // Load user models and generations
        await Promise.all([
          loadUserModels(),
          loadUserGenerations()
        ])
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
      const modelsData = await fetchUserModels({ limit: 10, page: 1 })
      
      if (modelsData.models && modelsData.models.length > 0) {
        setUserModels(modelsData.models.map(model => ({
          id: model.id,
          name: model.name || model.trigger_word,
          triggerWord: model.trigger_word
        })))
      }
    } catch (error) {
      console.error("Error loading user models:", error)
    }
  }

  // Load user generations
  async function loadUserGenerations() {
    try {
      const generationsData = await fetchUserGenerations({ limit: 100, page: 1 })
      
      if (generationsData.generations && generationsData.generations.length > 0) {
        const mappedImages = generationsData.generations.map(gen => ({
          id: gen.id,
          src: gen.image_url || "/placeholder.svg?height=400&width=400&text=Image",
          alt: "Generated image",
          prompt: gen.prompt,
          date: new Date(gen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          model: gen.model_id,
          isBookmarked: gen.is_bookmarked || false,
        }))
        
        setImages(mappedImages)
      }
    } catch (error) {
      console.error("Error loading user generations:", error)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    await signOut(() => router.push("/"))
  }

  // Filter models for the filter panel
  const availableModels = [
    { id: "jane123", name: "jane123" },
    { id: "janecasual", name: "janecasual" },
    { id: "janecreative", name: "janecreative" },
    { id: "janeadventure", name: "janeadventure" },
  ]

  // Filter state
  const [filters, setFilters] = useState({
    dateRange: { from: "", to: "" },
    selectedModels: [],
    onlyFavorites: false,
  })

  // Navigation items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
    { id: "train-model", label: "Train Model", icon: <Cpu size={20} />, href: "/train" },
    { id: "generate-images", label: "Generate Images", icon: <ImageIcon size={20} />, href: "/generate" },
    { id: "gallery", label: "Gallery", icon: <Grid size={20} />, href: "/gallery" },
  ]

  // Handle image selection
  const handleSelectImage = (id) => {
    if (selectedImages.includes(id)) {
      setSelectedImages(selectedImages.filter((imageId) => imageId !== id))
    } else {
      setSelectedImages([...selectedImages, id])
    }
  }

  // Handle select all images
  const handleSelectAll = () => {
    if (selectedImages.length === filteredImages.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(filteredImages.map((image) => image.id))
    }
  }

  // Handle image view
  const handleViewImage = (id) => {
    setViewingImage(images.find((image) => image.id === id))
  }

  // Handle image edit (redirect to generate page with reference)
  const handleEditImage = (id) => {
    // In a real app, this would redirect to the generate page with the image as reference
    console.log(`Edit image ${id}`)
    window.location.href = `/generate?reference=${id}`
  }

  // Handle image download
  const handleDownloadImage = (id) => {
    // In a real app, this would trigger a download of the image
    console.log(`Download image ${id}`)
  }

  // Handle bulk download
  const handleBulkDownload = () => {
    // In a real app, this would trigger a download of all selected images
    console.log(`Download ${selectedImages.length} images`)
  }

  // Handle image delete
  const handleDeleteImage = (id) => {
    setImagesToDelete([id])
    setShowDeleteDialog(true)
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    setImagesToDelete(selectedImages)
    setShowDeleteDialog(true)
  }

  // Confirm delete
  const confirmDelete = () => {
    setImages(images.filter((image) => !imagesToDelete.includes(image.id)))
    setSelectedImages(selectedImages.filter((id) => !imagesToDelete.includes(id)))
    setShowDeleteDialog(false)
    setImagesToDelete([])

    if (viewingImage && imagesToDelete.includes(viewingImage.id)) {
      setViewingImage(null)
    }
  }

  // Handle bookmark toggle
  const handleBookmarkToggle = (id, isBookmarked) => {
    setImages(images.map((image) => (image.id === id ? { ...image, isBookmarked } : image)))
  }

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedImages([])
  }

  // Handle apply filters
  const handleApplyFilters = () => {
    console.log("Applying filters:", filters)
    setIsFilterPanelOpen(false)
  }

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      dateRange: { from: "", to: "" },
      selectedModels: [],
      onlyFavorites: false,
    })
  }

  // Handle navigate to generate page
  const handleNavigateToGenerate = () => {
    window.location.href = "/generate"
  }

  // Filter images based on search query, tab, and filters
  const filteredImages = images.filter((image) => {
    // Filter by search query
    if (searchQuery && !image.prompt.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Filter by tab
    if (activeTab === "favorites" && !image.isBookmarked) {
      return false
    }

    // Filter by selected models
    if (filters.selectedModels.length > 0 && !filters.selectedModels.includes(image.model)) {
      return false
    }

    // Filter by favorites
    if (filters.onlyFavorites && !image.isBookmarked) {
      return false
    }

    return true
  })

  // Sort images
  const sortedImages = [...filteredImages].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date) - new Date(a.date)
    } else {
      return new Date(a.date) - new Date(b.date)
    }
  })

  // Toggle model selection in filters
  const toggleModelFilter = (modelId) => {
    if (filters.selectedModels.includes(modelId)) {
      setFilters({
        ...filters,
        selectedModels: filters.selectedModels.filter((id) => id !== modelId),
      })
    } else {
      setFilters({
        ...filters,
        selectedModels: [...filters.selectedModels, modelId],
      })
    }
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Gallery</h1>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex bg-[#222] hover:bg-[#333] border-[#444] text-white"
                onClick={handleNavigateToGenerate}
              >
                <Plus size={16} className="mr-2" />
                Generate New
              </Button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Gallery controls */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="relative w-full sm:w-auto max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                  <Input
                    type="text"
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-10 bg-gray-900 border-gray-700 text-white w-full"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-gray-600"
                      >
                        <Filter size={16} className="mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-gray-900 border-gray-800 text-white">
                      <SheetHeader>
                        <SheetTitle className="text-white">Filters</SheetTitle>
                        <SheetDescription className="text-gray-400">
                          Filter your gallery images by various criteria.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="py-4 space-y-6">
                        <div>
                          <h4 className="text-white font-medium mb-3">Date Range</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="date-from">From</Label>
                              <Input
                                id="date-from"
                                type="date"
                                value={filters.dateRange.from}
                                onChange={(e) =>
                                  setFilters({
                                    ...filters,
                                    dateRange: { ...filters.dateRange, from: e.target.value },
                                  })
                                }
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                            </div>
                            <div>
                              <Label htmlFor="date-to">To</Label>
                              <Input
                                id="date-to"
                                type="date"
                                value={filters.dateRange.to}
                                onChange={(e) =>
                                  setFilters({
                                    ...filters,
                                    dateRange: { ...filters.dateRange, to: e.target.value },
                                  })
                                }
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-medium mb-3">Models</h4>
                          <div className="space-y-2">
                            {availableModels.map((model) => (
                              <div key={model.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`model-${model.id}`}
                                  checked={filters.selectedModels.includes(model.id)}
                                  onCheckedChange={() => toggleModelFilter(model.id)}
                                  className="data-[state=checked]:bg-[#1eb8cd] data-[state=checked]:text-white border-gray-600"
                                />
                                <Label htmlFor={`model-${model.id}`} className="text-sm text-gray-300 cursor-pointer">
                                  {model.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-medium mb-3">Additional Filters</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="only-favorites"
                                checked={filters.onlyFavorites}
                                onCheckedChange={(checked) =>
                                  setFilters({
                                    ...filters,
                                    onlyFavorites: checked,
                                  })
                                }
                                className="data-[state=checked]:bg-[#1eb8cd] data-[state=checked]:text-white border-gray-600"
                              />
                              <Label htmlFor="only-favorites" className="text-sm text-gray-300 cursor-pointer">
                                Only show favorites
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <SheetFooter>
                        <Button variant="outline" onClick={handleResetFilters}>
                          Reset
                        </Button>
                        <Button className="bg-[#1eb8cd] hover:bg-[#19a3b6]" onClick={handleApplyFilters}>
                          Apply Filters
                        </Button>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-gray-600"
                      >
                        <ArrowUpDown size={16} className="mr-2" />
                        {sortBy === "newest" ? "Newest First" : "Oldest First"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white">
                      <DropdownMenuItem
                        className={sortBy === "newest" ? "bg-gray-800 text-[#1eb8cd]" : ""}
                        onClick={() => setSortBy("newest")}
                      >
                        Newest First
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={sortBy === "oldest" ? "bg-gray-800 text-[#1eb8cd]" : ""}
                        onClick={() => setSortBy("oldest")}
                      >
                        Oldest First
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-gray-900 border-b border-gray-800 w-full justify-start h-auto p-0 rounded-none">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:text-[#1eb8cd] data-[state=active]:border-b-2 data-[state=active]:border-[#1eb8cd] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-4 py-2"
                  >
                    All Images
                  </TabsTrigger>
                  <TabsTrigger
                    value="favorites"
                    className="data-[state=active]:text-[#1eb8cd] data-[state=active]:border-b-2 data-[state=active]:border-[#1eb8cd] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none px-4 py-2"
                  >
                    Favorites
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Selection controls */}
            {sortedImages.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Checkbox
                    id="select-all"
                    checked={selectedImages.length > 0 && selectedImages.length === sortedImages.length}
                    onCheckedChange={handleSelectAll}
                    className="mr-2 data-[state=checked]:bg-[#1eb8cd] data-[state=checked]:text-white border-gray-600"
                  />
                  <Label htmlFor="select-all" className="text-sm text-gray-300 cursor-pointer">
                    {selectedImages.length > 0
                      ? `Selected ${selectedImages.length} of ${sortedImages.length}`
                      : "Select All"}
                  </Label>
                </div>

                {selectedImages.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-gray-600"
                      onClick={handleBulkDownload}
                    >
                      <Download size={16} className="mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-gray-600 text-red-400 hover:text-red-500"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Gallery content */}
            {sortedImages.length === 0 ? (
              <EmptyState onGenerateImages={handleNavigateToGenerate} />
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`}>
                {sortedImages.map((image) => (
                  <GalleryImage
                    key={image.id}
                    id={image.id}
                    src={image.src}
                    alt={image.alt}
                    prompt={image.prompt}
                    date={image.date}
                    model={image.model}
                    isSelected={selectedImages.includes(image.id)}
                    onSelect={handleSelectImage}
                    onView={handleViewImage}
                    onEdit={handleEditImage}
                    onDownload={handleDownloadImage}
                    onDelete={handleDeleteImage}
                    onBookmark={handleBookmarkToggle}
                    isBookmarked={image.isBookmarked}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Image Viewer Dialog */}
      {viewingImage && (
        <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
          <DialogContent className="bg-black border border-gray-800/50 text-white max-w-6xl">
            <DialogHeader>
              <DialogTitle>Image Details</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="md:w-2/3 bg-gray-900 p-2">
                <div className="relative">
                  <img
                    src={viewingImage.src || "/placeholder.svg"}
                    alt={viewingImage.alt}
                    className="w-full h-auto object-contain max-h-[70vh]"
                  />
                </div>
              </div>

              {/* Image details */}
              <div className="md:w-1/3 p-4">
                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-1">Prompt</h4>
                  <p className="text-white">{viewingImage.prompt}</p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-1">Model</h4>
                  <Badge variant="info" className="bg-[#1eb8cd]/20 text-[#1eb8cd]">
                    {viewingImage.model}
                  </Badge>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-1">Created</h4>
                  <p className="text-white">{viewingImage.date}</p>
                </div>

                <div className="space-y-2 mt-6">
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 hover:bg-gray-800 hover:border-gray-600"
                    onClick={() => handleDownloadImage(viewingImage.id)}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>

                  <Button
                    className={`w-full ${viewingImage.isBookmarked ? "bg-[#1eb8cd] hover:bg-[#19a3b6]" : "bg-gray-800 hover:bg-gray-700"}`}
                    onClick={() => {
                      handleBookmarkToggle(viewingImage.id, !viewingImage.isBookmarked)
                      setViewingImage({ ...viewingImage, isBookmarked: !viewingImage.isBookmarked })
                    }}
                  >
                    {viewingImage.isBookmarked ? (
                      <>
                        <BookmarkCheck size={16} className="mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark size={16} className="mr-2" />
                        Save to Favorites
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-gray-700 hover:bg-gray-800 hover:border-gray-600"
                    onClick={() => {
                      handleEditImage(viewingImage.id)
                      setViewingImage(null)
                    }}
                  >
                    <Edit size={16} className="mr-2" />
                    Use as Reference
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-gray-700 hover:bg-gray-800 hover:border-gray-600 text-red-400 hover:text-red-500"
                    onClick={() => {
                      handleDeleteImage(viewingImage.id)
                      setViewingImage(null)
                    }}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete{" "}
              {imagesToDelete.length === 1 ? "this image" : `these ${imagesToDelete.length} images`}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-700 hover:bg-gray-800 hover:border-gray-600"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Menu */}
      <BulkActionMenu
        selectedCount={selectedImages.length}
        onDownload={handleBulkDownload}
        onDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
      />
    </div>
  )
}

