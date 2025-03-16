"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Star,
  Shield,
  Zap,
  Image,
  UserPlus,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Check,
  ArrowRight,
  Camera,
  Github,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react"

import { Button } from "@/components/ui/button"

// Container Component
const Container: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = "" }) => {
  return <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

// Testimonial Card Component
type TestimonialProps = {
  content: string
  author: string
  role: string
  avatarUrl?: string
}

const TestimonialCard: React.FC<TestimonialProps> = ({ content, author, role, avatarUrl }) => {
  return (
    <div className="bg-black border border-gray-800/50 rounded-lg p-6 shadow-xl transition-transform duration-300 hover:transform hover:-translate-y-1 hover:shadow-[#1eb8cd]/10">
      <div className="flex items-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={16} className="text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <p className="text-gray-300 mb-6">{content}</p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1eb8cd] to-blue-500 mr-3 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl || "/placeholder.svg"} alt={author} className="w-10 h-10 rounded-full" />
          ) : (
            <span className="text-white font-bold">{author[0]}</span>
          )}
        </div>
        <div>
          <h4 className="text-white font-medium">{author}</h4>
          <p className="text-gray-400 text-sm">{role}</p>
        </div>
      </div>
    </div>
  )
}

// Feature Card Component
type FeatureProps = {
  icon: React.ReactNode
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className="p-6 rounded-lg border border-gray-800/50 bg-black transition duration-300 hover:border-gray-700">
      <div className="w-12 h-12 rounded-full bg-[#1eb8cd]/10 flex items-center justify-center text-[#1eb8cd] mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

// Pricing Card Component
type PricingProps = {
  title: string
  price: string
  period: string
  description: string
  features: string[]
  isPopular?: boolean
  buttonText: string
  buttonLink: string
}

const PricingCard: React.FC<PricingProps> = ({
  title,
  price,
  period,
  description,
  features,
  isPopular = false,
  buttonText,
  buttonLink,
}) => {
  return (
    <div
      className={`rounded-lg overflow-hidden transition-all duration-300 ${
        isPopular ? "border-2 border-[#1eb8cd] shadow-xl shadow-[#1eb8cd]/10 relative" : "border border-gray-800/50"
      }`}
    >
      {isPopular && <div className="bg-[#1eb8cd] text-white text-center text-xs font-semibold py-1">MOST POPULAR</div>}
      <div className="p-6 bg-black">
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-4">{description}</p>
        <div className="mb-6">
          <span className="text-4xl font-bold text-white">{price}</span>
          {period && <span className="text-gray-400">/{period}</span>}
        </div>

        <Button
          variant={isPopular ? "default" : "outline"}
          className={`w-full mb-6 ${isPopular ? "bg-[#1eb8cd] hover:bg-[#19a3b6]" : "border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10"}`}
          asChild
        >
          <Link href={buttonLink}>{buttonText}</Link>
        </Button>

        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check size={18} className="text-[#1eb8cd] mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// FAQ Component
type FAQItemProps = {
  question: string
  answer: React.ReactNode
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-800/50 last:border-b-0">
      <button className="flex justify-between items-center w-full py-4 text-left" onClick={() => setIsOpen(!isOpen)}>
        <h3 className="text-white font-medium">{question}</h3>
        <span className="text-[#1eb8cd]">
          {isOpen ? (
            <ChevronDown size={18} className="transform rotate-180 transition-transform duration-300" />
          ) : (
            <ChevronDown size={18} className="transition-transform duration-300" />
          )}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-gray-400 space-y-2">{answer}</div>
      </div>
    </div>
  )
}

// Image Grid Component
const ImageGrid: React.FC = () => {
  // These would be real AI-generated images in the actual app
  const images = [
    { id: 1, src: "/placeholder.svg?height=300&width=300", alt: "AI Generated Image 1" },
    { id: 2, src: "/placeholder.svg?height=300&width=300", alt: "AI Generated Image 2" },
    { id: 3, src: "/placeholder.svg?height=300&width=300", alt: "AI Generated Image 3" },
    { id: 4, src: "/placeholder.svg?height=300&width=300", alt: "AI Generated Image 4" },
    { id: 5, src: "/placeholder.svg?height=300&width=300", alt: "AI Generated Image 5" },
    { id: 6, src: "/placeholder.svg?height=300&width=300", alt: "AI Generated Image 6" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="relative overflow-hidden rounded-lg aspect-square transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[#1eb8cd]/20 hover:shadow-lg"
        >
          <img src={image.src || "/placeholder.svg"} alt={image.alt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
            <div className="p-3">
              <p className="text-white text-sm">{image.alt}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Main Landing Page Component
export default function LandingPage() {
  // State for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle scroll effects
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // FAQ data
  const faqData = [
    {
      question: "What is Visiona and how does it work?",
      answer: (
        <p>
          Visiona is a web-based platform that allows you to create AI clones of yourself using custom-trained models
          based on your photos. Simply upload 10-20 photos, assign a trigger word, and our AI will train a model that
          can generate images featuring your likeness in various scenarios.
        </p>
      ),
    },
    {
      question: "How many photos do I need to upload?",
      answer: (
        <p>
          We recommend uploading 10-20 high-quality photos for best results. These should show your face clearly from
          different angles, with good lighting and minimal background distractions.
        </p>
      ),
    },
    {
      question: "How long does the training process take?",
      answer: (
        <p>
          The training process typically takes 5-10 minutes. You'll receive a notification once your model is ready to
          use for generating images.
        </p>
      ),
    },
    {
      question: "What's the difference between free and premium plans?",
      answer: (
        <p>
          The free plan allows you to create up to 5 models and generate 20 images per day. Premium users get unlimited
          models, 100 images per day, higher processing priority, and advanced prompt enhancement features.
        </p>
      ),
    },
    {
      question: "Is my data secure?",
      answer: (
        <p>
          Yes, we take data security very seriously. All your photos and generated images are encrypted, and we
          implement strict access controls. Your data is never shared with third parties, and you can delete your data
          at any time.
        </p>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-black/90 backdrop-blur-lg shadow-lg shadow-black/30" : "bg-transparent"
        }`}
      >
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-2xl font-bold cursor-pointer"
              >
                Visiona
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-gray-300 hover:text-white transition-colors">
                FAQ
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="outline" className="border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10" asChild>
                <Link href="/auth/signin">Log In</Link>
              </Button>
              <Button className="bg-[#1eb8cd] hover:bg-[#19a3b6]" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </Container>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <Container>
            <nav className="py-4 space-y-4">
              <a
                href="#features"
                className="block text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="block text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="block text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="pt-2 pb-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10"
                  asChild
                >
                  <Link href="/auth/signin">Log In</Link>
                </Button>
                <Button className="w-full bg-[#1eb8cd] hover:bg-[#19a3b6]" asChild>
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </div>
            </nav>
          </Container>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden relative">
        {/* Gradient background effects */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] bg-[#1eb8cd]/20 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <Container className="relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-[#1eb8cd]/10 border border-[#1eb8cd]/20 text-[#1eb8cd] text-sm font-medium mb-6">
              <Sparkles size={16} className="mr-2" />
              <span>AI-Powered Image Generation</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Create Your Digital Twin with{" "}
              <span className="bg-gradient-to-r from-[#1eb8cd] to-blue-500 bg-clip-text text-transparent">
                AI Magic
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8">
              Transform your photos into personalized AI models. Generate stunning images of yourself in any scenario,
              style, or setting with just a few clicks.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                className="bg-gradient-to-r from-[#1eb8cd] to-blue-500 hover:from-[#19a3b6] hover:to-blue-600 text-white shadow-lg shadow-[#1eb8cd]/30"
                size="lg"
                asChild
              >
                <Link href="/auth/signup">
                  <UserPlus size={18} className="mr-2" />
                  Create Your AI Clone
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10"
                asChild
              >
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="max-w-5xl mx-auto relative">
            {/* Main showcase image would go here - using placeholder for now */}
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-[#1eb8cd]/20 border border-gray-800/50">
              <img src="/placeholder.svg?height=600&width=1200" alt="Visiona App Interface" className="w-full" />
            </div>

            {/* Floating badge 1 */}
            <div className="absolute -top-6 right-10 md:right-20 bg-black/80 backdrop-blur-lg border border-gray-800/50 px-4 py-2 rounded-lg shadow-lg transform rotate-3 hidden md:block">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#1eb8cd]/20 flex items-center justify-center text-[#1eb8cd] mr-2">
                  <Zap size={16} />
                </div>
                <span className="text-sm font-medium">Ultra-fast processing</span>
              </div>
            </div>

            {/* Floating badge 2 */}
            <div className="absolute -bottom-6 left-10 md:left-20 bg-black/80 backdrop-blur-lg border border-gray-800/50 px-4 py-2 rounded-lg shadow-lg transform -rotate-2 hidden md:block">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#1eb8cd]/20 flex items-center justify-center text-[#1eb8cd] mr-2">
                  <Image size={16} />
                </div>
                <span className="text-sm font-medium">100+ generations daily</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-black to-gray-900/30">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create, customize, and explore with our cutting-edge AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Camera size={24} />}
              title="Easy Model Training"
              description="Upload 10-20 photos and create your personalized AI model in minutes. No technical knowledge required."
            />
            <FeatureCard
              icon={<Sparkles size={24} />}
              title="AI Prompt Enhancement"
              description="Our intelligent system helps refine your text prompts to generate the most impressive and accurate results."
            />
            <FeatureCard
              icon={<Image size={24} />}
              title="Unlimited Creativity"
              description="Generate images of yourself in any setting, style, or scenario imaginable with simple text descriptions."
            />
            <FeatureCard
              icon={<Shield size={24} />}
              title="Secure & Private"
              description="Your photos and data are encrypted and protected. We never share your personal information with third parties."
            />
            <FeatureCard
              icon={<Zap size={24} />}
              title="Lightning Fast"
              description="Generate high-quality images in seconds with our optimized infrastructure and premium processing priority."
            />
            <FeatureCard
              icon={<UserPlus size={24} />}
              title="Multiple Models"
              description="Create different AI models for various aspects of your life - professional, casual, creative, and more."
            />
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Visiona Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Three simple steps to create your digital twin</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1eb8cd]/10 text-[#1eb8cd] flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Your Photos</h3>
              <p className="text-gray-400">
                Upload 10-20 clear photos of yourself with different angles and expressions for best results.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1eb8cd]/10 text-[#1eb8cd] flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Train Your Model</h3>
              <p className="text-gray-400">
                Our AI technology analyzes your photos and trains a custom model unique to your appearance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1eb8cd]/10 text-[#1eb8cd] flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Generate Images</h3>
              <p className="text-gray-400">
                Use text prompts to create amazing images featuring your likeness in any scenario you can imagine.
              </p>
            </div>
          </div>

          {/* Example images */}
          <div className="mt-20">
            <h3 className="text-2xl font-semibold text-center mb-8">See What You Can Create</h3>
            <ImageGrid />
          </div>

          <div className="text-center mt-12">
            <Button
              className="bg-gradient-to-r from-[#1eb8cd] to-blue-500 hover:from-[#19a3b6] hover:to-blue-600 text-white shadow-lg shadow-[#1eb8cd]/30"
              size="lg"
              asChild
            >
              <Link href="/auth/signup">
                <ArrowRight size={18} className="mr-2" />
                Start Creating Now
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900/30">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of creative professionals already using Visiona
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              content="Visiona has completely transformed how I create content. I can now generate professional headshots, creative avatars, and marketing materials featuring my likeness without expensive photoshoots."
              author="Sarah Johnson"
              role="Content Creator"
            />
            <TestimonialCard
              content="As a digital artist, I'm blown away by the quality and creativity Visiona enables. The AI prompt enhancement feature is particularly impressive - it helps me achieve exactly the look I want."
              author="Michael Chen"
              role="Digital Artist"
            />
            <TestimonialCard
              content="I was skeptical at first, but the results are incredible. The models are surprisingly accurate, and generating new images is addictively fun. Well worth the premium subscription!"
              author="Jessica Reid"
              role="Marketing Professional"
            />
          </div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Choose the plan that fits your creative needs</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="Free"
              price="$0"
              period="forever"
              description="Perfect for beginners and casual users."
              features={[
                "5 AI models lifetime",
                "20 generations per day",
                "Standard generation quality",
                "Community support",
                "Basic prompt enhancement",
              ]}
              buttonText="Get Started"
              buttonLink="/auth/signup"
            />

            <PricingCard
              title="Premium"
              price="$19.99"
              period="month"
              description="Ideal for creators and enthusiasts."
              features={[
                "Unlimited AI models",
                "100 generations per day",
                "High-quality generation",
                "Priority processing",
                "Advanced prompt enhancement",
                "24/7 support",
              ]}
              isPopular={true}
              buttonText="Start Premium"
              buttonLink="/auth/signup?plan=premium"
            />

            <PricingCard
              title="Professional"
              price="$49.99"
              period="month"
              description="For power users and businesses."
              features={[
                "Unlimited AI models",
                "Unlimited generations",
                "Highest quality generation",
                "Priority processing",
                "Advanced prompt enhancement",
                "Custom trigger words",
                "API access",
                "Dedicated support",
              ]}
              buttonText="Start Professional"
              buttonLink="/auth/signup?plan=professional"
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-2">All plans include a 7-day money-back guarantee</p>
            <p className="text-gray-400">
              Need a custom solution?{" "}
              <a href="/contact" className="text-[#1eb8cd] hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-b from-black to-gray-900/30">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Everything you need to know about Visiona</p>
          </div>

          <div className="max-w-3xl mx-auto">
            {faqData.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="bg-gradient-to-r from-[#1eb8cd]/20 to-blue-500/20 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1eb8cd]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Create Your Digital Twin?</h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of users already creating amazing AI-generated images with Visiona. Start your creative
                journey today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  className="bg-gradient-to-r from-[#1eb8cd] to-blue-500 hover:from-[#19a3b6] hover:to-blue-600 text-white shadow-lg shadow-[#1eb8cd]/30"
                  size="lg"
                  asChild
                >
                  <Link href="/auth/signup">Get Started for Free</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-[#1eb8cd] text-[#1eb8cd] hover:bg-[#1eb8cd]/10"
                  asChild
                >
                  <Link href="/demo">See Live Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="pt-20 pb-10 bg-black border-t border-gray-800/50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">Visiona</h3>
              <p className="text-gray-400 mb-4">
                Create stunning AI-generated images of yourself in any scenario, style, or setting.
              </p>
              <div className="flex space-x-4">
                <a href="https://twitter.com" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="https://instagram.com" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="https://linkedin.com" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                  <Linkedin size={20} />
                </a>
                <a href="https://github.com" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                  <Github size={20} />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/features" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/demo" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="/updates" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Updates
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/blog" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/careers" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/help" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/docs" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/status" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    System Status
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-gray-400 hover:text-[#1eb8cd] transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800/50 text-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} Visiona. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  )
}

