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

interface OrderNotificationRequest {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  productName: string;
  status: "shipped" | "delivered";
  estimatedDelivery?: string;
  trackingNumber?: string;
  sendWhatsApp?: boolean;
}

const getEmailContent = (data: OrderNotificationRequest) => {
  if (data.status === "shipped") {
    return {
      subject: `Your order ${data.orderNumber} has been shipped! 🚚`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📦 Your Order is On Its Way!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi <strong>${data.customerName}</strong>,</p>
            
            <p style="font-size: 16px;">Great news! Your order has been shipped and is on its way to you.</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">Order Details</h3>
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${data.productName}</p>
              ${data.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
              ${data.trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
            </div>
            
            <p style="font-size: 14px; color: #666;">We'll send you another email when your order has been delivered.</p>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Best regards,<br>
              <strong>The TailorSwift Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
    };
  }

  return {
    subject: `Your order ${data.orderNumber} has been delivered! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Your Order Has Arrived!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${data.customerName}</strong>,</p>
          
          <p style="font-size: 16px;">Your order has been successfully delivered! We hope you love your new custom-tailored item.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #11998e;">
            <h3 style="margin: 0 0 15px 0; color: #11998e;">Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Product:</strong> ${data.productName}</p>
          </div>
          
          <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">💡 <strong>Tip:</strong> If you have any questions about care or fit, don't hesitate to reach out!</p>
          </div>
          
          <p style="font-size: 16px; margin-top: 30px;">
            Thank you for choosing us!<br>
            <strong>The TailorSwift Team</strong>
          </p>
        </div>
      </body>
      </html>
    `,
  };
};

const getWhatsAppMessage = (data: OrderNotificationRequest): string => {
  if (data.status === "shipped") {
    let message = `📦 *Your Order is On Its Way!*\n\nHi ${data.customerName},\n\nGreat news! Your order has been shipped.\n\n*Order Details:*\n• Order Number: ${data.orderNumber}\n• Product: ${data.productName}`;
    
    if (data.estimatedDelivery) {
      message += `\n• Estimated Delivery: ${data.estimatedDelivery}`;
    }
    if (data.trackingNumber) {
      message += `\n• Tracking Number: ${data.trackingNumber}`;
    }
    
    message += `\n\nWe'll notify you when your order is delivered!\n\n— The TailorSwift Team`;
    return message;
  }

  return `🎉 *Your Order Has Arrived!*\n\nHi ${data.customerName},\n\nYour order has been successfully delivered!\n\n*Order Details:*\n• Order Number: ${data.orderNumber}\n• Product: ${data.productName}\n\nWe hope you love your new custom-tailored item. If you have any questions about care or fit, don't hesitate to reach out!\n\nThank you for choosing us!\n— The TailorSwift Team`;
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

    // Only send for shipped or delivered status
    if (!["shipped", "delivered"].includes(data.status)) {
      return new Response(
        JSON.stringify({ message: "No notification needed for this status" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
