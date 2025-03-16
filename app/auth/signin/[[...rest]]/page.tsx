"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-4">
      {/* Background geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#1a1a1a] opacity-20 rounded-full transform rotate-45"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#333] opacity-20 rounded-full"></div>
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-[#222] opacity-20 transform rotate-12 rounded-lg"></div>
      </div>

      {/* Sign-in card */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-semibold tracking-tight mb-1 font-[Inter] text-white">Welcome Back</h1>
          <p className="text-sm text-gray-400">Sign in to your Visiona account</p>
        </div>
        <SignIn 
          routing="hash"
          appearance={{
            elements: {
              formButtonPrimary: "bg-[#1eb8cd] hover:bg-[#19a3b6]",
              card: "bg-black border-[#333]/50 shadow-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "bg-[#222] hover:bg-[#333] border-[#444] text-white",
              formFieldInput: "bg-[#1a1a1a] border-[#333] text-white",
              formFieldLabel: "text-white",
              footerActionLink: "text-[#1eb8cd] hover:text-[#7fdce8]",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-[#1eb8cd]"
            }
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}

