"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, Cpu, ImageIcon, Grid, Bell, Plus, ExternalLink, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { useClerk, useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { fetchUserProfile, fetchUserModels, fetchUserGenerations } from "@/utils/api"

// Badge Component
const Badge = ({ children, variant = "default", className = "" }: { 
  children: React.ReactNode; 
  variant?: "default" | "success" | "warning" | "danger" | "info"; 
  className?: string;
}) => {
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
const Avatar = ({ src, alt = "User avatar", size = "md", className = "" }: {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
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

// Define types for user data
interface UserModel {
  id: string | number;
  name: string;
  status: string;
  progress?: number | null;
  createdAt: string;
}

interface UserImage {
  id: string | number;
  thumbnail: string;
  prompt: string;
  createdAt: string;
}

interface UserData {
  name: string;
  email: string;
  avatarUrl: string;
  plan: string;
  modelsCreated: number;
  modelsLimit: number;
  dailyGenerations: number;
  dailyGenerationsLimit: number;
  models: UserModel[];
  recentImages: UserImage[];
}

export default function Dashboard() {
  const router = useRouter()
  const { signOut } = useClerk()
  const { user, isLoaded: isUserLoaded } = useUser()
  
  // Navigation state
  const [activeNav, setActiveNav] = useState("dashboard")
  
  // User data state
  const [userData, setUserData] = useState<UserData>({
    name: "Loading...",
    email: "",
    avatarUrl: "",
    plan: "free",
    modelsCreated: 0,
    modelsLimit: 5,
    dailyGenerations: 0,
    dailyGenerationsLimit: 20,
    models: [],
    recentImages: [],
  })
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Handle sign out
  const handleSignOut = async () => {
    await signOut(() => router.push("/"))
  }

  // Fetch user data from the API
  useEffect(() => {
    async function loadUserData() {
      if (!isUserLoaded || !user) return
      
      try {
        setIsLoading(true)
        setError("")
        
        // Fetch user profile data
        const profileData = await fetchUserProfile()
        
        if (!profileData.success) {
          console.error("Profile data error:", profileData.error)
          toast.error(profileData.error || "Failed to fetch profile data")
          setError(profileData.error || "Failed to load user profile")
          setIsLoading(false)
          return
        }
        
        // Fetch recent models (limited to 2)
        const modelsData = await fetchUserModels({ limit: 2, page: 1 })
        
        // Fetch recent generations (limited to 4)
        const generationsData = await fetchUserGenerations({ limit: 4, page: 1, modelId: undefined })
        
        // Update user data state with fetched information
        setUserData({
          name: user.firstName || user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || "User",
          email: user.emailAddresses[0]?.emailAddress || "",
          avatarUrl: user.imageUrl || "",
          plan: profileData.profile?.subscription?.status || "free",
          modelsCreated: profileData.profile?.stats?.models || 0,
          modelsLimit: profileData.profile?.quotas?.models?.total || 5,
          dailyGenerations: profileData.profile?.quotas?.generations?.used || 0,
          dailyGenerationsLimit: profileData.profile?.quotas?.generations?.total || 20,
          models: modelsData.models?.map((model: any) => ({
            id: model.id,
            name: model.name,
            status: model.status,
            progress: model.progress || null,
            createdAt: new Date(model.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          })) || [],
          recentImages: generationsData.generations?.map((generation: any) => ({
            id: generation.id,
            thumbnail: generation.image_url,
            prompt: generation.prompt,
            createdAt: new Date(generation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          })) || [],
        })
      } catch (err) {
        console.error("Error fetching user data:", err)
        toast.error("Failed to load user data. Please try again later.")
        setError("Failed to load user data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserData()
  }, [isUserLoaded, user])

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
    { id: "train-model", label: "Train Model", icon: <Cpu size={20} />, href: "/train" },
    { id: "generate-images", label: "Generate Images", icon: <ImageIcon size={20} />, href: "/generate" },
    { id: "gallery", label: "Gallery", icon: <Grid size={20} />, href: "/gallery" },
  ]

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
            <Avatar src={userData.avatarUrl} alt={userData.name} />
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{userData.name}</p>
              <Badge variant={userData.plan === "premium" ? "success" : "default"}>
                {userData.plan === "premium" ? "Premium" : "Free"}
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
        <header className="sticky top-0 z-10 bg-black border-b border-gray-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center">
                <Badge variant="info" className="mr-2">
                  {userData.plan === "premium" ? "Premium" : "Free"}
                </Badge>
                <span className="text-sm text-gray-400">Quota Reset in 10:45:33</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="bg-[#222] hover:bg-[#333] border-[#444] h-9 w-9 rounded-full relative"
              >
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Error message */}
          {error && (
            <Card className="mb-6 bg-black border-[#333]/50 border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <p className="text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1eb8cd]"></div>
            </div>
          )}
          
          {/* Content (only shown when not loading) */}
          {!isLoading && (
            <>
              {/* Upgrade banner */}
              {userData.plan === "free" && (
                <Card className="mb-6 bg-black border-[#333]/50 border-l-4 border-l-[#1eb8cd]">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Upgrade to Premium</h3>
                      <p className="text-gray-400 text-sm">
                        Unlock unlimited models, faster generation, and priority support!
                      </p>
                    </div>
                    <Button className="bg-[#1eb8cd] hover:bg-[#19a3b6]">Upgrade Now</Button>
                  </CardContent>
                </Card>
              )}

              {/* Usage stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="bg-black border-[#333]/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Models Usage</h3>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Models Created</span>
                      <span>
                        {userData.modelsCreated} / {userData.modelsLimit}
                      </span>
                    </div>
                    <Progress value={(userData.modelsCreated / userData.modelsLimit) * 100} className="h-2 mb-4" />
                    <div className="text-xs text-gray-400">
                      {userData.plan === "free" ? "Upgrade to create unlimited models" : "Unlimited models available"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-black border-[#333]/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Daily Generations</h3>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Images Today</span>
                      <span>
                        {userData.dailyGenerations} / {userData.dailyGenerationsLimit}
                      </span>
                    </div>
                    <Progress
                      value={(userData.dailyGenerations / userData.dailyGenerationsLimit) * 100}
                      className="h-2 mb-4"
                    />
                    <div className="text-xs text-gray-400">
                      {userData.plan === "free" ? "Upgrade for more daily generations" : "High-priority processing"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Button className="flex items-center justify-center py-6 bg-[#1eb8cd] hover:bg-[#19a3b6]" asChild>
                  <Link href="/train">
                    <Plus className="mr-2 h-5 w-5" />
                    <span>Create New Model</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center py-6 bg-[#222] hover:bg-[#333] text-white border-[#444]"
                  asChild
                >
                  <Link href="/generate">
                    <ImageIcon className="mr-2 h-5 w-5" />
                    <span>Generate New Image</span>
                  </Link>
                </Button>
              </div>

              {/* Your models */}
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-4">Your Models</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.models.map((model) => (
                    <Card
                      key={model.id}
                      className="bg-black border-[#333]/50 hover:border-[#1eb8cd]/50 transition-colors cursor-pointer"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{model.name}</h4>
                          <Badge variant={model.status === "Ready" ? "success" : "warning"}>{model.status}</Badge>
                        </div>
                        {model.status === "Training" && model.progress && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">Training progress</span>
                              <span>{model.progress}%</span>
                            </div>
                            <Progress value={model.progress} className="h-2" />
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">Created on {model.createdAt}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent generations */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Recent Generations</h3>
                  <Link href="/gallery" className="text-sm text-[#1eb8cd] hover:text-[#7fdce8] flex items-center">
                    View All
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {userData.recentImages.map((image) => (
                    <Card
                      key={image.id}
                      className="bg-black border-[#333]/50 overflow-hidden hover:border-[#1eb8cd]/50 transition-colors cursor-pointer"
                    >
                      <div className="h-32 bg-[#222] overflow-hidden">
                        <Image
                          src={image.thumbnail || "/placeholder.svg"}
                          alt={image.prompt}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium truncate">{image.prompt}</p>
                        <p className="text-xs text-gray-400">{image.createdAt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

