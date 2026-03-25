

## Enhance AI Body Scanner: Brightness/Contrast Sliders, Timer Countdown, and Measurement Save Limits

### Overview
Three enhancements to the body scanner: (1) manual brightness/contrast sliders on the camera preview, (2) a pre-capture countdown timer with selectable durations, and (3) a save flow with custom naming, 3-measurement cap, and 75% minimum confidence threshold.

### Changes

**1. Manual Brightness/Contrast Sliders (`AIBodyScanner.tsx`)**
- Add `manualBrightness` (range 0–200, default 100) and `manualContrast` (range 0–200, default 100) state values
- Apply CSS `filter: brightness(X%) contrast(X%)` to the `<video>` element for real-time preview adjustment
- Render two `Slider` components (from `@/components/ui/slider`) below the camera preview, only visible during