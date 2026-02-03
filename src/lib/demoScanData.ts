// Demo data for testing body scanner without camera
// This simulates what the AI would return for a 175cm male

export const DEMO_MEASUREMENTS = {
  measurements: {
    height: 175,
    neck_circumference: 38,
    shoulder_width: 46,
    chest_circumference: 98,
    bust_circumference: 96,
    underbust_circumference: 88,
    waist_circumference: 82,
    hip_circumference: 96,
    arm_length: 62,
    forearm_length: 27,
    wrist_circumference: 17,
    bicep_circumference: 32,
    inseam: 81,
    outseam: 106,
    thigh_circumference: 56,
    knee_circumference: 38,
    calf_circumference: 38,
    ankle_circumference: 24,
    back_width: 42,
    front_body_length: 45,
    back_body_length: 47,
    shoulder_to_waist_front: 44,
    shoulder_to_waist_back: 45,
    waist_to_hip: 22,
    crotch_depth: 26,
    rise_front: 27,
    rise_back: 34,
    across_chest: 38,
    across_back: 40,
    sleeve_length: 64,
    upper_arm_length: 35,
    armhole_depth: 22,
  },
  confidence_scores: {
    overall: 85,
    upper_body: 88,
    lower_body: 82,
    arms: 86,
  },
  fit_recommendations: {
    shirt_size: "M",
    pants_size: "32",
    suit_size: "40",
    body_type: "mesomorph",
  },
  notes: "",
};

// Generate demo frames (placeholder colored rectangles as base64)
// In production, you'd have actual sample images
export function generateDemoFrames(): string[] {
  const frames: string[] = [];
  const colors = [
    "#4A90D9", "#5BA55B", "#D94A4A", "#D9A54A",
    "#9B4AD9", "#4AD9D9", "#D94A9B", "#9BD94A",
    "#4A5BD9", "#D9D94A", "#4AD99B", "#D95B4A",
  ];

  for (let i = 0; i < 12; i++) {
    // Create a simple canvas placeholder
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 640, 480);
      gradient.addColorStop(0, colors[i]);
      gradient.addColorStop(1, colors[(i + 1) % 12]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 640, 480);

      // Add frame number
      ctx.fillStyle = "white";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Demo Frame ${i + 1}`, 320, 200);
      
      // Add silhouette placeholder
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.ellipse(320, 280, 60, 120, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(320, 140, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    frames.push(canvas.toDataURL("image/jpeg", 0.8));
  }

  return frames;
}
