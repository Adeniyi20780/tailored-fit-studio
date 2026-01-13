import { format } from "date-fns";

interface OrderForReceipt {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  estimated_delivery?: string | null;
  notes?: string | null;
  customizations?: Record<string, unknown> | null;
  shipping_address?: Record<string, unknown> | null;
  product?: {
    name: string;
    category: string;
  } | null;
  tailor?: {
    store_name: string;
  } | null;
}

export function generateOrderReceipt(order: OrderForReceipt) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const shippingAddress = order.shipping_address;
  const customizations = order.customizations;

  // Generate customizations text
  let customizationsText = "";
  if (customizations && Object.keys(customizations).length > 0) {
    customizationsText = Object.entries(customizations)
      .map(([key, value]) => {
        const displayValue = typeof value === 'object' && value !== null 
          ? (value as any).name || JSON.stringify(value)
          : String(value);
        return `  ${key.replace(/_/g, " ")}: ${displayValue}`;
      })
      .join("\n");
  }

  // Build receipt content
  const addr = shippingAddress || {};
  const fullName = String(addr.fullName || addr.name || "N/A");
  const address = String(addr.address || addr.street || "");
  const city = String(addr.city || "");
  const state = String(addr.state || "");
  const postalCode = String(addr.postalCode || addr.zip || "");
  const country = String(addr.country || "");
  const phone = addr.phone ? String(addr.phone) : "";

  const receiptContent = `
================================================================================
                              TAILORSWIFT RECEIPT
================================================================================

Order Number: ${order.order_number}
Order Date: ${format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
Order Status: ${order.status.replace(/_/g, " ").toUpperCase()}

--------------------------------------------------------------------------------
                               PRODUCT DETAILS
--------------------------------------------------------------------------------

Product: ${order.product?.name || "Custom Product"}
Category: ${order.product?.category || "N/A"}
Tailor: ${order.tailor?.store_name || "TailorSwift"}

${customizationsText ? `Customizations:\n${customizationsText}` : ""}

--------------------------------------------------------------------------------
                              SHIPPING ADDRESS
--------------------------------------------------------------------------------

${shippingAddress ? `
${fullName}
${address}
${city}, ${state} ${postalCode}
${country}
${phone ? `Phone: ${phone}` : ""}
`.trim() : "No shipping address provided"}

--------------------------------------------------------------------------------
                                ORDER SUMMARY
--------------------------------------------------------------------------------

Subtotal:                                       ${formatCurrency(order.total_amount, order.currency)}
Shipping:                                       Calculated separately
--------------------------------------------------------------------------------
TOTAL:                                          ${formatCurrency(order.total_amount, order.currency)}

${order.estimated_delivery ? `
Estimated Delivery: ${format(new Date(order.estimated_delivery), "MMMM d, yyyy")}
` : ""}
${order.notes ? `
Order Notes:
${order.notes}
` : ""}

================================================================================
                            THANK YOU FOR YOUR ORDER!
================================================================================

Questions? Contact us at support@tailorswift.com

This receipt was generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}

================================================================================
`.trim();

  // Create and download the file
  const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `TailorSwift-Receipt-${order.order_number}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePDFReceipt(order: OrderForReceipt) {
  // For a proper PDF, we'd use a library like jsPDF
  // For now, we'll generate an HTML version that can be printed as PDF
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const shippingAddress = order.shipping_address;
  const customizations = order.customizations;

  const addr = shippingAddress || {};
  const fullName = String(addr.fullName || addr.name || "");
  const addrLine = String(addr.address || addr.street || "");
  const city = String(addr.city || "");
  const state = String(addr.state || "");
  const postalCode = String(addr.postalCode || addr.zip || "");
  const country = String(addr.country || "");
  const phone = addr.phone ? String(addr.phone) : "";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #8b5a2b; padding-bottom: 20px; }
    .header h1 { color: #8b5a2b; font-size: 28px; margin-bottom: 8px; }
    .header p { color: #666; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { margin-bottom: 12px; }
    .info-item label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
    .info-item span { font-size: 14px; color: #333; }
    .total-section { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.grand-total { border-top: 2px solid #8b5a2b; margin-top: 12px; padding-top: 12px; font-size: 18px; font-weight: bold; color: #8b5a2b; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; text-transform: uppercase; }
    .badge-success { background: #e8f5e9; color: #2e7d32; }
    .badge-pending { background: #fff3e0; color: #ef6c00; }
    .badge-processing { background: #e3f2fd; color: #1976d2; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>TailorSwift</h1>
    <p>Custom Tailoring Made Easy</p>
  </div>

  <div class="section">
    <h2>Order Receipt</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>Order Number</label>
        <span><strong>${order.order_number}</strong></span>
      </div>
      <div class="info-item">
        <label>Order Date</label>
        <span>${format(new Date(order.created_at), "MMMM d, yyyy")}</span>
      </div>
      <div class="info-item">
        <label>Status</label>
        <span class="badge ${order.status === 'delivered' || order.status === 'completed' ? 'badge-success' : order.status === 'pending' ? 'badge-pending' : 'badge-processing'}">${order.status.replace(/_/g, " ")}</span>
      </div>
      ${order.estimated_delivery ? `
      <div class="info-item">
        <label>Estimated Delivery</label>
        <span>${format(new Date(order.estimated_delivery), "MMMM d, yyyy")}</span>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Product Details</h2>
    <div class="info-item">
      <label>Product</label>
      <span>${order.product?.name || "Custom Product"}</span>
    </div>
    <div class="info-item">
      <label>Category</label>
      <span>${order.product?.category || "N/A"}</span>
    </div>
    <div class="info-item">
      <label>Tailor</label>
      <span>${order.tailor?.store_name || "TailorSwift"}</span>
    </div>
    ${customizations && Object.keys(customizations).length > 0 ? `
    <div class="info-item">
      <label>Customizations</label>
      <span>${Object.entries(customizations).map(([k, v]) => {
        const displayVal = typeof v === 'object' && v !== null ? (v as any).name || JSON.stringify(v) : String(v);
        return `${k.replace(/_/g, " ")}: ${displayVal}`;
      }).join(", ")}</span>
    </div>
    ` : ''}
  </div>

  ${shippingAddress ? `
  <div class="section">
    <h2>Shipping Address</h2>
    <p>${fullName}</p>
    <p>${addrLine}</p>
    <p>${city}, ${state} ${postalCode}</p>
    <p>${country}</p>
    ${phone ? `<p>Phone: ${phone}</p>` : ''}
  </div>
  ` : ''}

  <div class="total-section">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${formatCurrency(order.total_amount, order.currency)}</span>
    </div>
    <div class="total-row">
      <span>Shipping</span>
      <span>Calculated separately</span>
    </div>
    <div class="total-row grand-total">
      <span>Total</span>
      <span>${formatCurrency(order.total_amount, order.currency)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your order!</p>
    <p>Questions? Contact us at support@tailorswift.com</p>
    <p style="margin-top: 12px;">Receipt generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
  </div>
</body>
</html>
  `;

  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  }
}
