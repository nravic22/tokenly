# Supabase Setup Guide for Tokenly

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Name it `tokenly`, choose a password, select a region
4. Wait for the project to be created (~1 minute)

## Step 2: Create the Profiles Table

Go to **SQL Editor** in your Supabase dashboard and run:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Team Member',
  dept TEXT DEFAULT 'General',
  avatar TEXT,
  wallet_address TEXT,
  balance INTEGER DEFAULT 200,
  allowance INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles (for teammate list)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow inserting during signup
CREATE POLICY "Enable insert for signup"
  ON profiles FOR INSERT
  WITH CHECK (true);
```

## Step 3: Get Your API Keys

1. Go to **Settings → API** in your Supabase dashboard
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 4: Add Environment Variables

### For local development:
Create `.env.local` in your project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### For Vercel deployment:
1. Go to your Vercel project → **Settings → Environment Variables**
2. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Save** → Redeploy

## Step 5: Install Supabase dependency

```bash
npm install @supabase/supabase-js
```

## How It Works

- **Without Supabase configured**: App runs in demo mode with 3 dummy users. New signups are stored locally in memory (lost on refresh).
- **With Supabase configured**: Real signup creates an account in Supabase Auth + a profile row. Login verifies against Supabase. Data persists across sessions.

The app gracefully falls back to demo mode if Supabase isn't set up yet.
