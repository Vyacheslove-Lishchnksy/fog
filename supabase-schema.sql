-- Виконати в Supabase SQL Editor
create table if not exists fog_cells (
  user_id uuid references auth.users(id) on delete cascade not null,
  cell_id text not null,
  visited_at timestamptz default now(),
  primary key (user_id, cell_id)
);

alter table fog_cells enable row level security;

drop policy if exists "own cells" on fog_cells;
create policy "own cells"
on fog_cells for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
