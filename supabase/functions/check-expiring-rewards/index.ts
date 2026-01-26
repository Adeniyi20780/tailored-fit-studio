import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function runs on a schedule to check for expiring rewards and send notifications
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find rewards expiring in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() + 2);

    const { data: expiringRewards, error } = await supabase
      .from("reward_redemptions")
      .select("*, loyalty_rewards(name)")
      .eq("status", "active")
      .gte("expires_at", threeDaysAgo.toISOString())
      .lte("expires_at", threeDaysFromNow.toISOString());

    if (error) throw error;

    console.log(`Found ${expiringRewards?.length || 0} expiring rewards`);

    let notificationsSent = 0;

    for (const redemption of expiringRewards || []) {
      // Get user email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", redemption.user_id)
        .single();

      if (profile?.email) {
        try {
          await supabase.functions.invoke("send-loyalty-notification", {
            body: {
              type: "reward_expiring",
              email: profile.email,
              name: profile.full_name || "Valued Customer",
              reward_name: redemption.loyalty_rewards?.name,
              reward_code: redemption.code,
              expires_at: new Date(redemption.expires_at).toLocaleDateString(),
            },
          });
          notificationsSent++;
        } catch (emailError) {
          console.error(`Failed to send expiry notification to ${profile.email}:`, emailError);
        }
      }
    }

    // Also expire any rewards that have passed their expiration date
    const { data: expiredRewards, error: expireError } = await supabase
      .from("reward_redemptions")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString())
      .select();

    if (expireError) {
      console.error("Error expiring rewards:", expireError);
    } else {
      console.log(`Expired ${expiredRewards?.length || 0} rewards`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notificationsSent,
        rewards_expired: expiredRewards?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error checking expiring rewards:", error);
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
