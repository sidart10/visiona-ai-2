"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignUp() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Implement your auth logic here
      console.log("Signing up with:", { fullName, email, password })

      // Mock successful signup
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect or show success
      window.location.href = "/dashboard"
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-4">
      {/* Background geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#1a1a1a] opacity-20 rounded-full transform rotate-45"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#333] opacity-20 rounded-full"></div>
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-[#222] opacity-20 transform rotate-12 rounded-lg"></div>
      </div>

      {/* Sign-up card */}
      <Card className="w-full max-w-md bg-black border-[#333]/50 shadow-xl text-white relative z-10">
        <CardContent className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight mb-1 font-[Inter]">Welcome to Visiona</h1>
            <p className="text-sm text-gray-400 mb-6">Create your account to get started</p>
          </div>

          {/* Social auth buttons */}
          <div className="flex justify-center space-x-4 mb-8">
            <Button variant="outline" size="icon" className="bg-[#222] hover:bg-[#333] border-[#444] h-10 w-10">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M12 5c1.617 0 3.053.627 4.151 1.72l2.994-2.994C17.318 2.012 14.748 1 12 1S6.682 2.012 4.855 3.726l2.994 2.994C8.947 5.627 10.383 5 12 5z"
                />
                <path
                  fill="#34A853"
                  d="M5 12c0-.898.242-1.744.681-2.575l-2.994-2.994C1.5 8.131 1 10.1 1 12c0 1.9.5 3.869 1.687 5.569l2.994-2.994A6.072 6.072 0 0 1 5 12z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 19c-1.617 0-3.053-.627-4.151-1.72l-2.994 2.994C6.682 21.988 9.252 23 12 23s5.318-1.012 7.145-2.726l-2.994-2.994C15.053 18.373 13.617 19 12 19z"
                />
                <path
                  fill="#EA4335"
                  d="M23 12c0-.695-.066-1.414-.213-2.094H12v4.357h6.02c-.204 1.084-.835 2.04-1.76 2.713l2.994 2.994C21.242 17.194 23 14.87 23 12z"
                />
              </svg>
              <span className="sr-only">Sign up with Google</span>
            </Button>
            <Button variant="outline" size="icon" className="bg-[#222] hover:bg-[#333] border-[#444] h-10 w-10">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span className="sr-only">Sign up with GitHub</span>
            </Button>
          </div>

          <div className="relative mb-6">
            <Separator className="absolute inset-0 flex items-center" />
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-2 text-gray-400 uppercase">OR</span>
            </div>
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white text-sm p-2 rounded">{error}</div>
            )}

            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#333] text-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#333] text-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#333] text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1eb8cd] hover:bg-[#19a3b6] text-white mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center text-sm mt-6">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-[#1eb8cd] hover:text-[#7fdce8]">
                Sign in
              </Link>
            </p>
          </div>

          <div className="text-center text-xs text-gray-500 mt-4">
            <p>
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-[#1eb8cd] hover:text-[#7fdce8]">
                Terms
              </Link>{" "}
              &{" "}
              <Link href="/privacy" className="text-[#1eb8cd] hover:text-[#7fdce8]">
                Privacy
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

