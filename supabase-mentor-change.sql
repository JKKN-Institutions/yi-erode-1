-- =============================================================================
-- Migration: Add Mentor Change Requested By Column
-- Mission ON: Smart Choices — Yi Erode Chapter
-- =============================================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).
-- =============================================================================

-- Add mentor_change_requested_by column if it does not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mentor_change_requested_by TEXT;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('mentor_change_status', 'mentor_change_requested_by');
