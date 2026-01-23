-- Create the alerts table
create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  created_at timestamptz default now(),
  admin_id uuid not null
);

-- Enable RLS
alter table alerts enable row level security;

-- Policy 1: Everyone can read
create policy "Public alerts are viewable by everyone"
  on alerts for select
  using ( true );

-- Policy 2: Admin can delete their own alerts
-- Note: This requires the user to be authenticated via Supabase Auth and their UID to match admin_id
create policy "Admins can delete their own alerts"
  on alerts for delete
  using ( auth.uid() = admin_id );

-- Policy 3: Allow inserts (Matching ID)
create policy "Admins can create alerts"
  on alerts for insert
  with check ( auth.uid() = admin_id );

-- Enable Realtime
alter publication supabase_realtime add table alerts;
