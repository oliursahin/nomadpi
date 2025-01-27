-- Create profiles table that automatically links with auth.users
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policy to allow users to view their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- Create policy to allow users to update their own profile
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Create devices table
create table devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null,
  status text not null default 'offline',
  last_connected timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table devices enable row level security;

-- Create policy to allow users to view their own devices
create policy "Users can view own devices" on devices
  for select using (auth.uid() = user_id);

-- Create policy to allow users to create their own devices
create policy "Users can create devices" on devices
  for insert with check (auth.uid() = user_id);

-- Create policy to allow users to update their own devices
create policy "Users can update own devices" on devices
  for update using (auth.uid() = user_id);

-- Create policy to allow users to delete their own devices
create policy "Users can delete own devices" on devices
  for delete using (auth.uid() = user_id);

-- Create VPN connections table
create table vpn_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  config jsonb not null,
  status text not null default 'disconnected',
  device_id uuid references devices on delete cascade,
  last_connected timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table vpn_connections enable row level security;

-- Create policy to allow users to view their own VPN connections
create policy "Users can view own vpn connections" on vpn_connections
  for select using (auth.uid() = user_id);

-- Create policy to allow users to create their own VPN connections
create policy "Users can create vpn connections" on vpn_connections
  for insert with check (auth.uid() = user_id);

-- Create policy to allow users to update their own VPN connections
create policy "Users can update own vpn connections" on vpn_connections
  for update using (auth.uid() = user_id);

-- Create policy to allow users to delete their own VPN connections
create policy "Users can delete own vpn connections" on vpn_connections
  for delete using (auth.uid() = user_id);

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
