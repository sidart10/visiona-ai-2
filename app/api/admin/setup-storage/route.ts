import { NextRequest, NextResponse } from "next/server";
import { setupStorageBuckets } from "@/utils/supabase/setup-storage";

export async function POST(req: NextRequest) {
  try {
    // Check if request has admin key
    const adminKey = req.headers.get('x-admin-key');
    
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Setup storage buckets
    await setupStorageBuckets();
    
    return NextResponse.json({
      success: true,
      message: "Storage buckets setup complete"
    });
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update to use App Router config
export const dynamic = 'force-dynamic'; 