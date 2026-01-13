import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriceChange {
  product_id: string;
  product_name: string;
  old_price: number;
  new_price: number;
  currency: string;
  product_image: string | null;
}

interface NotificationRecipient {
  user_id: string;
  email: string;
  full_name: string | null;
  product_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get price changes from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: priceChanges, error: priceError } = await supabase
      .from("product_price_history")
      .select(`
        product_id,
        old_price,
        new_price,
        changed_at,
        products (
          name,
          currency,
          images
        )
      `)
      .gte("changed_at", oneHourAgo);

    if (priceError) {
      console.error("Error fetching price changes:", priceError);
      throw priceError;
    }

    // Filter for price drops only (new_price < old_price)
    const priceDrops = (priceChanges || []).filter(
      (pc: any) => pc.new_price < pc.old_price
    );

    if (priceDrops.length === 0) {
      console.log("No price drops found in the last hour");
      return new Response(
        JSON.stringify({ message: "No price drops to notify", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${priceDrops.length} price drops`);

    // Get users who have notifications enabled for these products
    const productIds = priceDrops.map((pc: any) => pc.product_id);
    
    const { data: notifications, error: notifError } = await supabase
      .from("wishlist_notifications")
      .select(`
        user_id,
        product_id,
        profiles!inner (
          email,
          full_name
        )
      `)
      .in("product_id", productIds)
      .eq("notify_on_sale", true)
      .eq("email_notifications", true);

    if (notifError) {
      console.error("Error fetching notifications:", notifError);
      throw notifError;
    }

    if (!notifications || notifications.length === 0) {
      console.log("No users with notifications enabled for these products");
      return new Response(
        JSON.stringify({ message: "No users to notify", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${notifications.length} notification subscriptions`);

    // Group notifications by user
    const userNotifications = new Map<string, { email: string; name: string; products: PriceChange[] }>();

    for (const notif of notifications) {
      const priceChange = priceDrops.find((pc: any) => pc.product_id === notif.product_id);
      if (!priceChange) continue;

      const profile = (notif as any).profiles;
      if (!profile?.email) continue;

      const existing = userNotifications.get(notif.user_id);
      const productData: PriceChange = {
        product_id: priceChange.product_id,
        product_name: (priceChange as any).products?.name || "Product",
        old_price: priceChange.old_price,
        new_price: priceChange.new_price,
        currency: (priceChange as any).products?.currency || "USD",
        product_image: (priceChange as any).products?.images?.[0] || null,
      };

      if (existing) {
        existing.products.push(productData);
      } else {
        userNotifications.set(notif.user_id, {
          email: profile.email,
          name: profile.full_name || "Customer",
          products: [productData],
        });
      }
    }

    // Send emails
    let sentCount = 0;
    const baseUrl = Deno.env.get("SITE_URL") || "https://tailorsshop.lovable.app";

    for (const [userId, data] of userNotifications) {
      const productList = data.products
        .map((p) => {
          const discount = Math.round(((p.old_price - p.new_price) / p.old_price) * 100);
          return `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e5e5; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">${p.product_name}</h3>
              <p style="margin: 0;">
                <span style="text-decoration: line-through; color: #999;">${p.currency}${p.old_price.toFixed(2)}</span>
                <span style="color: #22c55e; font-weight: bold; font-size: 1.2em; margin-left: 10px;">${p.currency}${p.new_price.toFixed(2)}</span>
                <span style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; margin-left: 10px; font-size: 0.9em;">${discount}% OFF</span>
              </p>
              <a href="${baseUrl}/product/${p.product_id}" style="display: inline-block; margin-top: 10px; color: #8b5cf6; text-decoration: none;">View Product →</a>
            </div>
          `;
        })
        .join("");

      try {
        const emailResponse = await resend.emails.send({
          from: "TailorsShop <onboarding@resend.dev>",
          to: [data.email],
          subject: `🎉 Price Drop Alert! ${data.products.length} item${data.products.length > 1 ? "s" : ""} on your wishlist`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8b5cf6; margin: 0;">✂️ TailorsShop</h1>
              </div>
              
              <h2 style="color: #333;">Hi ${data.name}! 👋</h2>
              
              <p>Great news! The price just dropped on ${data.products.length > 1 ? "some items" : "an item"} in your wishlist!</p>
              
              ${productList}
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${baseUrl}/wishlist" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Your Wishlist</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                Don't miss out on these deals! Prices may change at any time.
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
              
              <p style="font-size: 0.8em; color: #999; text-align: center;">
                You're receiving this email because you enabled price alerts for these products.
                <br>
                <a href="${baseUrl}/wishlist" style="color: #8b5cf6;">Manage your notification preferences</a>
              </p>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${data.email}:`, emailResponse);
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${data.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Price drop notifications sent", 
        sent: sentCount,
        priceDrops: priceDrops.length,
        subscribers: notifications.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in price-alert-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
