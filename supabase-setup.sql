-- Project Shield Database Setup
-- Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Idempotent: safe to re-run.

-- 1. Create profiles table (TEXT role with CHECK constraint, not an ENUM)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'learner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1a. If the role column is still the legacy user_role ENUM, convert it to TEXT
-- so 'learner' (and any future labels) can be assigned without enum migrations.
DO $$
DECLARE
  v_data_type TEXT;
BEGIN
  SELECT data_type INTO v_data_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'profiles'
     AND column_name  = 'role';

  IF v_data_type = 'USER-DEFINED' THEN
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT';
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text';
  END IF;
END $$;

-- 1b. Migrate any pre-existing 'student' / 'unassigned' / null rows to 'learner'
UPDATE public.profiles SET role = 'learner' WHERE role IS NULL OR role IN ('student', 'unassigned');

-- 1c. Drop any older CHECK constraint and add the canonical one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'mentor', 'school_coordinator', 'learner'));

-- 1d. Ensure the column default is 'learner'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'learner';

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies: Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Policies: Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Policies: Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Policy: Admin users can read ALL profiles (for role management page)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Policy: Admin users can update ALL profiles (to change roles)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Auto-create profile on signup (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    CASE
      WHEN NEW.email = 'krishnaveni_a@jkkn.ac.in' THEN 'admin'
      WHEN NEW.email = 'krishna.biochem85@gmail.com' THEN 'admin'
      ELSE 'learner'
    END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    role = CASE
      WHEN EXCLUDED.email = 'krishnaveni_a@jkkn.ac.in' THEN 'admin'
      WHEN EXCLUDED.email = 'krishna.biochem85@gmail.com' THEN 'admin'
      ELSE profiles.role
    END,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
