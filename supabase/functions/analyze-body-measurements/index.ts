import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { images, height_cm, gender }: MeasurementRequest = await req.json();

    if (!images || images.length === 0 || !height_cm) {
      throw new Error("Missing required fields: images and height_cm");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

Output ONLY a valid JSON object with the following structure (all values in centimeters):
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
  "notes": "<any additional observations about posture, fit concerns, or measurement accuracy>"
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
                text: `Please analyze these ${images.length} images of a person (height: ${height_cm}cm, gender: ${gender}) and extract detailed body measurements for custom tailoring. The images show the person from different angles during a 360-degree rotation.`,
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.2,
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

    // Parse the JSON response
    let measurements;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      measurements = JSON.parse(jsonStr);
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
