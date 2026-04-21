-- Focus Rooms — Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'User',
  avatar_url text,
  instagram text,
  linkedin text,
  github text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Rooms table
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_by uuid references public.profiles(id),
  background_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. Room Participants
create table if not exists public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  is_mic_on boolean default false,
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

-- 4. Sticky Notes (personal, per user per room)
create table if not exists public.sticky_notes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text default '',
  position_x int default 50,
  position_y int default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Whiteboard Saves
create table if not exists public.whiteboard_saves (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  snapshot_url text not null,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.sticky_notes enable row level security;
alter table public.whiteboard_saves enable row level security;

-- Profiles: Users can read all profiles (for participant names), update their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- Rooms: Anyone authenticated can create/read rooms
create policy "Rooms are viewable by everyone" on public.rooms for select using (true);
create policy "Authenticated users can create rooms" on public.rooms for insert with check (auth.uid() = created_by);
create policy "Room creators can update their rooms" on public.rooms for update using (auth.uid() = created_by);

-- Room Participants: Authenticated users can join/leave
create policy "Participants are viewable by everyone" on public.room_participants for select using (true);
create policy "Users can join rooms" on public.room_participants for insert with check (auth.uid() = user_id);
create policy "Users can leave rooms" on public.room_participants for delete using (auth.uid() = user_id);
create policy "Users can update their own participation" on public.room_participants for update using (auth.uid() = user_id);

-- Sticky Notes: Only the owner can see/edit their notes (PRIVATE)
create policy "Users can only see their own notes" on public.sticky_notes for select using (auth.uid() = user_id);
create policy "Users can create their own notes" on public.sticky_notes for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on public.sticky_notes for update using (auth.uid() = user_id);
create policy "Users can delete their own notes" on public.sticky_notes for delete using (auth.uid() = user_id);

-- Whiteboard Saves: Users can save and view their own
create policy "Users can view their own whiteboard saves" on public.whiteboard_saves for select using (auth.uid() = user_id);
create policy "Users can save whiteboards" on public.whiteboard_saves for insert with check (auth.uid() = user_id);

-- Enable Realtime for relevant tables
alter publication supabase_realtime add table public.room_participants;

-- Function: Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Create profile when auth.users row is inserted
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function: Delete User Account
-- Security definer allows the function to execute with privileges
-- of the creator, allowing deletion from auth.users.
create or replace function public.delete_user()
returns void as $$$
begin
  delete from auth.users where id = auth.uid();
end;
$$$ language plpgsql security definer;
