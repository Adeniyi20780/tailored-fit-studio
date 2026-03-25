

## Enhancements: Body Position Guide, Visual Measurement Guides, and Tailor Sharing

### 1. Body Position Guide Overlay (`AIBodyScanner.tsx`)

Add an inline SVG silhouette overlay on the camera preview showing a standing figure with arms slightly away from the body. Rendered as a semi-transparent stroke with `pointer-events-none`, visible only when the camera is live and not capturing. Includes a small "Align your body" label.

### 2. Manual Measurement Entry with Visual + Text Guides (`MeasurementSelector.tsx`)

Create a new component `src/components/measurements/MeasurementGuideDialog.tsx` that serves as a visual guide popup for each body part:

- Each measurement field (Chest, Waist, Hips, Shoulders, Sleeve, Neck, Inseam, Height) gets a clickable `HelpCircle` icon next to the label
- Clicking opens a dialog showing:
  - An **inline SVG illustration** of a body outline with the specific measurement highlighted (arrows, dotted lines, colored region)
  - A **text instruction** explaining how to take that measurement
- Each SVG is a simple human silhouette with the relevant area highlighted in accent color with measurement arrows

**SVG illustrations per measurement:**
- **Chest**: Body front view, horizontal dashed line around chest with arrows
- **Waist**: Body front view, horizontal line at narrowest torso point
- **Hips**: Body front view, horizontal line at widest hip area
- **Shoulders**: Body back view, horizontal line across shoulder points
- **Sleeve**: Body side view, line from shoulder to wrist
- **Neck**: Close-up neck area with circular measurement line
- **Inseam**: Body front view, vertical line along inner leg
- **Height**: Full body side view, vertical arrow floor to head

### 3. Share Measurement with Tailor at Checkout (`Checkout.tsx`)

- Add a "Share measurements with tailor" toggle below the MeasurementSelector, visible when a measurement is selected and the order involves a tailor (custom order or cart items with `tailor_id`)
- Pass the `shareMeasurements` flag along with the order
- Add info text: "Your tailor will be able to view these measurements to ensure a perfect fit"
- Update `MeasurementSelector` with an optional `shareable` prop to show a sharing note on the selected measurement

### Files Modified
- `src/components/measurements/AIBodyScanner.tsx` — SVG body position overlay
- `src/components/measurements/MeasurementGuideDialog.tsx` — **new file**, visual guide component with SVG illustrations and text per body part
- `src/components/checkout/MeasurementSelector.tsx` — integrate guide icons, shareable prop
- `src/pages/Checkout.tsx` — share-with-tailor toggle

### Technical Notes
- All SVGs are inline React components, no external assets needed
- No database changes required; tailor access uses existing RLS policy
- Guide dialog reuses existing `Dialog` component from shadcn/ui

