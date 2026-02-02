import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseJsonWithFallback } from "./_shared/parseJson.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MeasurementRequest {
  images: string[]; // base64 encoded images from camera capture
  height_cm: number; // User provides their height for scale reference
  gender: "male" | "female";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // When verify_jwt=false, explicitly pass the token to avoid edge cases.
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing body scan for user: ${user.id}`);

    const { images, height_cm, gender }: MeasurementRequest = await req.json();

    if (!images || images.length === 0 || !height_cm) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: images and height_cm" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing ${images.length} images for body measurements...`);

    // Build image content for the AI model
    const imageContent = images.slice(0, 8).map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
      },
    }));

    const systemPrompt = `You are an expert AI tailor and body measurement specialist. Your task is to analyze images of a person and extract accurate body measurements for custom tailoring.

Given the person's stated height of ${height_cm}cm and gender (${gender}), analyze the provided images and estimate the following measurements in centimeters.

You must be precise and provide realistic measurements based on body proportions visible in the images. Use the stated height as your primary reference for scale.

    Output ONLY a valid JSON object (NO markdown, NO prose, NO code fences). Keep output concise.
    The "notes" field MUST be an empty string ("") to prevent long text from truncating the JSON.
    Use the following structure (all values in centimeters):
{
  "measurements": {
    "height": ${height_cm},
    "neck_circumference": <number>,
    "shoulder_width": <number>,
    "chest_circumference": <number>,
    "bust_circumference": <number>,
    "underbust_circumference": <number>,
    "waist_circumference": <number>,
    "hip_circumference": <number>,
    "arm_length": <number>,
    "forearm_length": <number>,
    "wrist_circumference": <number>,
    "bicep_circumference": <number>,
    "inseam": <number>,
    "outseam": <number>,
    "thigh_circumference": <number>,
    "knee_circumference": <number>,
    "calf_circumference": <number>,
    "ankle_circumference": <number>,
    "back_width": <number>,
    "front_body_length": <number>,
    "back_body_length": <number>,
    "shoulder_to_waist_front": <number>,
    "shoulder_to_waist_back": <number>,
    "waist_to_hip": <number>,
    "crotch_depth": <number>,
    "rise_front": <number>,
    "rise_back": <number>,
    "across_chest": <number>,
    "across_back": <number>,
    "sleeve_length": <number>,
    "upper_arm_length": <number>,
    "armhole_depth": <number>
  },
  "confidence_scores": {
    "overall": <0-100>,
    "upper_body": <0-100>,
    "lower_body": <0-100>,
    "arms": <0-100>
  },
  "fit_recommendations": {
    "shirt_size": "<XS/S/M/L/XL/XXL>",
    "pants_size": "<waist in inches>",
    "suit_size": "<number>",
    "body_type": "<ectomorph/mesomorph/endomorph/balanced>"
  },
      "notes": ""
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze these images (height: ${height_cm}cm, gender: ${gender}) and return ONLY the JSON object described in the system instructions. Do not include markdown or any extra text.`,
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI model");
    }

    let measurements;
    try {
      measurements = parseJsonWithFallback(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse measurement data from AI response");
    }

    console.log("Successfully extracted measurements");

    return new Response(JSON.stringify(measurements), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error analyzing measurements:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
