import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SubmitRequest {
  images: string[];
  height_cm: number;
  gender: "male" | "female";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { images, height_cm, gender }: SubmitRequest = await req.json();

    if (!images || images.length === 0 || !height_cm) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: images and height_cm" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create job record
    const { data: job, error: insertError } = await supabaseClient
      .from("body_scan_jobs")
      .insert({
        user_id: user.id,
        height_cm,
        gender,
        images: images.slice(0, 12), // Limit to 12 images
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create job:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create scan job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created body scan job: ${job.id} for user: ${user.id}`);

    // Trigger async processing (fire and forget)
    const processUrl = `${supabaseUrl}/functions/v1/process-body-scan`;
    fetch(processUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ job_id: job.id }),
    }).catch((err) => console.error("Failed to trigger processing:", err));

    return new Response(
      JSON.stringify({ job_id: job.id, status: "pending" }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error submitting scan:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
