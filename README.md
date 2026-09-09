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
