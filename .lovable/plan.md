

## Add Front/Back Camera Toggle for Mobile Users

### Problem
The camera is hardcoded to `facingMode: "environment"` (back camera), making it impractical on mobile since users can't see themselves while doing the 360° spin.

### Solution
Add a camera toggle button that lets mobile users switch between front and back cameras. Default to front camera (`"user"`) since that's more practical for self-scanning.

### Changes

**File: `src/components/measurements/AIBodyScanner.tsx`**

1. Add `facingMode` state, defaulting to `"user"` (front camera)
2. Add a `SwitchCamera` (or `RefreshCw`) icon button in the camera preview overlay to toggle between front/back
3. Update `startCamera()` to use the `facingMode` state instead of hardcoded `"environment"`
4. When toggling, stop the current stream and restart with the new facing mode
5. Mirror the video preview horizontally when using front camera (`transform: scaleX(-1)`) for a natural selfie-like experience

### UI
- A small circular toggle button overlaid on the top-right corner of the camera preview
- Only visible on the capture step when not in demo mode
- Uses the `RefreshCw` or a camera-switch icon

