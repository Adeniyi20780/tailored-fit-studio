import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type OrderStatus = "pending" | "processing" | "tailoring" | "packaging" | "shipped" | "delivered" | "completed" | "cancelled";

interface OrderNotificationRequest {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  productName: string;
  status: OrderStatus;
  estimatedDelivery?: string;
  trackingNumber?: string;
  sendWhatsApp?: boolean;
  tailorName?: string;
}

const getStatusEmoji = (status: OrderStatus): string => {
  const emojis: Record<OrderStatus, string> = {
    pending: "⏳",
    processing: "🔄",
    tailoring: "✂️",
    packaging: "📦",
    shipped: "🚚",
    delivered: "🎉",
    completed: "✅",
    cancelled: "❌",
  };
  return emojis[status] || "📋";
};

const getStatusTitle = (status: OrderStatus): string => {
  const titles: Record<OrderStatus, string> = {
    pending: "Order Pending",
    processing: "Order Processing",
    tailoring: "Your Order is Being Tailored",
    packaging: "Order Ready for Shipping",
    shipped: "Your Order is On Its Way",
    delivered: "Your Order Has Arrived",
    completed: "Order Completed",
    cancelled: "Order Cancelled",
  };
  return titles[status] || "Order Update";
};

const getStatusMessage = (status: OrderStatus, data: OrderNotificationRequest): string => {
  const messages: Record<OrderStatus, string> = {
    pending: `Your order has been received and is pending confirmation. We'll notify you once it's being processed.`,
    processing: `Great news! Your order has been confirmed and is now being processed.`,
    tailoring: `Your custom garment is now being expertly crafted by our skilled tailors. This is where the magic happens!`,
    packaging: `Your order has been completed and is being carefully packaged for shipping.`,
    shipped: `Your order has been shipped and is on its way to you!${data.estimatedDelivery ? ` Expected delivery: ${data.estimatedDelivery}` : ''}`,
    delivered: `Your order has been successfully delivered! We hope you love your new custom-tailored item.`,
    completed: `Your order is complete! Thank you for shopping with us.`,
    cancelled: `Unfortunately, your order has been cancelled. If you have any questions, please contact us.`,
  };
  return messages[status] || "Your order status has been updated.";
};

const getGradientColors = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: "#f59e0b, #d97706",
    processing: "#3b82f6, #1d4ed8",
    tailoring: "#8b5cf6, #6d28d9",
    packaging: "#6366f1, #4338ca",
    shipped: "#667eea, #764ba2",
    delivered: "#11998e, #38ef7d",
    completed: "#10b981, #059669",
    cancelled: "#ef4444, #dc2626",
  };
  return colors[status] || "#667eea, #764ba2";
};

const getEmailContent = (data: OrderNotificationRequest) => {
  const emoji = getStatusEmoji(data.status);
  const title = getStatusTitle(data.status);
  const message = getStatusMessage(data.status, data);
  const gradient = getGradientColors(data.status);

  return {
    subject: `${emoji} ${title} - Order ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${gradient}); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${emoji} ${title}!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${data.customerName}</strong>,</p>
          
          <p style="font-size: 16px;">${message}</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${gradient.split(',')[0]};">
            <h3 style="margin: 0 0 15px 0; color: ${gradient.split(',')[0]};">Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Product:</strong> ${data.productName}</p>
            ${data.tailorName ? `<p style="margin: 5px 0;"><strong>Tailor:</strong> ${data.tailorName}</p>` : ''}
            ${data.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
            ${data.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
          </div>
          
          ${data.status === 'delivered' ? `
          <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">💡 <strong>Tip:</strong> If you have any questions about care or fit, don't hesitate to reach out! You can also leave a review to help other customers.</p>
          </div>
          ` : ''}
          
          <p style="font-size: 16px; margin-top: 30px;">
            Best regards,<br>
            <strong>The TailorSwift Team</strong>
          </p>
        </div>
      </body>
      </html>
    `,
  };
};

const getWhatsAppMessage = (data: OrderNotificationRequest): string => {
  const emoji = getStatusEmoji(data.status);
  const title = getStatusTitle(data.status);
  const message = getStatusMessage(data.status, data);
  
  let whatsappMessage = `${emoji} *${title}!*\n\nHi ${data.customerName},\n\n${message}\n\n*Order Details:*\n• Order Number: ${data.orderNumber}\n• Product: ${data.productName}`;
  
  if (data.tailorName) {
    whatsappMessage += `\n• Tailor: ${data.tailorName}`;
  }
  if (data.estimatedDelivery) {
    whatsappMessage += `\n• Estimated Delivery: ${data.estimatedDelivery}`;
  }
  if (data.trackingNumber) {
    whatsappMessage += `\n• Tracking Number: ${data.trackingNumber}`;
  }
  
  whatsappMessage += `\n\n— The TailorSwift Team`;
  return whatsappMessage;
};

const sendWhatsAppMessage = async (phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.log("WhatsApp credentials not configured, skipping WhatsApp notification");
    return { success: false, error: "WhatsApp credentials not configured" };
  }

  // Format phone number for WhatsApp (should be in E.164 format)
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
  formData.append('To', `whatsapp:${formattedPhone}`);
  formData.append('Body', message);

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio WhatsApp API error:", result);
      return { success: false, error: result.message || "Failed to send WhatsApp message" };
    }

    console.log("WhatsApp message sent successfully:", result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data: OrderNotificationRequest = await req.json();

    // Validate required fields
    if (!data.orderId || !data.orderNumber || !data.customerEmail || !data.status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate status is a known value
    const validStatuses: OrderStatus[] = ["pending", "processing", "tailoring", "packaging", "shipped", "delivered", "completed", "cancelled"];
    if (!validStatuses.includes(data.status as OrderStatus)) {
      return new Response(
        JSON.stringify({ message: "Invalid status value" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: { email?: { success: boolean; id?: string; error?: string }; whatsapp?: { success: boolean; messageId?: string; error?: string } } = {};

    // Send email using Resend API
    const emailContent = getEmailContent(data);
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TailorSwift <onboarding@resend.dev>",
        to: [data.customerEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      results.email = { success: false, error: emailResult.message || "Failed to send email" };
    } else {
      console.log("Email sent successfully:", emailResult);
      results.email = { success: true, id: emailResult.id };
    }

    // Send WhatsApp message if requested and phone number is available
    if (data.sendWhatsApp && data.customerPhone) {
      const whatsappMessage = getWhatsAppMessage(data);
      const whatsappResult = await sendWhatsAppMessage(data.customerPhone, whatsappMessage);
      results.whatsapp = whatsappResult;
    }

    const allSuccessful = results.email?.success && (!data.sendWhatsApp || !data.customerPhone || results.whatsapp?.success);

    return new Response(
      JSON.stringify({ 
        success: allSuccessful,
        message: `${data.status === 'shipped' ? 'Shipment' : 'Delivery'} notification(s) sent`,
        results
      }),
      {
        status: allSuccessful ? 200 : 207, // 207 Multi-Status if partial success
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-order-notification function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
