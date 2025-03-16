import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // Get the webhook secret from the environment
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    return new Response("Missing webhook secret", { status: 500 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a Svix instance with your secret
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  // Get the event type
  const eventType = evt.type;
  
  // Create a Supabase client with service role credentials for full access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Handle different event types
  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      // Extract user data from the event
      const { id, email_addresses, ...userData } = evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;

      if (!id || !primaryEmail) {
        return new Response("Missing user data", { status: 400 });
      }

      // Create or update the user in Supabase
      const { data, error } = await supabase
        .from("users")
        .upsert({
          clerk_id: id,
          email: primaryEmail,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error upserting user:", error);
        return new Response(`Error upserting user: ${error.message}`, { status: 500 });
      }

      console.log(`User ${eventType === "user.created" ? "created" : "updated"}: ${id}`);
      
      // Log the event in the audit_logs table
      await supabase.from("audit_logs").insert({
        user_id: data.id,
        action: eventType,
        details: { clerk_id: id },
      });
    } else if (eventType === "user.deleted") {
      // Extract user data from the event
      const { id } = evt.data;

      if (!id) {
        return new Response("Missing user ID", { status: 400 });
      }

      // Get the user's ID from Supabase using the Clerk ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", id)
        .single();

      if (userError) {
        console.error("Error finding user:", userError);
        return new Response(`Error finding user: ${userError.message}`, { status: 500 });
      }

      // Log the deletion in the audit logs before deleting the user
      if (userData) {
        await supabase.from("audit_logs").insert({
          user_id: userData.id,
          action: eventType,
          details: { clerk_id: id },
        });
      }

      // Delete the user from Supabase
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("clerk_id", id);

      if (error) {
        console.error("Error deleting user:", error);
        return new Response(`Error deleting user: ${error.message}`, { status: 500 });
      }

      console.log(`User deleted: ${id}`);
    }

    // Return a success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(`Error handling webhook: ${String(error)}`, { status: 500 });
  }
} 