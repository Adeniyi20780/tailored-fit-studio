

## Fix: Google OAuth 403 on Lovable Preview

### Problem
The environment detection in `Auth.tsx` checks for `lovable.app` and `lovable.dev` but misses `lovableproject.com` — the domain used by the Lovable preview. This causes it to fall through to the direct Supabase OAuth flow, which returns a 403 because the preview domain isn't configured in Google Cloud Console.

### Solution
Add `lovableproject.com` to the `isLovableHosted()` check.

### Change

**File: `src/pages/Auth.tsx`**

Update the `isLovableHosted` function:
```typescript
const isLovableHosted = () => {
  const hostname = window.location.hostname;
  return hostname.includes("lovable.app") || hostname.includes("lovable.dev") || hostname.includes("lovableproject.com");
};
```

Single-line change. No other files affected.

