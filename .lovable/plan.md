

## Optimize AI Body Measurement for Low-Light Conditions

### Problem
In average/low lighting, the AI model produces low confidence scores (below 80%), and users cannot save measurements due to the 80% quality gate. This makes the scanner unusable in many real-world conditions.

### Solution
A multi-pronged approach: improve image quality before sending to AI, enhance the AI prompt for low-light tolerance, lower the save threshold to 70%, and add client-side image preprocessing.

### Changes

**1. Client-side image preprocessing (`src/components/measurements/AIBodyScanner.tsx`)**
- Before sending frames to the backend, apply canvas-based image enhancement:
  - Increase brightness and contrast on captured frames
  - Apply a simple histogram-stretch normalization
- Increase JPEG quality from 0.8 to 0.92 for better detail preservation
- Capture more frames (16 instead of 12) to give the AI more angles to work with

**2. Enhanced AI prompt for low-light resilience (`supabase/functions/process-body-scan/index.ts`)**
- Add explicit instructions to the system prompt telling the AI to:
  - Account for low-light and uneven lighting conditions
  - Use anatomical proportion ratios more aggressively when visual clarity is limited
  - Rely more heavily on the stated height as anchor when image quality is poor
  - Not penalize confidence scores excessively for moderate lighting issues — reserve low confidence for genuinely unreadable images
- Widen the anatomical ratio ranges slightly to be more forgiving
- Send up to 10 images instead of 8 to give more data points

**3. Lower save threshold to 70% (`src/components/measurements/AIBodyScanner.tsx`)**
- Change the confidence gate from 80% to 70% for saving measurements
- Update the UI badges: ≥80% = "High Accuracy", 70-79% = "Acceptable", <70% = "Low Accuracy — Rescan Required"
- Add a yellow/warning-styled banner for the 70-79% range advising users the measurements are usable but rescanning in better light would improve accuracy

**4. Capture tips for low light (`src/components/measurements/AIBodyScanner.tsx`)**
- Add a tip in the capture step suggesting users turn on room lights or use a lamp behind the camera
- Show a real-time brightness indicator on the camera preview (average pixel luminance) with a warning if it's too dark

### Files Modified
- `src/components/measurements/AIBodyScanner.tsx` — image preprocessing, threshold change, brightness indicator, UI updates
- `supabase/functions/process-body-scan/index.ts` — enhanced prompt, more images, adjusted clamping ranges

