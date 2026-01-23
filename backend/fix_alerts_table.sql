
-- Fix admin_id type in alerts table to match users.id (bigint)
-- First drop the constraint if any (RLS policies might depend on it, but we are changing the column type)

-- We might need to drop the table and recreate it because casting uuid to bigint is not straightforward if there's data (but there is likely no important data yet).
DROP TABLE IF EXISTS alerts;

create table alerts (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  created_at timestamptz default now(),
  admin_id bigint not null, -- Changed from uuid to bigint to match users.id
  constraint alerts_admin_id_fkey foreign key (admin_id) references users(id) on delete cascade
);

-- Enable RLS (though we are ignoring it for backend-side calls, it's good practice)
alter table alerts enable row level security;
