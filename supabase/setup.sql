-- Run this in your Supabase SQL Editor (Database → SQL Editor → New query)
-- This creates all three tables the pool needs.

-- 1. Participants: stores each person's name and their 4 team picks
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  teams text[] not null,  -- array of 4 team names, one per tier
  created_at timestamptz default now()
);

-- 2. Group Results: W/D/L for each team's 3 group stage games
create table if not exists group_results (
  team text not null,
  game_index int not null,   -- 0, 1, or 2
  result text not null,      -- 'W', 'D', or 'L'
  primary key (team, game_index)
);

-- 3. Knockout Stages: how far each team advanced
create table if not exists knockout_stages (
  team text primary key,
  stage text not null  -- 'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Runner-Up', 'Champion'
);

-- Enable Row Level Security (RLS) but allow public reads and inserts
-- (the admin panel is password-protected in the app itself)

alter table participants enable row level security;
alter table group_results enable row level security;
alter table knockout_stages enable row level security;

-- Allow anyone to read all tables (public standings)
create policy "Public read participants" on participants for select using (true);
create policy "Public read group_results" on group_results for select using (true);
create policy "Public read knockout_stages" on knockout_stages for select using (true);

-- Allow anyone to insert participants (self-signup)
create policy "Public insert participants" on participants for insert with check (true);

-- Allow anyone to insert/update/delete results (admin password is handled in-app)
create policy "Public insert group_results" on group_results for insert with check (true);
create policy "Public update group_results" on group_results for update using (true);
create policy "Public delete group_results" on group_results for delete using (true);

create policy "Public insert knockout_stages" on knockout_stages for insert with check (true);
create policy "Public update knockout_stages" on knockout_stages for update using (true);
create policy "Public delete knockout_stages" on knockout_stages for delete using (true);

-- Allow deleting participants (admin remove)
create policy "Public delete participants" on participants for delete using (true);

-- Enable realtime so standings update live
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table group_results;
alter publication supabase_realtime add table knockout_stages;
