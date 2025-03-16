import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get current user from Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user exists in Supabase
    const { data: supabaseUser, error: queryError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", user.id)
      .maybeSingle();
    
    if (queryError) {
      console.error("Error querying user:", queryError);
      return NextResponse.json(
        { error: "Error accessing user database" },
        { status: 500 }
      );
    }
    
    // If user doesn't exist in Supabase, create them
    if (!supabaseUser) {
      // Create user record
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating user:", insertError);
        return NextResponse.json(
          { error: "Failed to create user record" },
          { status: 500 }
        );
      }
      
      // Return the newly created user profile
      return NextResponse.json({
        success: true,
        profile: {
          id: newUser.id,
          email: newUser.email,
          created_at: newUser.created_at,
          subscription: {
            status: "free",
          },
          stats: {
            models: 0,
            generations: 0,
          },
          quotas: {
            models: {
              total: 5,
              remaining: 5,
            },
            generations: {
              daily: 20,
              remaining: 20,
            }
          }
        }
      });
    }
    
    // Get user stats
    const [
      { count: modelsCount }, 
      { count: generationsCount }
    ] = await Promise.all([
      supabase.from("models").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("generations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    
    // Return user profile with stats
    return NextResponse.json({
      success: true,
      profile: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        created_at: supabaseUser.created_at,
        subscription: {
          status: "free", // Replace with actual logic from Stripe if implemented
        },
        stats: {
          models: modelsCount || 0,
          generations: generationsCount || 0,
        },
        quotas: {
          models: {
            total: 5, // Free tier limit
            remaining: 5 - (modelsCount || 0),
          },
          generations: {
            daily: 20, // Free tier daily limit
            remaining: 20 - (generationsCount || 0),
          }
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 