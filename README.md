# Shadow Strike

Original retro run-and-gun web game inspired by the 1980s/1990s arcade genre. No Konami/Contra artwork, characters, music, names, or level layouts are included.

## Stack
- Next.js / React
- Supabase for auth, profiles, and leaderboard scores
- Vercel hosting
- Ad integration placeholders for a publisher-approved web ad network

## Run
1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and publishable key.
3. Apply `supabase/migrations/001_game_schema.sql` to your Supabase project.
4. `npm install`
5. `npm run dev`

## Monetization
Use a real ad network only after publisher approval. Keep ad placements outside gameplay controls, avoid accidental-click layouts, and never reward users for ordinary display-banner clicks. Rewarded ads should grant a revive only after the ad SDK confirms completion.


## Private administrator access

- Open `/admin` for the separate administrator sign-in page. The player lobby is not an admin login.
- Create the administrator account directly in Supabase Auth (do not add public admin registration).
- Set `SHADOW_STRIKE_ADMIN_EMAILS` to the exact administrator email address (comma-separated only if you intentionally add another trusted admin). The server checks this allowlist on every admin API request.
- Configure `SUPABASE_SERVICE_ROLE_KEY`, `BANK_DETAILS_ENCRYPTION_KEY` (32-byte hex), and `KORAPAY_SECRET_KEY` as server-only Vercel environment variables. Never prefix these with `NEXT_PUBLIC_`.
- Keep `SHADOW_STRIKE_CASH_ENABLED` and `KORAPAY_PAYOUTS_ENABLED` false until provider testing, score verification, compliance checks, and payout controls are complete.

## Tournament safety status

Cash-prize score submission is intentionally blocked until server-authoritative replay verification is implemented. Browser-reported scores are not sufficient evidence for cash awards. Prize awards use an atomic database function and require a different administrator from the score reviewer. Payout approval and payout initiation also require separate administrators.
