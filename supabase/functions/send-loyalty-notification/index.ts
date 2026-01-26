import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoyaltyNotificationRequest {
  type: "points_earned" | "tier_upgrade" | "reward_expiring";
  email: string;
  name: string;
  points?: number;
  total_points?: number;
  tier_name?: string;
  new_tier?: string;
  reward_name?: string;
  reward_code?: string;
  expires_at?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: LoyaltyNotificationRequest = await req.json();
    const { type, email, name } = data;

    if (!email || !name || !type) {
      throw new Error("Missing required fields");
    }

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "points_earned":
        subject = `You earned ${data.points} loyalty points! 🎉`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1A1F2C 0%, #403E43 100%); padding: 30px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0;">TailorSwift</h1>
              <p style="color: #fff; margin-top: 10px;">Loyalty Program</p>
            </div>
            <div style="padding: 30px; background: #fff;">
              <h2 style="color: #1A1F2C;">Congratulations, ${name}! 🎉</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                You've just earned <strong style="color: #D4AF37;">${data.points} points</strong> from your recent purchase!
              </p>
              <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">Your Current Points Balance</p>
                <p style="margin: 10px 0; color: #1A1F2C; font-size: 36px; font-weight: bold;">${data.total_points?.toLocaleString()}</p>
                <p style="margin: 0; color: #D4AF37; font-weight: 500;">${data.tier_name} Member</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                Keep shopping to earn more points and unlock exclusive rewards!
              </p>
              <a href="${Deno.env.get("SITE_URL") || "https://tailorswift.app"}/loyalty" 
                 style="display: inline-block; background: #D4AF37; color: #1A1F2C; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
                View Rewards
              </a>
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p>© ${new Date().getFullYear()} TailorSwift. All rights reserved.</p>
            </div>
          </div>
        `;
        break;

      case "tier_upgrade":
        subject = `You've been upgraded to ${data.new_tier}! 👑`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1A1F2C 0%, #403E43 100%); padding: 30px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0;">TailorSwift</h1>
              <p style="color: #fff; margin-top: 10px;">Loyalty Program</p>
            </div>
            <div style="padding: 30px; background: #fff;">
              <h2 style="color: #1A1F2C;">Welcome to ${data.new_tier}, ${name}! 👑</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Congratulations! You've reached a new tier in our loyalty program. 
                As a <strong style="color: #D4AF37;">${data.new_tier}</strong> member, you now enjoy exclusive benefits!
              </p>
              <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; color: #1A1F2C;">
                <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your New Tier</p>
                <p style="margin: 10px 0; font-size: 32px; font-weight: bold;">${data.new_tier}</p>
                <p style="margin: 0; font-size: 14px;">${data.total_points?.toLocaleString()} Lifetime Points</p>
              </div>
              <h3 style="color: #1A1F2C;">Your New Benefits:</h3>
              <ul style="color: #666; font-size: 14px; line-height: 1.8;">
                <li>Higher points multiplier on purchases</li>
                <li>Exclusive tier-only rewards</li>
                <li>Priority customer support</li>
                <li>Early access to new collections</li>
              </ul>
              <a href="${Deno.env.get("SITE_URL") || "https://tailorswift.app"}/loyalty" 
                 style="display: inline-block; background: #D4AF37; color: #1A1F2C; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
                Explore Your Benefits
              </a>
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p>© ${new Date().getFullYear()} TailorSwift. All rights reserved.</p>
            </div>
          </div>
        `;
        break;

      case "reward_expiring":
        subject = `Your reward is expiring soon! ⏰`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1A1F2C 0%, #403E43 100%); padding: 30px; text-align: center;">
              <h1 style="color: #D4AF37; margin: 0;">TailorSwift</h1>
              <p style="color: #fff; margin-top: 10px;">Loyalty Program</p>
            </div>
            <div style="padding: 30px; background: #fff;">
              <h2 style="color: #1A1F2C;">Don't let your reward expire, ${name}! ⏰</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Your reward <strong>${data.reward_name}</strong> is expiring soon. Use it before it's gone!
              </p>
              <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #856404; font-size: 14px;">Your Reward Code</p>
                <p style="margin: 10px 0; color: #856404; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${data.reward_code}</p>
                <p style="margin: 0; color: #856404; font-size: 12px;">Expires: ${data.expires_at}</p>
              </div>
              <a href="${Deno.env.get("SITE_URL") || "https://tailorswift.app"}/catalog" 
                 style="display: inline-block; background: #D4AF37; color: #1A1F2C; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
                Shop Now
              </a>
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p>© ${new Date().getFullYear()} TailorSwift. All rights reserved.</p>
            </div>
          </div>
        `;
        break;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TailorSwift Rewards <rewards@tailorswift.app>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    const result = await emailResponse.json();
    console.log("Loyalty notification sent:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending loyalty notification:", error);
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
