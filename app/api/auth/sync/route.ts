import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Get the currently signed-in user
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user exists in Supabase
    const { data: existingUsers, error: queryError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", user.id)
      .maybeSingle();
    
    if (queryError) {
      console.error("Error querying user:", queryError);
      return NextResponse.json(
        { error: "Error querying user database" },
        { status: 500 }
      );
    }
    
    // If user doesn't exist, create them
    if (!existingUsers) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "unknown@example.com",
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
      
      return NextResponse.json({
        success: true,
        message: "User created and synced successfully",
        user: newUser,
      });
    }
    
    // User already exists
    return NextResponse.json({
      success: true,
      message: "User already synced",
      user: existingUsers,
    });
    
  } catch (error) {
    console.error("Error in auth sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 