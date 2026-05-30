// scratch/run-chat-migration.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rqoaoqmbnwjyseluqgyo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb2FvcW1ibndqeXNlbHVxZ3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4MTExNSwiZXhwIjoyMDkwODU3MTE1fQ.EjzdKNhZkAtzlJN0FCcdwH1ZkCH-GjtggR2U4pEfTFs';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTable(tableName) {
  const { error } = await supabase.from(tableName).select('id').limit(1);
  if (!error) return 'exists';
  if (error.code === '42P01') return 'missing';
  return error.message;
}

async function run() {
  console.log('Checking existing tables...');
  
  const roomsStatus = await checkTable('chat_rooms');
  const messagesStatus = await checkTable('chat_messages');
  
  console.log('chat_rooms:', roomsStatus);
  console.log('chat_messages:', messagesStatus);
  
  if (roomsStatus === 'exists' && messagesStatus === 'exists') {
    console.log('\n✅ Both tables already exist! Migration already applied.');
    return;
  }

  console.log('\n❌ Tables missing. Please run the following SQL in your Supabase Dashboard > SQL Editor:');
  console.log('https://supabase.com/dashboard/project/rqoaoqmbnwjyseluqgyo/sql/new\n');
  console.log('='.repeat(60));
  console.log(`
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_admin'
    CHECK (status IN ('pending_admin', 'pending_mentor', 'open', 'closed')),
  learner_message TEXT,
  admin_approved_at TIMESTAMPTZ,
  mentor_opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learner_view_own_rooms" ON chat_rooms;
CREATE POLICY "learner_view_own_rooms" ON chat_rooms
  FOR SELECT USING (auth.uid() = learner_id);

DROP POLICY IF EXISTS "learner_request_room" ON chat_rooms;
CREATE POLICY "learner_request_room" ON chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

DROP POLICY IF EXISTS "mentor_view_assigned_rooms" ON chat_rooms;
CREATE POLICY "mentor_view_assigned_rooms" ON chat_rooms
  FOR SELECT USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "mentor_update_assigned_rooms" ON chat_rooms;
CREATE POLICY "mentor_update_assigned_rooms" ON chat_rooms
  FOR UPDATE USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "participants_view_messages" ON chat_messages;
CREATE POLICY "participants_view_messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
        AND chat_rooms.status = 'open'
        AND (chat_rooms.learner_id = auth.uid() OR chat_rooms.mentor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "participants_send_messages" ON chat_messages;
CREATE POLICY "participants_send_messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
        AND chat_rooms.status = 'open'
        AND (chat_rooms.learner_id = auth.uid() OR chat_rooms.mentor_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_chat_rooms_learner_id ON chat_rooms(learner_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_mentor_id ON chat_rooms(mentor_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
`);
  console.log('='.repeat(60));
}

run().catch(console.error);
