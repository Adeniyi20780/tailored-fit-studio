

## Enhance AI Body Scanner: SVG Overlay, Height Unit Toggle, and Fullscreen Camera

### 1. Replace Body Position Guide SVG (`AIBodyScanner.tsx`, lines 699-701 and 730-732)

Replace both inline SVG silhouettes (demo mode and live camera) with the user-provided SVG:

```jsx
<svg viewBox="0 0 1420 2048" className="h-[80%] opacity-[0.18]">
  <path transform="translate(740,73)" d="m0 0h10l22 3 13 4..." fill="white" />
</svg>
```

- Fill changed to `white` for visibility on camera backgrounds
- Opacity `0.18` for a subtle guide
- `h-[80%]` to fit the taller aspect ratio

### 2. Height Input: CM/FT Toggle (`AIBodyScanner.tsx`)

In the save measurement dialog (where height is entered), add a unit toggle:

- Add `heightUnit` state: `"cm"` (default) or `"ft"`
- When `"ft"`, show two inputs: feet and inches (e.g., 5 ft 9 in)
- Convert to cm internally before saving (`(feet * 30.48) + (inches * 2.54)`)
- Display the toggle as two small buttons (`cm | ft`) next to the Height label
- Also apply this to the `MeasurementSelector.tsx` manual entry form

### 3. Fullscreen Camera Toggle (`AIBodyScanner.tsx`)

Add a fullscreen toggle button on the camera preview:

- Add `isFullscreen` state
- Add a `Maximize2`/`Minimize2` icon button (top-right of camera frame, next to brightness indicator)
- When active, the camera container gets `fixed inset-0 z-50` classes instead of the normal `aspect-[3/4]` sizing
- All overlay elements (silhouette, countdown, brightness, camera switch) remain functional in fullscreen
- Exit fullscreen via the minimize button or pressing Escape (add a `keydown` listener)
- Import `Maximize2` and `Minimize2` from lucide-react

### Files Modified
- `src/components/measurements/AIBodyScanner.tsx` — all three changes
- `src/components/checkout/MeasurementSelector.tsx` — height cm/ft toggle in manual entry form

