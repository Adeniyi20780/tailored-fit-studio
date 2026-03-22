

## Plan: Environment-Aware Google Sign-In

### Problem
The `lovable.auth.signInWithOAuth` flow only works on Lovable's hosted infrastructure (uses `/~oauth` route). When self-hosting locally or externally, this route doesn't exist, causing a "page not found" error.

### Solution
Detect whether the app is running on Lovable's domain. If yes, use the managed `lovable.auth.signInWithOAuth`. If not, fall back to `supabase.auth.signInWithOAuth` directly.

### Changes

**File: `src/pages/Auth.tsx`**
- Update `handleGoogleSignIn` to check if `window.location.hostname` ends with `.lovable.app` or `.lovable.dev`
- If on Lovable: use existing `lovable.auth.signInWithOAuth("google", ...)`
- If self-hosted: use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
- Add `supabase` import from `@/integrations/supabase/client`

### Detection Logic
```text
if hostname includes "lovable.app" or "lovable.dev"
  → use lovable.auth.signInWithOAuth (managed flow)
else
  → use supabase.auth.signInWithOAuth (direct flow, requires own Google OAuth credentials configured in Supabase dashboard)
```

### Prerequisites for Self-Hosting
Users must configure their own Google OAuth Client ID and Secret in the backend authentication settings, with the correct redirect URI pointing to their Supabase callback URL.

