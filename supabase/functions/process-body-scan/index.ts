import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseJsonWithFallback } from "../_shared/parseJson.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  job_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let jobId: string | undefined;

  try {
    const { job_id }: ProcessRequest = await req.json();
    jobId = job_id;

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Missing job_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch job details
    const { data: job, error: fetchError } = await supabase
      .from("body_scan_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      console.error("Job not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (job.status !== "pending") {
      console.log(`Job ${jobId} is not pending (status: ${job.status})`);
      return new Response(
        JSON.stringify({ message: "Job already processed or processing" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as processing
    await supabase
      .from("body_scan_jobs")
      .update({ status: "processing" })
      .eq("id", jobId);

    console.log(`Processing body scan job: ${jobId}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const images = job.images as string[];
    const height_cm = job.height_cm;
    const gender = job.gender;

    // Build image content for the AI model
    const imageContent = images.slice(0, 8).map((img: string) => ({
      type: "image_url" as const,
      image_url: {
        url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
      },
    }));

    const systemPrompt = `You are an expert AI tailor and body measurement specialist with decades of experience. Your task is to analyze images of a person and extract accurate body measurements for custom tailoring.

Given the person's stated height of ${height_cm}cm and gender (${gender}), analyze the provided images and estimate the following measurements in centimeters.

CRITICAL ACCURACY RULES:
1. Use the stated height as your PRIMARY reference for calculating all proportional measurements.
2. Apply standard anatomical ratios as sanity checks:
   - Shoulder width is typically 22-28% of height
   - Chest circumference is typically 50-60% of height
   - Waist circumference is typically 40-50% of height for males, 35-45% for females
   - Inseam is typically 43-47% of height
   - Arm length is typically 32-36% of height
   - Neck circumference is typically 20-25% of height
3. If any measurement falls outside expected anatomical ranges, adjust it to the nearest reasonable value.
4. Set confidence scores HONESTLY based on image quality, visibility, and pose quality.
5. Only report confidence >= 80 if images clearly show the full body with good lighting and minimal occlusion.

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
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI model");
    }

    const measurements = parseJsonWithFallback(content);

    // Sanity-check: clamp measurements to anatomical ranges
    const h = height_cm;
    const m = measurements.measurements;
    if (m) {
      m.height = h;
      if (m.shoulder_width < h * 0.18 || m.shoulder_width > h * 0.32) m.shoulder_width = Math.round(h * 0.25);
      if (m.chest_circumference < h * 0.40 || m.chest_circumference > h * 0.70) m.chest_circumference = Math.round(h * 0.55);
      if (m.waist_circumference < h * 0.30 || m.waist_circumference > h * 0.60) m.waist_circumference = Math.round(h * (gender === "female" ? 0.40 : 0.45));
      if (m.hip_circumference < h * 0.45 || m.hip_circumference > h * 0.70) m.hip_circumference = Math.round(h * 0.55);
      if (m.inseam < h * 0.38 || m.inseam > h * 0.52) m.inseam = Math.round(h * 0.45);
    }

    // If confidence below 80, mark as low confidence
    const confidence = measurements.confidence_scores?.overall || 0;
    const finalStatus = confidence < 80 ? "low_confidence" : "completed";

    // Update job with results
    await supabase
      .from("body_scan_jobs")
      .update({
        status: finalStatus === "low_confidence" ? "completed" : "completed",
        result: { ...measurements, low_confidence: confidence < 80 },
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`Successfully completed job: ${jobId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing scan:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (jobId) {
      await supabase
        .from("body_scan_jobs")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
