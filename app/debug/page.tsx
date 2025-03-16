"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export default function DebugPage() {
  const { user, isLoaded } = useUser()
  const [copied, setCopied] = useState(false)

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Clerk User Information</h2>
        {!isLoaded ? (
          <p>Loading user data...</p>
        ) : user ? (
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">User ID (click to copy):</p>
              <div 
                className="bg-gray-700 p-3 rounded flex justify-between items-center cursor-pointer hover:bg-gray-600"
                onClick={copyUserId}
              >
                <code className="text-green-400">{user.id}</code>
                <span className="text-xs bg-gray-900 px-2 py-1 rounded">
                  {copied ? "Copied!" : "Click to copy"}
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Email:</p>
              <div className="bg-gray-700 p-3 rounded">
                <code>{user.primaryEmailAddress?.emailAddress}</code>
              </div>
            </div>
          </div>
        ) : (
          <p>No user signed in</p>
        )}
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sync Instructions</h2>
        <ol className="list-decimal pl-5 space-y-3">
          <li>Copy your User ID and email from above</li>
          <li>Edit the <code className="bg-gray-700 px-2 py-1 rounded">sync-user.js</code> file with these values</li>
          <li>Run <code className="bg-gray-700 px-2 py-1 rounded">node sync-user.js</code> in your terminal</li>
          <li>Reload your application</li>
        </ol>
      </div>
    </div>
  )
} 