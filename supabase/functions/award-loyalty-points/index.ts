import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AwardPointsRequest {
  order_id: string;
  customer_id: string;
  amount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, customer_id, amount }: AwardPointsRequest = await req.json();

    if (!order_id || !customer_id || !amount) {
      throw new Error("Missing required fields: order_id, customer_id, amount");
    }

    console.log(`Awarding points for order ${order_id}, customer ${customer_id}, amount ${amount}`);

    // Get customer's loyalty status and tier
    let { data: loyalty, error: loyaltyError } = await supabase
      .from("customer_loyalty")
      .select("*, loyalty_tiers(*)")
      .eq("user_id", customer_id)
      .maybeSingle();

    // Get all tiers to find bronze tier if needed
    const { data: tiers } = await supabase
      .from("loyalty_tiers")
      .select("*")
      .order("min_points", { ascending: true });

    const bronzeTier = tiers?.find((t) => t.min_points === 0);

    // Create loyalty record if doesn't exist
    if (!loyalty) {
      const { data: newLoyalty, error: insertError } = await supabase
        .from("customer_loyalty")
        .insert({
          user_id: customer_id,
          current_tier_id: bronzeTier?.id || null,
        })
        .select("*, loyalty_tiers(*)")
        .single();

      if (insertError) throw insertError;
      loyalty = newLoyalty;
    }

    // Calculate points based on tier multiplier
    const multiplier = loyalty.loyalty_tiers?.multiplier || 1;
    const basePoints = Math.floor(amount); // 1 point per dollar
    const earnedPoints = Math.floor(basePoints * multiplier);

    console.log(`Multiplier: ${multiplier}, Base points: ${basePoints}, Earned: ${earnedPoints}`);

    // Update loyalty points
    const newTotalPoints = loyalty.total_points + earnedPoints;
    const newAvailablePoints = loyalty.available_points + earnedPoints;
    const newLifetimePoints = loyalty.lifetime_points + earnedPoints;

    // Check if customer should be upgraded to new tier
    let newTierId = loyalty.current_tier_id;
    let tierUpgrade = false;
    let newTierName = loyalty.loyalty_tiers?.name;

    if (tiers) {
      for (const tier of tiers.slice().reverse()) {
        if (newLifetimePoints >= tier.min_points) {
          if (tier.id !== loyalty.current_tier_id) {
            newTierId = tier.id;
            tierUpgrade = true;
            newTierName = tier.name;
          }
          break;
        }
      }
    }

    // Update customer loyalty
    const { error: updateError } = await supabase
      .from("customer_loyalty")
      .update({
        total_points: newTotalPoints,
        available_points: newAvailablePoints,
        lifetime_points: newLifetimePoints,
        current_tier_id: newTierId,
      })
      .eq("user_id", customer_id);

    if (updateError) throw updateError;

    // Record the points transaction
    const { error: transactionError } = await supabase
      .from("points_transactions")
      .insert({
        user_id: customer_id,
        points: earnedPoints,
        type: "earned",
        description: `Points earned from order #${order_id.slice(0, 8)}`,
        reference_id: order_id,
        reference_type: "order",
      });

    if (transactionError) throw transactionError;

    // Get customer email for notifications
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", customer_id)
      .single();

    // Send email notification for points earned
    if (profile?.email) {
      try {
        await supabase.functions.invoke("send-loyalty-notification", {
          body: {
            type: "points_earned",
            email: profile.email,
            name: profile.full_name || "Valued Customer",
            points: earnedPoints,
            total_points: newAvailablePoints,
            tier_name: newTierName,
          },
        });

        // Send tier upgrade notification if applicable
        if (tierUpgrade) {
          await supabase.functions.invoke("send-loyalty-notification", {
            body: {
              type: "tier_upgrade",
              email: profile.email,
              name: profile.full_name || "Valued Customer",
              new_tier: newTierName,
              total_points: newLifetimePoints,
            },
          });
        }
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        points_earned: earnedPoints,
        new_total: newAvailablePoints,
        tier_upgrade: tierUpgrade,
        new_tier: tierUpgrade ? newTierName : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error awarding points:", error);
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
