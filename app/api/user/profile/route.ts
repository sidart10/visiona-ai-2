import { NextRequest, NextResponse } from "next/server";
import { currentUser, auth } from "@clerk/nextjs/server";
import { supabaseAdmin, getOrCreateUser } from "@/utils/supabase-admin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // First try to get the user using the auth() method
    const session = await auth();
    
    // If auth() doesn't provide a user ID, fall back to currentUser()
    let clerkUserId = session?.userId;
    let user;
    
    if (!clerkUserId) {
      user = await currentUser();
      if (!user || !user.id) {
        return NextResponse.json(
          { error: "Unauthorized", success: false },
          { status: 401 }
        );
      }
      clerkUserId = user.id;
    } else {
      // If we have userId from auth(), get full user object if needed
      user = await currentUser();
    }

    // Get or create the user in Supabase
    try {
      const email = user?.emailAddresses?.[0]?.emailAddress || '';
      const userData = await getOrCreateUser(clerkUserId, email);

      // Get counts for user's data
      const [
        { count: photosCount, error: photosError },
        { count: modelsCount, error: modelsError },
        { count: generationsCount, error: generationsError }
      ] = await Promise.all([
        supabaseAdmin
          .from("photos")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userData.id),
        supabaseAdmin
          .from("models")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userData.id),
        supabaseAdmin
          .from("generations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userData.id)
      ]);

      if (photosError || modelsError || generationsError) {
        console.error("Error fetching counts:", { photosError, modelsError, generationsError });
        return NextResponse.json(
          { error: "Failed to fetch user data", success: false },
          { status: 500 }
        );
      }

      // Get today's generations count for quota display
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayGenerationsCount, error: todayGenerationsError } = await supabaseAdmin
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.id)
        .gte("created_at", today.toISOString());

      if (todayGenerationsError) {
        console.error("Error counting today's generations:", todayGenerationsError);
        return NextResponse.json(
          { error: "Failed to check generation quota", success: false },
          { status: 500 }
        );
      }

      // Define quotas based on subscription status
      const isSubscribed = userData.subscription_status === 'premium';
      
      const MAX_FREE_MODELS = 5;
      const MAX_FREE_GENERATIONS_PER_DAY = 20;
      
      const MAX_PREMIUM_MODELS = 100;
      const MAX_PREMIUM_GENERATIONS_PER_DAY = 1000;
      
      const modelQuota = {
        total: isSubscribed ? MAX_PREMIUM_MODELS : MAX_FREE_MODELS,
        used: modelsCount || 0,
        remaining: isSubscribed 
          ? Math.max(0, MAX_PREMIUM_MODELS - (modelsCount || 0))
          : Math.max(0, MAX_FREE_MODELS - (modelsCount || 0))
      };
      
      const generationQuota = {
        total: isSubscribed ? MAX_PREMIUM_GENERATIONS_PER_DAY : MAX_FREE_GENERATIONS_PER_DAY,
        used: todayGenerationsCount || 0,
        remaining: isSubscribed
          ? Math.max(0, MAX_PREMIUM_GENERATIONS_PER_DAY - (todayGenerationsCount || 0))
          : Math.max(0, MAX_FREE_GENERATIONS_PER_DAY - (todayGenerationsCount || 0))
      };

      // Include user information from Clerk
      const userInfo = {
        id: userData.id,
        email: user?.emailAddresses?.[0]?.emailAddress || userData.email || '',
        firstName: user?.firstName || userData.first_name || '',
        lastName: user?.lastName || userData.last_name || '',
        imageUrl: user?.imageUrl || userData.image_url || '',
        created_at: userData.created_at,
        subscription: {
          status: isSubscribed ? "premium" : "free",
        },
        stats: {
          photos: photosCount || 0,
          models: modelsCount || 0,
          generations: generationsCount || 0
        },
        quotas: {
          models: modelQuota,
          generations: generationQuota
        }
      };

      // Return success response
      return NextResponse.json({
        success: true,
        profile: userInfo
      });
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Database error: " + (dbError.message || "Unknown error"), success: false },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
} 