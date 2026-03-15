

## Understanding Your Request

You're asking for two things:

1. **Does AI measurement work on mobile?** — Yes, the AI body scanner uses the device camera via `getUserMedia`, which works on mobile browsers. However, the current UI may not be fully optimized for small screens (the capture/review flow uses desktop-sized layouts).

2. **Two distinct ordering flows on the product detail page:**
   - **Straight Order** — Customer selects from the tailor's pre-defined variants (color, size, fabric) and adds to cart / orders directly at the listed price. No customization engine involved.
   - **Custom Order** — Customer uses the full customization engine (fabric, fit, collar, embroidery, etc.) to build a bespoke version with price modifiers. This is the existing "Customize & Order" flow.

Currently, the product detail page only has "Customize & Order" — there is no way to do a straight order by picking from the tailor's available variants.

---

## Plan

### 1. Add "Straight Order" variant selector to ProductDetail page

**New component: `src/components/product/ProductVariantSelector.tsx`**
- Renders selectable options for **size**, **color**, and **fabric** based on `product.sizes`, `product.colors`, `product.fabrics`.
- Each group uses toggle buttons (not badges) so the customer can pick exactly one option per group.
- Tracks selected state: `{ size: string | null, color: string | null, fabric: string | null }`.
- Validates that required selections are made before allowing "Add to Cart" / "Order Now".

**Update `ProductDetail.tsx` CTA section:**
- Replace the current single "Customize & Order" button with two distinct buttons:
  - **"Add to Cart" / "Order Now"** (primary) — uses the variant selector selections, adds to cart with the selected variants stored in `customizations` JSON field. Price = `base_price` (no modifiers).
  - **"Customize & Order"** (secondary/outline) — existing flow, navigates to `/customize` page for full bespoke customization with price modifiers.
- Move the variant selector above the CTA buttons so the customer picks size/color/fabric first.
- The `ProductSpecifications` component stays as-is (read-only display), but the new variant selector replaces it as the interactive element.

### 2. Update cart/checkout to handle straight orders

**Update `useCart.ts` `addToCart`:**
- The `customizations` field already supports arbitrary JSON. Straight orders will store: `{ type: 'straight', size: 'L', color: 'White', fabric: 'Cotton' }`.
- Custom orders already store the full customization state.

**Update `Checkout.tsx`:**
- Detect `type: 'straight'` in customizations to skip the customization summary display and show selected variants instead.
- Straight orders use `base_price` directly (no price modifiers).

### 3. Ensure AI measurement works well on mobile

- The camera capture already uses `getUserMedia` with `facingMode: 'environment'`, which works on mobile.
- Add responsive adjustments to `AIBodyScanner.tsx`: ensure the capture preview and controls are usable on the current viewport (393px wide).
- No fundamental changes needed — just CSS/layout tweaks for small screens.

### Files to create/modify

| File | Action |
|------|--------|
| `src/components/product/ProductVariantSelector.tsx` | **Create** — interactive size/color/fabric picker |
| `src/pages/ProductDetail.tsx` | **Edit** — add variant selector + split CTA into "Order Now" and "Customize" |
| `src/pages/Checkout.tsx` | **Edit** — handle straight order display in summary |
| `src/components/measurements/AIBodyScanner.tsx` | **Edit** — minor responsive CSS fixes for mobile |

### No database changes needed
The existing `cart_items.customizations` JSONB field and `orders.customizations` JSONB field can store both straight-order variant selections and custom-order state without schema changes.

