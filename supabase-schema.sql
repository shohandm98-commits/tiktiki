-- Tiktiki: run this whole file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_url text not null,
  storage_path text not null unique,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists videos_created_at_idx on public.videos(created_at desc);

alter table public.profiles enable row level security;
alter table public.videos enable row level security;

drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Videos are public" on public.videos;
create policy "Videos are public" on public.videos for select using (true);

drop policy if exists "Users can insert own videos" on public.videos;
create policy "Users can insert own videos" on public.videos for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own videos" on public.videos;
create policy "Users can delete own videos" on public.videos for delete using (auth.uid() = user_id);

-- Create a profile automatically whenever a Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)))
  );
  return new;
exception when unique_violation then
  raise exception 'USERNAME_TAKEN';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Storage bucket for uploaded videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 524288000, array['video/mp4','video/webm','video/quicktime','video/x-matroska'])
on conflict (id) do update set public = true, file_size_limit = 524288000;

drop policy if exists "Public can view Tiktiki videos" on storage.objects;
create policy "Public can view Tiktiki videos" on storage.objects for select using (bucket_id = 'videos');

drop policy if exists "Authenticated users can upload Tiktiki videos" on storage.objects;
create policy "Authenticated users can upload Tiktiki videos" on storage.objects for insert to authenticated
with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own Tiktiki videos" on storage.objects;
create policy "Users can delete own Tiktiki videos" on storage.objects for delete to authenticated
using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
