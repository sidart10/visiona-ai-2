"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import {
  Home,
  Cpu,
  ImageIcon,
  Grid,
  User,
  Camera,
  LogOut,
  CreditCard,
  Key,
  Trash2,
  Save,
  Bell,
  Info,
  ChevronRight,
  Copy,
  Download,
  X,
  Check,
  Shield,
  HelpCircle,
  MessageCircle,
  Mail,
} from "lucide-react"
import { Search, BookOpen, ChevronDown, ChevronUp, ExternalLink, Video, FileText, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { fetchUserProfile } from "@/utils/api"
import { toast } from "react-toastify"

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

export default function AccountPage() {
  // Navigation state
  const [activeNav, setActiveNav] = useState("settings")
  const router = useRouter()
  const { signOut } = useClerk()
  const { user, isLoaded: isUserLoaded } = useUser()

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    avatarUrl: "",
    plan: "free",
    notifications: {
      email: true,
      modelCompletion: true,
      marketingUpdates: false,
    },
    apiKey: "vsk_live_************", // Initially masked
  })
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Payment method state (mock data)
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: "pm_1",
      type: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2024,
      isDefault: true,
    },
  ])

  // Active section state
  const [activeSection, setActiveSection] = useState("profile")

  // Subscription state
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("premium")
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  })

  // Help Dialog States
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [showFaqDialog, setShowFaqDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)

  // Help and support state
  const [searchQuery, setSearchQuery] = useState("")
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    category: "general",
  })
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Load user data 
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
        
        // Update user profile state
        const userName = user.firstName 
          ? `${user.firstName} ${user.lastName || ''}`.trim() 
          : user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || "User"
        
        const userEmail = user.emailAddresses[0]?.emailAddress || ""
        
        setUserProfile({
          name: userName,
          email: userEmail,
          avatarUrl: user.imageUrl || "",
          plan: profileData.profile?.subscription?.status || "free",
          notifications: {
            email: true,
            modelCompletion: true,
            marketingUpdates: false,
          },
          apiKey: "vsk_live_************", // Keep it masked
        })
        
        // Update form state
        setProfileForm({
          name: userName,
          email: userEmail,
        })
      } catch (error) {
        console.error("Error loading user data:", error)
        toast.error("Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserData()
  }, [isUserLoaded, user])

  // Handle sign out
  const handleSignOut = async () => {
    await signOut(() => router.push("/"))
  }

  // Handlers
  const handleProfileSubmit = (e) => {
    e.preventDefault()
    // Update profile logic would go here
    setUserProfile({
      ...userProfile,
      name: profileForm.name,
      email: profileForm.email,
    })
    // Show success notification logic
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    // Password update logic would go here
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    // Show success notification logic
  }

  const handleNotificationToggle = (key) => {
    setUserProfile({
      ...userProfile,
      notifications: {
        ...userProfile.notifications,
        [key]: !userProfile.notifications[key],
      },
    })
  }

  const regenerateApiKey = () => {
    // API key regeneration logic would go here
    setUserProfile({
      ...userProfile,
      apiKey: "vsk_live_" + Math.random().toString(36).substring(2, 15),
    })
    // Show success notification logic
  }

  const handleDeletePaymentMethod = (id) => {
    // Delete payment method logic would go here
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // Show success notification logic
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
  }

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle)
  }

  const handleChangePlan = () => {
    setShowPlanDialog(true)
  }

  const handleUpdatePayment = () => {
    setShowPaymentDialog(true)
  }

  const calculateAnnualSavings = () => {
    return (19.99 * 12 - 199.99).toFixed(2)
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} />, href: "/dashboard" },
    { id: "train-model", label: "Train Model", icon: <Cpu size={20} />, href: "/train" },
    { id: "generate-images", label: "Generate Images", icon: <ImageIcon size={20} />, href: "/generate" },
    { id: "gallery", label: "Gallery", icon: <Grid size={20} />, href: "/gallery" },
  ]

  const settingsSections = [
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "billing", label: "Billing & Plan", icon: <CreditCard size={18} /> },
    { id: "security", label: "Security", icon: <Key size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "api", label: "API Access", icon: <Cpu size={18} /> },
  ]

  // FAQ Data
  const faqData = [
    {
      question: "How do I train my first AI model?",
      answer: (
        <>
          <p>Training your first AI model with Visiona is simple:</p>
          <ol className="list-decimal list-inside pl-4 mt-2 space-y-1">
            <li>Navigate to the "Train Model" section</li>
            <li>Upload 10-20 clear photos of yourself (front-facing with good lighting)</li>
            <li>Choose a unique trigger word that will be used to generate images</li>
            <li>Click "Start Training" and wait for the process to complete (typically 5-10 minutes)</li>
          </ol>
          <p className="mt-2">You'll receive a notification when your model is ready to use!</p>
        </>
      ),
    },
    {
      question: "What types of photos work best for training?",
      answer: (
        <>
          <p>For optimal training results, use photos that:</p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>Show your face clearly (front-facing preferred)</li>
            <li>Have good, even lighting</li>
            <li>Include different expressions and angles (but not extreme angles)</li>
            <li>Have neutral or simple backgrounds</li>
            <li>Avoid heavy filters or editing</li>
          </ul>
          <p className="mt-2">Including 10-20 diverse photos will help create a more versatile AI model.</p>
        </>
      ),
    },
    {
      question: "How many images can I generate per day?",
      answer: (
        <>
          <p>Your image generation limits depend on your subscription tier:</p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>
              <strong>Free tier:</strong> 20 images per day
            </li>
            <li>
              <strong>Premium tier:</strong> 100 images per day
            </li>
            <li>
              <strong>Professional tier:</strong> Unlimited images
            </li>
          </ul>
          <p className="mt-2">
            Usage counters reset at midnight UTC. Unused generations do not roll over to the next day.
          </p>
        </>
      ),
    },
    {
      question: "Why are my generated images not looking like me?",
      answer: (
        <>
          <p>If your generated images don't resemble you accurately, try these troubleshooting steps:</p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>Ensure you've uploaded enough clear, well-lit photos (10-20 recommended)</li>
            <li>Use your exact trigger word in the prompt</li>
            <li>Avoid complex prompts with conflicting descriptions</li>
            <li>Try adjusting the guidance scale (higher values stick closer to your appearance)</li>
            <li>Create a new model with better quality photos if necessary</li>
          </ul>
          <p className="mt-2">Remember that more specific prompts tend to work better than vague ones.</p>
        </>
      ),
    },
    {
      question: "How do I cancel my subscription?",
      answer: (
        <>
          <p>To cancel your subscription:</p>
          <ol className="list-decimal list-inside pl-4 mt-2 space-y-1">
            <li>Go to Account Settings</li>
            <li>Select "Billing & Plan"</li>
            <li>Click on "Cancel Subscription"</li>
            <li>Follow the confirmation steps</li>
          </ol>
          <p className="mt-2">
            Your subscription will remain active until the end of your current billing period. After cancellation, your
            account will revert to the free tier.
          </p>
        </>
      ),
    },
    {
      question: "What payment methods do you accept?",
      answer: (
        <>
          <p>Visiona accepts the following payment methods:</p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1">
            <li>All major credit cards (Visa, Mastercard, American Express, Discover)</li>
            <li>PayPal</li>
            <li>Apple Pay (on supported devices)</li>
            <li>Google Pay (on supported devices)</li>
          </ul>
          <p className="mt-2">
            All payments are securely processed through Stripe, and we never store your complete payment information.
          </p>
        </>
      ),
    },
  ]

  // Help categories
  const helpCategories = [
    {
      title: "Using Visiona",
      description: "Learn how to use the platform and create your first AI model",
      icon: <BookOpen size={24} className="text-[#1eb8cd]" />,
    },
    {
      title: "Troubleshooting",
      description: "Solutions for common issues and error messages",
      icon: <AlertTriangle size={24} className="text-[#1eb8cd]" />,
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides for all features",
      icon: <Video size={24} className="text-[#1eb8cd]" />,
    },
    {
      title: "Billing & Account",
      description: "Questions about subscriptions, payments, and account settings",
      icon: <FileText size={24} className="text-[#1eb8cd]" />,
    },
  ]

  // Knowledge base articles
  const knowledgeBaseArticles = [
    {
      id: "kb001",
      title: "Getting Started with Visiona",
      excerpt: "Learn the basics of creating your first AI model and generating images.",
      category: "Basics",
    },
    {
      id: "kb002",
      title: "Advanced Prompt Engineering",
      excerpt: "Techniques to craft detailed prompts that produce better results.",
      category: "Advanced",
    },
    {
      id: "kb003",
      title: "Troubleshooting Common Generation Issues",
      excerpt: "Solutions for common problems with image generation quality.",
      category: "Troubleshooting",
    },
  ]

  // Handle contact form submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Contact form submission logic would go here
    console.log("Contact form submitted", contactForm)
    // Reset form and close dialog
    setContactForm({
      subject: "",
      message: "",
      category: "general",
    })
    setShowContactDialog(false)
    // Show success notification logic
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
          <div className="flex items-center mb-4 p-2 rounded-md bg-gray-800/20">
            <Avatar size="md" alt={userProfile.name} />
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{userProfile.name}</p>
              <Badge
                variant={userProfile.plan === "premium" ? "success" : "default"}
                className="bg-[#1eb8cd]/20 text-[#1eb8cd]"
              >
                {userProfile.plan === "premium" ? "Premium" : "Free"}
              </Badge>
            </div>
          </div>
          <Button
            className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Account Settings</h1>
            <div className="flex items-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-gray-900/80 border-gray-700 hover:bg-gray-800 hover:border-gray-600 rounded-full h-9 w-9"
                    >
                      <Bell className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notifications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Settings Navigation */}
            <div className="md:col-span-1">
              <Card className="bg-black border-gray-800/50">
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {settingsSections.map((section) => (
                      <button
                        key={section.id}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                          activeSection === section.id
                            ? "text-[#1eb8cd] bg-[#1eb8cd]/10"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        }`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{section.icon}</span>
                          <span>{section.label}</span>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              <div className="mt-6">
                <Card className="bg-black border-gray-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <Info size={20} className="text-[#1eb8cd] mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">Need help?</h4>
                        <p className="text-xs text-gray-400 mb-2">
                          Check our documentation or contact support for assistance.
                        </p>
                        <div className="space-y-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs border-gray-700 hover:bg-gray-800 hover:border-[#1eb8cd]"
                            onClick={() => setShowHelpDialog(true)}
                          >
                            <HelpCircle size={14} className="mr-2 text-[#1eb8cd]" />
                            Help Center
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs border-gray-700 hover:bg-gray-800 hover:border-[#1eb8cd]"
                            onClick={() => setShowFaqDialog(true)}
                          >
                            <MessageCircle size={14} className="mr-2 text-[#1eb8cd]" />
                            FAQs
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs border-gray-700 hover:bg-gray-800 hover:border-[#1eb8cd]"
                            onClick={() => setShowContactDialog(true)}
                          >
                            <Mail size={14} className="mr-2 text-[#1eb8cd]" />
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main settings area */}
            <div className="md:col-span-2 space-y-6">
              {/* Profile Section */}
              {activeSection === "profile" && (
                <Card className="bg-black border-gray-800/50">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit}>
                      <div className="flex items-center mb-6">
                        <Avatar size="lg" alt={userProfile.name} />
                        <div className="ml-4">
                          <Button variant="secondary" size="sm" className="bg-gray-800 hover:bg-gray-700 text-white">
                            <Camera size={14} className="mr-2" />
                            Change Photo
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            required
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            required
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button type="submit" className="bg-[#1eb8cd] hover:bg-[#19a3b6] text-white">
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Security */}
              {activeSection === "security" && (
                <Card className="bg-black border-gray-800/50">
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit}>
                      <div className="mb-4">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          required
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button type="submit" className="bg-[#1eb8cd] hover:bg-[#19a3b6] text-white">
                          <Key size={16} className="mr-2" />
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Notifications */}
              {activeSection === "notifications" && (
                <Card className="bg-black border-gray-800/50">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-white">Email Notifications</h4>
                          <p className="text-xs text-gray-400">Receive email updates about your account</p>
                        </div>
                        <Switch
                          checked={userProfile.notifications.email}
                          onCheckedChange={() => handleNotificationToggle("email")}
                        />
                      </div>

                      <Separator className="bg-gray-800/50" />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-white">Model Training Completion</h4>
                          <p className="text-xs text-gray-400">Get notified when your AI model training completes</p>
                        </div>
                        <Switch
                          checked={userProfile.notifications.modelCompletion}
                          onCheckedChange={() => handleNotificationToggle("modelCompletion")}
                        />
                      </div>

                      <Separator className="bg-gray-800/50" />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-white">Marketing Updates</h4>
                          <p className="text-xs text-gray-400">Receive news and promotional offers</p>
                        </div>
                        <Switch
                          checked={userProfile.notifications.marketingUpdates}
                          onCheckedChange={() => handleNotificationToggle("marketingUpdates")}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Billing & Plan */}
              {activeSection === "billing" && (
                <div className="space-y-6">
                  <Card className="bg-black border-gray-800/50">
                    <CardHeader>
                      <CardTitle>Subscription & Billing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-medium text-white">Current Plan</h4>
                            <div className="flex items-center mt-1">
                              <Badge className="mr-2 bg-[#1eb8cd]/20 text-[#1eb8cd]">Premium</Badge>
                              <span className="text-xs text-gray-400">Renews on April 15, 2025</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Badge className="bg-gray-800 text-gray-300 flex items-center">
                                <Cpu size={12} className="mr-1" />
                                Unlimited models
                              </Badge>
                              <Badge className="bg-gray-800 text-gray-300 flex items-center">
                                <ImageIcon size={12} className="mr-1" />
                                100 generations/day
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleUpdatePayment}
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              <CreditCard size={14} className="mr-2" />
                              Update Payment
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleChangePlan}
                              className="border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10"
                            >
                              Change Plan
                            </Button>
                          </div>
                        </div>

                        <Separator className="bg-gray-800/50" />

                        <h4 className="text-sm font-medium text-white mt-4 mb-2">Payment Methods</h4>

                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className="flex items-center justify-between bg-gray-900/30 p-3 rounded-md mb-2"
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs mr-3">
                                {method.type.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm text-white">•••• {method.last4}</p>
                                <p className="text-xs text-gray-400">
                                  Expires {method.expMonth}/{method.expYear}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-500/10"
                              onClick={() => handleDeletePaymentMethod(method.id)}
                            >
                              <Trash2 size={14} className="mr-2" />
                              Remove
                            </Button>
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                          onClick={handleUpdatePayment}
                        >
                          <CreditCard size={14} className="mr-2" />
                          Add Payment Method
                        </Button>
                      </div>

                      <Separator className="bg-gray-800/50" />

                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-white mb-3">Billing History</h4>
                        <div className="space-y-3">
                          {[
                            { date: "Mar 1, 2025", amount: "$19.99", status: "Paid" },
                            { date: "Feb 1, 2025", amount: "$19.99", status: "Paid" },
                            { date: "Jan 1, 2025", amount: "$19.99", status: "Paid" },
                          ].map((invoice, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-b-0"
                            >
                              <div>
                                <p className="text-sm text-white">{invoice.date}</p>
                                <p className="text-xs text-gray-400">Premium Plan</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-white">{invoice.amount}</p>
                                <p className="text-xs text-green-500">{invoice.status}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <Download size={14} className="mr-2" />
                                Receipt
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cancel Subscription */}
                  <Card className="bg-black border-red-500/20">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium text-red-500 mb-2">Cancel Subscription</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        If you cancel your subscription, you'll still have access to Premium features until the end of
                        your current billing period.
                      </p>
                      <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-500/10">
                        <X size={14} className="mr-2" />
                        Cancel Subscription
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* API Access */}
              {activeSection === "api" && (
                <Card className="bg-black border-gray-800/50">
                  <CardHeader>
                    <CardTitle>API Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm text-gray-400 mb-4">
                        Use this API key to access Visiona programmatically. Keep it secure and do not share it
                        publicly.
                      </p>

                      <div className="flex items-center mb-4">
                        <Input
                          type="text"
                          value={userProfile.apiKey}
                          readOnly
                          className="bg-gray-900 border-gray-700 rounded-r-none text-white"
                        />
                        <Button
                          className="bg-gray-800 border border-l-0 border-gray-700 rounded-l-none text-gray-300 hover:bg-gray-700"
                          onClick={() => copyToClipboard(userProfile.apiKey)}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={regenerateApiKey}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        Regenerate API Key
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Danger Zone - Always visible */}
              <Card className="bg-black border-red-500/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-red-500 mb-2">Danger Zone</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Once you delete your account, there is no going back. This action is permanent.
                  </p>
                  <Button variant="destructive" size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                    <Trash2 size={14} className="mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Change Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="bg-black border-gray-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select the plan that best fits your creative needs
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-md shadow-sm bg-gray-900 p-1">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    billingCycle === "monthly" ? "bg-[#1eb8cd] text-white" : "text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => handleBillingCycleChange("monthly")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    billingCycle === "annual" ? "bg-[#1eb8cd] text-white" : "text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => handleBillingCycleChange("annual")}
                >
                  Annual <span className="text-xs opacity-80">Save ${calculateAnnualSavings()}</span>
                </button>
              </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <div
                className={`${
                  selectedPlan === "free"
                    ? "border-[#1eb8cd] ring-2 ring-[#1eb8cd]/20"
                    : "border-gray-800/50 hover:border-gray-700"
                } bg-black border rounded-lg p-6 transition-all duration-200 cursor-pointer`}
                onClick={() => handlePlanSelect("free")}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-2">Free</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">$0</span>
                    <span className="text-sm text-gray-400 ml-1">/forever</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">5 AI models lifetime</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">20 generations per day</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Standard generation quality</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Community support</span>
                  </li>
                </ul>

                <Button
                  variant={selectedPlan === "free" ? "primary" : "outline"}
                  className={
                    selectedPlan === "free" ? "bg-[#1eb8cd] hover:bg-[#19a3b6]" : "border-[#1eb8cd] text-[#1eb8cd]"
                  }
                  size="sm"
                  onClick={() => handlePlanSelect("free")}
                >
                  {selectedPlan === "free" ? "Selected" : "Select Plan"}
                </Button>
              </div>

              {/* Premium Plan */}
              <div
                className={`${
                  selectedPlan === "premium"
                    ? "border-[#1eb8cd] ring-2 ring-[#1eb8cd]/20"
                    : "border-gray-800/50 hover:border-gray-700"
                } bg-black border rounded-lg p-6 transition-all duration-200 cursor-pointer relative`}
                onClick={() => handlePlanSelect("premium")}
              >
                <Badge className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-[#1eb8cd]/20 text-[#1eb8cd]">
                  Most Popular
                </Badge>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-2">Premium</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">
                      {billingCycle === "monthly" ? "$19.99" : "$199.99"}
                    </span>
                    <span className="text-sm text-gray-400 ml-1">/{billingCycle === "monthly" ? "month" : "year"}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Unlimited AI models</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">100 generations per day</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">High-quality generation</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Priority processing</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">24/7 support</span>
                  </li>
                </ul>

                <Button
                  variant={selectedPlan === "premium" ? "primary" : "outline"}
                  className={
                    selectedPlan === "premium" ? "bg-[#1eb8cd] hover:bg-[#19a3b6]" : "border-[#1eb8cd] text-[#1eb8cd]"
                  }
                  size="sm"
                  onClick={() => handlePlanSelect("premium")}
                >
                  {selectedPlan === "premium" ? "Selected" : "Select Plan"}
                </Button>
              </div>

              {/* Pro Plan */}
              <div
                className={`${
                  selectedPlan === "pro"
                    ? "border-[#1eb8cd] ring-2 ring-[#1eb8cd]/20"
                    : "border-gray-800/50 hover:border-gray-700"
                } bg-black border rounded-lg p-6 transition-all duration-200 cursor-pointer`}
                onClick={() => handlePlanSelect("pro")}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-2">Professional</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">
                      {billingCycle === "monthly" ? "$49.99" : "$499.99"}
                    </span>
                    <span className="text-sm text-gray-400 ml-1">/{billingCycle === "monthly" ? "month" : "year"}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Unlimited AI models</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Unlimited generations</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Highest quality generation</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={16} className="text-[#1eb8cd] mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-300">Dedicated support</span>
                  </li>
                </ul>

                <Button
                  variant={selectedPlan === "pro" ? "primary" : "outline"}
                  className={
                    selectedPlan === "pro" ? "bg-[#1eb8cd] hover:bg-[#19a3b6]" : "border-[#1eb8cd] text-[#1eb8cd]"
                  }
                  size="sm"
                  onClick={() => handlePlanSelect("pro")}
                >
                  {selectedPlan === "pro" ? "Selected" : "Select Plan"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPlanDialog(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowPlanDialog(false)
                if (selectedPlan !== "free") {
                  setShowPaymentDialog(true)
                }
              }}
              className="bg-[#1eb8cd] hover:bg-[#19a3b6]"
            >
              {selectedPlan === userProfile.plan.toLowerCase() ? "Confirm Plan" : "Continue to Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-black border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Payment Information</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your payment method for your subscription
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Payment Details</h3>
                <div className="flex space-x-2">
                  <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-xs text-white font-bold">VISA</span>
                  </div>
                  <div className="w-8 h-5 bg-orange-600 rounded flex items-center justify-center">
                    <span className="text-xs text-white font-bold">MC</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  value={paymentForm.cardName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                  placeholder="John Smith"
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={paymentForm.expiryDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, expiryDate: e.target.value })}
                    placeholder="MM/YY"
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                    placeholder="123"
                    type="password"
                    required
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-start">
                <Shield size={16} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  Your payment information is encrypted and secure. We never store your full card details.
                </p>
              </div>
            </div>

            <div className="flex items-center bg-gray-900/30 p-4 rounded-md">
              <Info size={18} className="text-[#1eb8cd] mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-300">
                You're subscribing to the {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan, billed{" "}
                {billingCycle === "monthly" ? "monthly" : "annually"}. You can cancel or change your subscription at any
                time.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowPaymentDialog(false)
                // Here you would handle the payment processing
              }}
              className="bg-[#1eb8cd] hover:bg-[#19a3b6]"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Center Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="bg-black border-gray-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Help Center</DialogTitle>
            <DialogDescription className="text-gray-400">
              Find answers to common questions or browse our knowledge base
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder="Search for help articles, tutorials, FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <Button className="absolute right-1 top-1 bottom-1 bg-[#1eb8cd] hover:bg-[#19a3b6]">Search</Button>
              </div>
            </div>

            {/* Help Categories */}
            <h3 className="text-lg font-medium text-white mb-4">Browse by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {helpCategories.map((category) => (
                <div
                  key={category.title}
                  className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4 hover:border-[#1eb8cd]/50 hover:bg-gray-900/50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start">
                    <div className="p-3 bg-[#1eb8cd]/10 rounded-lg mr-4">{category.icon}</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">{category.title}</h4>
                      <p className="text-gray-400 text-sm">{category.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Popular Articles */}
            <h3 className="text-lg font-medium text-white mb-4">Popular Articles</h3>
            <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg overflow-hidden mb-6">
              {knowledgeBaseArticles.map((article, index) => (
                <div
                  key={article.id}
                  className={`p-4 hover:bg-gray-900/50 cursor-pointer ${
                    index < knowledgeBaseArticles.length - 1 ? "border-b border-gray-800/50" : ""
                  }`}
                >
                  <h4 className="text-white font-medium mb-1">{article.title}</h4>
                  <p className="text-gray-400 text-sm mb-2">{article.excerpt}</p>
                  <Badge className="bg-gray-800 text-gray-300">{article.category}</Badge>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10"
                onClick={() => {
                  setShowHelpDialog(false)
                  setShowFaqDialog(true)
                }}
              >
                <MessageCircle size={16} className="mr-2" />
                View FAQs
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10"
                onClick={() => {
                  setShowHelpDialog(false)
                  setShowContactDialog(true)
                }}
              >
                <Mail size={16} className="mr-2" />
                Contact Support
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => window.open("https://docs.visiona.ai", "_blank")}
              >
                <ExternalLink size={16} className="mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
        <DialogContent className="bg-black border-gray-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Frequently Asked Questions</DialogTitle>
            <DialogDescription className="text-gray-400">
              Find answers to common questions about Visiona
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-1">
              {faqData.map((faq, index) => (
                <div key={index} className="border-b border-gray-800/50 last:border-b-0">
                  <button
                    className="flex justify-between items-center w-full py-4 text-left"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  >
                    <h3 className="text-white font-medium">{faq.question}</h3>
                    <span className="text-[#1eb8cd]">
                      {activeFaq === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {activeFaq === index && <div className="pb-4 text-gray-300 text-sm space-y-2">{faq.answer}</div>}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-400">Can't find what you're looking for?</p>
              <Button
                className="bg-[#1eb8cd] hover:bg-[#19a3b6]"
                onClick={() => {
                  setShowFaqDialog(false)
                  setShowContactDialog(true)
                }}
              >
                <MessageCircle size={16} className="mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Support Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="bg-black border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send us a message and we'll get back to you as soon as possible
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleContactSubmit} className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-[#1eb8cd] focus:border-[#1eb8cd] transition duration-200"
                >
                  <option value="general">General Question</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Subscription</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  required
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                  className="bg-gray-900 border-gray-700 text-white min-h-[150px]"
                />
              </div>

              <div className="bg-gray-900/30 p-4 rounded-md flex items-start">
                <Info size={18} className="text-[#1eb8cd] mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Our support team typically responds within 24 hours. For Premium and Professional plan users, we offer
                  priority support with faster response times.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowContactDialog(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1eb8cd] hover:bg-[#19a3b6]">
                <Mail size={16} className="mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

