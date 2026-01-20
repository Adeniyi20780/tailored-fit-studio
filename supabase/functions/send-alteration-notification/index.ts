import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlterationNotificationRequest {
  ticketId: string;
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  status: "submitted" | "in_progress" | "completed" | "rejected";
  issueType: string;
  resolution?: string;
}

const issueTypeLabels: Record<string, string> = {
  fit_too_tight: "Fit is too tight",
  fit_too_loose: "Fit is too loose",
  length_adjustment: "Length adjustment needed",
  sleeve_adjustment: "Sleeve adjustment needed",
  waist_adjustment: "Waist adjustment needed",
  shoulder_adjustment: "Shoulder adjustment needed",
  other: "Other issue",
};

const getEmailContent = (data: AlterationNotificationRequest) => {
  const issueLabel = issueTypeLabels[data.issueType] || data.issueType;

  if (data.status === "submitted") {
    return {
      subject: `Alteration Request Received - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✂️ Alteration Request Received</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi <strong>${data.customerName}</strong>,</p>
            
            <p style="font-size: 16px;">We've received your alteration request and our tailor will review it shortly.</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6366f1;">
              <h3 style="margin: 0 0 15px 0; color: #6366f1;">Request Details</h3>
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${data.productName}</p>
              <p style="margin: 5px 0;"><strong>Issue:</strong> ${issueLabel}</p>
            </div>
            
            <div style="background: #e0f2fe; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">💡 <strong>Perfect Fit Guarantee:</strong> Our tailors are committed to ensuring your garment fits perfectly. Most alterations are completed within 5-7 business days.</p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Best regards,<br>
              <strong>The TailorsShop Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
    };
  }

  if (data.status === "in_progress") {
    return {
      subject: `Alteration In Progress - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔧 Alteration In Progress</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi <strong>${data.customerName}</strong>,</p>
            
            <p style="font-size: 16px;">Great news! Our tailor has started working on your alteration request.</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin: 0 0 15px 0; color: #f59e0b;">Request Details</h3>
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${data.productName}</p>
              <p style="margin: 5px 0;"><strong>Issue:</strong> ${issueLabel}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">We'll notify you once the alteration is complete.</p>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Best regards,<br>
              <strong>The TailorsShop Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
    };
  }

  if (data.status === "completed") {
    return {
      subject: `Alteration Completed! - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Alteration Completed!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi <strong>${data.customerName}</strong>,</p>
            
            <p style="font-size: 16px;">Your alteration has been completed! Your garment should now fit perfectly.</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin: 0 0 15px 0; color: #10b981;">Request Details</h3>
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${data.productName}</p>
              <p style="margin: 5px 0;"><strong>Issue:</strong> ${issueLabel}</p>
              ${data.resolution ? `<p style="margin: 10px 0 0 0;"><strong>Resolution:</strong> ${data.resolution}</p>` : ''}
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">
              Thank you for choosing us!<br>
              <strong>The TailorsShop Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
    };
  }

  // Rejected status
  return {
    subject: `Alteration Request Update - Order ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📋 Alteration Request Update</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${data.customerName}</strong>,</p>
          
          <p style="font-size: 16px;">We've reviewed your alteration request and unfortunately cannot proceed with the requested changes.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #64748b;">
            <h3 style="margin: 0 0 15px 0; color: #64748b;">Request Details</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 5px 0;"><strong>Issue:</strong> ${issueLabel}</p>
            ${data.resolution ? `<p style="margin: 10px 0 0 0;"><strong>Reason:</strong> ${data.resolution}</p>` : ''}
          </div>
          
          <p style="font-size: 14px; color: #666;">If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="font-size: 16px; margin-top: 30px;">
            Best regards,<br>
            <strong>The TailorsShop Team</strong>
          </p>
        </div>
      </body>
      </html>
    `,
  };
};

const handler = async (req: Request): Promise<Response> => {
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

    const data: AlterationNotificationRequest = await req.json();

    if (!data.ticketId || !data.customerEmail || !data.status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailContent = getEmailContent(data);
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TailorsShop <onboarding@resend.dev>",
        to: [data.customerEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      return new Response(
        JSON.stringify({ success: false, error: emailResult.message || "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Alteration notification email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, id: emailResult.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-alteration-notification function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
