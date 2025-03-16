"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";

export default function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // Only run once the user is loaded and signed in
    if (!isLoaded || !isSignedIn || synced) return;

    async function syncUser() {
      try {
        const response = await fetch("/api/auth/sync");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to sync user data");
        }
        
        const result = await response.json();
        console.log("User sync result:", result);
        
        // Set synced flag to avoid calling multiple times
        setSynced(true);
      } catch (error) {
        console.error("Error syncing user:", error);
        toast.error("Error syncing user data. Some features may not work correctly.");
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn, synced]);

  // This component doesn't render anything
  return null;
} 