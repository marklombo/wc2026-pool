# WC 2026 Pool — Setup Guide
## You'll be live in ~15 minutes. No coding required.

---

## STEP 1 — Set up Supabase (your database) ~5 min

1. Go to https://supabase.com and sign up with your personal Google account (free)
2. Click **"New project"**
   - Name it: `wc2026-pool`
   - Set a database password (save it somewhere, you won't need it often)
   - Region: pick the closest to you (US East or US West)
   - Click **Create new project** and wait ~2 min for it to spin up
3. Once ready, go to **SQL Editor** (left sidebar) → **New query**
4. Open the file `supabase/setup.sql` from this folder, copy the entire contents, paste it in, and click **Run**
   - You should see "Success" — this creates your 3 database tables
5. Go to **Settings** → **API** and copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

## STEP 2 — Set up Vercel (your website host) ~5 min

1. Go to https://github.com and sign up / log in with your personal account (free)
2. Create a new repository:
   - Click **+** → **New repository**
   - Name: `wc2026-pool`
   - Private is fine
   - Click **Create repository**
3. Upload the project files:
   - Click **uploading an existing file**
   - Drag in everything from this folder (all files and the `src/` and `supabase/` folders)
   - Commit with message "initial"
4. Go to https://vercel.com and sign up with your GitHub account (free)
5. Click **Add New → Project** → import your `wc2026-pool` repo
6. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → paste your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` → paste your Supabase anon key
   - `VITE_ADMIN_PASSWORD` → choose your own admin password (e.g. `soccer2026`)
7. Click **Deploy** — Vercel builds it (~1 min)
8. You'll get a URL like `wc2026-pool.vercel.app` — that's your shareable link! 🎉

---

## STEP 3 — Share it

- **For signups:** Share the URL with your team. Anyone can go to the "Join" tab and pick their 4 teams.
- **For standings:** Everyone hits the same URL and sees the live leaderboard.
- **For results:** You log in to the Admin tab (using the password you set), and set knockout stage results. Group stage auto-updates from live match data.

---

## How scoring works

**Group Stage** (auto-updated from live data):
- Win = 3 pts
- Draw = 1 pt
- Loss = 0 pts
- Max 9 pts over 3 games

**Knockout Rounds** (you set these in Admin → Knockout Stages):
- Round of 32 = 4 pts
- Round of 16 = 5 pts
- Quarterfinal = 6 pts
- Semifinal = 7 pts
- Runner-Up = 8 pts
- Champion = 9 pts

Points are the same for all tiers in knockouts — underdogs earn their advantage from surviving the group stage.

---

## Tips

- Deadline for picks: tell your team to sign up before June 11 (first match)
- The standings refresh automatically every 5 minutes, or anyone can hit the ↻ Refresh button
- If you ever need to remove someone's picks, go to Admin → Participants
- To change your admin password, go to Vercel → your project → Settings → Environment Variables

---

## Need help?

If anything goes wrong, the two most common issues are:
1. **"Error saving picks"** → double-check your Supabase URL and anon key in Vercel environment variables
2. **Scores not updating** → the openfootball data source updates a few minutes after each match ends; just hit Refresh
