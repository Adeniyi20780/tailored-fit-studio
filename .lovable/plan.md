
Goal: implement all 5 requested fixes in one pass:
1) file/image attachments in seller messaging, 2) reliable email verification flow, 3) hero CTA buttons navigation, 4) stronger AI measurement reliability (>=80% confidence target), 5) unread-tab conversation/back behavior for tailor messaging.

What I found in current code:
- Messaging currently stores only text (`seller_messages.content`) and no attachment metadata.
- `useSellerMessages` derives `conversation_id` from `{currentUserId + tailorId}`. This is the root cause of thread mixups for tailor-side chat views and likely why unread-card behavior feels wrong.
- Messages page auto-marks unread conversations as read on open, so unread-tab state can disappear unexpectedly when user goes back.
- Hero/CTA buttons are visual only (no `Link`/`navigate` handlers).
- Signup/resend verification uses `emailRedirectTo: window.location.origin`; there is no dedicated callback handler page for token/code verification edge cases.
- AI scan already exposes confidence, but there’s no hard quality gate/workflow to enforce minimum confidence before save/use.
- Build currently has TS timer type issues (`NodeJS.Timeout`) in browser hooks; this should be cleaned while touching these flows.

Implementation plan:

1) Messaging schema + attachment support (backend)
- Create a migration to extend `seller_messages` with attachment fields:
  - `attachment_path text null`
  - `attachment_name text null`
  - `attachment_mime_type text null`
  - `attachment_size integer null`
- Add index on `(conversation_id, created_at)` if missing (kept efficient for history loading).
- Create a private storage bucket for message attachments (e.g. `message-attachments`) and secure policies:
  - Insert allowed only for authenticated sender into own folder convention.
  - Read allowed only to users who are sender/receiver in that conversation (policy checks conversation path segment against `seller_messages`).
- Keep existing RLS on `seller_messages`; no loosening needed.

2) Conversation threading fix (critical)
- Refactor `useSellerMessages` to support an explicit `conversationId` input.
- Stop deriving thread IDs from `tailorId` in inbox/chat-panel contexts.
- Use selected card’s `conversation_id` directly in:
  - `src/pages/Messages.tsx` chat panel
  - `src/components/store/TailorMessagesInbox.tsx` chat panel
- Keep product drawer able to start/find conversation, but generate IDs consistently using participant user IDs (not tailor DB ID) for new sends.
- Add one migration to normalize existing `conversation_id` values from sender/receiver pair so older mixed threads are split correctly.

3) Chat UI attachment UX
- Update `SellerMessageDrawer`, `Messages` chat panel, and `TailorMessagesInbox` composer:
  - attach button (image/file picker)
  - size/type validation
  - upload progress + remove-before-send
  - allow sending with text + optional file
- Update message bubble renderer:
  - inline image preview for image mime types
  - file chip with filename + download/open action for non-image files
- Ensure real-time updates include attachment metadata without refresh.

4) Unread tab + back behavior fixes
- Remove auto “mark read” on chat open (or move to explicit action only) so unread-tab card remains predictable.
- Ensure clicking unread card always opens correct thread (after conversationId refactor).
- Fix mobile back icon behavior:
  - if conversation was opened from list → return to list
  - if deep-linked from notification (`?conversation=...`) → fallback to `navigate(-1)` when appropriate.
- Preserve selected conversation state and avoid empty-state jumps caused by immediate read mutation.

5) Email verification reliability
- Add dedicated callback handler page (e.g. `/auth/callback`) to process:
  - `code` flow (`exchangeCodeForSession`)
  - `token_hash + type` flow (`verifyOtp`)
- Update signup + resend to use callback URL consistently.
- Add clear success/failure UI states for expired/used links and redirect user back to sign-in with actionable feedback.
- Keep existing “must verify before sign-in” enforcement in `AuthContext`.

6) Hero/CTA button wiring
- Wire landing actions with real routes:
  - Explore Tailors → `/tailors`
  - Start Your Store/Create Your Store → `/become-a-tailor` (protected route handles auth)
  - Start Shopping → `/catalog`
- Apply in both `HeroSection.tsx` and `CTASection.tsx`.

7) AI measurement reliability uplift (80% target)
- Frontend capture quality gates before submit:
  - minimum usable frames
  - clearer capture checklist + retry prompts
- Backend measurement hardening in processing function:
  - stricter prompt constraints and outlier sanity checks
  - if model returns confidence `<80`, return “retake required” status/message instead of silently accepting low-quality output.
- Results UI:
  - explicit “Below 80% confidence, please rescan” banner
  - disable “Save Measurements” when confidence < 80 unless user confirms override (optional safeguard).

8) Type-safety cleanup (blocking build errors)
- Replace `NodeJS.Timeout` refs with browser-safe timer types (`ReturnType<typeof setTimeout>`) in:
  - `src/hooks/useBodyScanJob.ts`
  - `src/hooks/useInactivityLogout.ts`

Technical details (files to touch):
- DB migration(s): `supabase/migrations/*` (seller message attachment columns, conversation-id normalization, storage bucket/policies)
- Messaging hooks/components:
  - `src/hooks/useSellerMessages.ts`
  - `src/pages/Messages.tsx`
  - `src/components/store/TailorMessagesInbox.tsx`
  - `src/components/product/SellerMessageDrawer.tsx`
- Auth verification:
  - `src/pages/Auth.tsx`
  - `src/contexts/AuthContext.tsx` (if callback handling is centralized)
  - `src/App.tsx` (callback route)
  - new `src/pages/AuthCallback.tsx`
- Landing buttons:
  - `src/components/landing/HeroSection.tsx`
  - `src/components/landing/CTASection.tsx`
- AI measurement:
  - `src/components/measurements/AIBodyScanner.tsx`
  - `supabase/functions/process-body-scan/index.ts`

Validation plan before handoff:
- Messaging E2E (customer ↔ tailor): unread tab, card open, back behavior, thread isolation, attachment send/receive/download.
- Notification deep link → opens exact conversation and responds correctly.
- Signup + verification + resend flow tested with valid and expired links.
- Landing hero/CTA buttons verified on mobile + desktop.
- AI scan retake path verified for confidence <80 and save path verified for >=80.
