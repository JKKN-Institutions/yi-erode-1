-- =============================================================================
-- Controlled Chat Room System — Request-Based Access
-- Mission ON: Smart Choices — Yi Erode Chapter
-- =============================================================================
-- Flow: Learner requests → Admin approves → Mentor opens → Chat open
-- Statuses: pending_admin → pending_mentor → open → closed
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CHAT_ROOMS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id           UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              TEXT        NOT NULL DEFAULT 'pending_admin'
                                  CHECK (status IN ('pending_admin', 'pending_mentor', 'open', 'closed')),
  learner_message     TEXT,                  -- optional note from learner when requesting
  admin_approved_at   TIMESTAMPTZ,           -- set when admin approves
  mentor_opened_at    TIMESTAMPTZ,           -- set when mentor opens
  closed_at           TIMESTAMPTZ,           -- set when mentor or admin closes
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CHAT_MESSAGES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDEXES for performance
-- ─────────────────────────────────────────────────────────────────────────────
-- Quickly look up a learner's active rooms
CREATE INDEX IF NOT EXISTS idx_chat_rooms_learner_status
  ON public.chat_rooms (learner_id, status);

-- Quickly look up a mentor's rooms by status
CREATE INDEX IF NOT EXISTS idx_chat_rooms_mentor_status
  ON public.chat_rooms (mentor_id, status);

-- Quickly find the latest admin-pending requests
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status_created
  ON public.chat_rooms (status, created_at DESC);

-- Efficiently fetch messages for a room in order
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
  ON public.chat_messages (room_id, created_at ASC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. UPDATED_AT TRIGGER for chat_rooms
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_rooms_set_updated_at ON public.chat_rooms;
CREATE TRIGGER chat_rooms_set_updated_at
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ENABLE ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.chat_rooms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS POLICIES — CHAT_ROOMS
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 6a. Learner: can see their own rooms ──────────────────────────────────────
DROP POLICY IF EXISTS "Learner can view own chat rooms" ON public.chat_rooms;
CREATE POLICY "Learner can view own chat rooms"
  ON public.chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = learner_id
  );

-- ── 6b. Learner: can request a new chat room (INSERT) ────────────────────────
DROP POLICY IF EXISTS "Learner can create chat room request" ON public.chat_rooms;
CREATE POLICY "Learner can create chat room request"
  ON public.chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = learner_id
    -- Verify the requesting user is indeed a learner
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('learner', 'student')
    )
  );

-- ── 6c. Mentor: can see rooms assigned to them ───────────────────────────────
DROP POLICY IF EXISTS "Mentor can view assigned chat rooms" ON public.chat_rooms;
CREATE POLICY "Mentor can view assigned chat rooms"
  ON public.chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = mentor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'mentor'
    )
  );

-- ── 6d. Admin: can see ALL chat rooms ────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can view all chat rooms" ON public.chat_rooms;
CREATE POLICY "Admin can view all chat rooms"
  ON public.chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- ── 6e. Admin: can update any chat room (approve/reject) ─────────────────────
DROP POLICY IF EXISTS "Admin can update any chat room" ON public.chat_rooms;
CREATE POLICY "Admin can update any chat room"
  ON public.chat_rooms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- ── 6f. Mentor: can update their own assigned rooms (open/close) ─────────────
DROP POLICY IF EXISTS "Mentor can update assigned chat rooms" ON public.chat_rooms;
CREATE POLICY "Mentor can update assigned chat rooms"
  ON public.chat_rooms
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = mentor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'mentor'
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = mentor_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'mentor'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RLS POLICIES — CHAT_MESSAGES
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 7a. Learner: can read messages in their open rooms ───────────────────────
DROP POLICY IF EXISTS "Learner can read messages in own open rooms" ON public.chat_messages;
CREATE POLICY "Learner can read messages in own open rooms"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id
        AND cr.learner_id = (SELECT auth.uid())
        AND cr.status = 'open'
    )
  );

-- ── 7b. Learner: can INSERT messages in their open rooms ─────────────────────
DROP POLICY IF EXISTS "Learner can send messages in own open rooms" ON public.chat_messages;
CREATE POLICY "Learner can send messages in own open rooms"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id
        AND cr.learner_id = (SELECT auth.uid())
        AND cr.status = 'open'
    )
  );

-- ── 7c. Mentor: can read messages in open rooms assigned to them ─────────────
DROP POLICY IF EXISTS "Mentor can read messages in assigned open rooms" ON public.chat_messages;
CREATE POLICY "Mentor can read messages in assigned open rooms"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id
        AND cr.mentor_id = (SELECT auth.uid())
        AND cr.status = 'open'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = (SELECT auth.uid())
            AND role = 'mentor'
        )
    )
  );

-- ── 7d. Mentor: can INSERT messages in open rooms assigned to them ────────────
DROP POLICY IF EXISTS "Mentor can send messages in assigned open rooms" ON public.chat_messages;
CREATE POLICY "Mentor can send messages in assigned open rooms"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id
        AND cr.mentor_id = (SELECT auth.uid())
        AND cr.status = 'open'
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = (SELECT auth.uid())
            AND role = 'mentor'
        )
    )
  );

-- ── 7e. Admin: can read all messages in all rooms ────────────────────────────
DROP POLICY IF EXISTS "Admin can read all chat messages" ON public.chat_messages;
CREATE POLICY "Admin can read all chat messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. GRANT TABLE ACCESS to authenticated role (Data API exposure)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON public.chat_rooms    TO authenticated;
GRANT SELECT, INSERT         ON public.chat_messages TO authenticated;
GRANT ALL                    ON public.chat_rooms    TO service_role;
GRANT ALL                    ON public.chat_messages TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ENSURE profiles table has required columns for the chat system
--    (pseudo_name, school_id, assigned_mentor_id, mentor_change_status)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- pseudo_name: anonymous alias for mentors shown to learners
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pseudo_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN pseudo_name TEXT;
  END IF;

  -- school_id: the school a learner has enrolled in
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN school_id UUID;
  END IF;

  -- assigned_mentor_id: mentor assigned to a learner
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'assigned_mentor_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN assigned_mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- mentor_change_status: tracks learner's mentor-change request status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'mentor_change_status'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN mentor_change_status TEXT NOT NULL DEFAULT 'none'
      CHECK (mentor_change_status IN ('none', 'requested', 'approved', 'denied'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. SCHOOLS TABLE (required for learner school selection)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schools (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT    NOT NULL,
  district       TEXT,
  board_type     TEXT    CHECK (board_type IN ('CBSE', 'Matriculation', 'Government')),
  contact_person TEXT,
  phone          TEXT,
  email          TEXT,
  address        TEXT,
  status         TEXT    NOT NULL DEFAULT 'registered'
                         CHECK (status IN ('registered', 'assessed', 'scheduled', 'completed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read schools (needed for learner school selection)
DROP POLICY IF EXISTS "Authenticated users can read schools" ON public.schools;
CREATE POLICY "Authenticated users can read schools"
  ON public.schools
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete schools
DROP POLICY IF EXISTS "Admin can manage schools" ON public.schools;
CREATE POLICY "Admin can manage schools"
  ON public.schools
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. VERIFICATION — Confirm tables and policies exist
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  t.table_name,
  COUNT(p.policyname) AS rls_policy_count,
  t.row_security
FROM information_schema.tables t
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public'
  AND t.table_name IN ('chat_rooms', 'chat_messages', 'profiles', 'schools')
GROUP BY t.table_name, t.row_security
ORDER BY t.table_name;
