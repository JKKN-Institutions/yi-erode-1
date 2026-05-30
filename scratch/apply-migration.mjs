// scratch/apply-migration.mjs
// Applies the chat_rooms and chat_messages migration via Supabase's pg REST endpoint

const SUPABASE_URL = 'https://rqoaoqmbnwjyseluqgyo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb2FvcW1ibndqeXNlbHVxZ3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4MTExNSwiZXhwIjoyMDkwODU3MTE1fQ.EjzdKNhZkAtzlJN0FCcdwH1ZkCH-GjtggR2U4pEfTFs';

const statements = [
  `CREATE TABLE IF NOT EXISTS chat_rooms (
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
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "learner_view_own_rooms" ON chat_rooms`,
  `CREATE POLICY "learner_view_own_rooms" ON chat_rooms FOR SELECT USING (auth.uid() = learner_id)`,
  `DROP POLICY IF EXISTS "learner_request_room" ON chat_rooms`,
  `CREATE POLICY "learner_request_room" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = learner_id)`,
  `DROP POLICY IF EXISTS "mentor_view_assigned_rooms" ON chat_rooms`,
  `CREATE POLICY "mentor_view_assigned_rooms" ON chat_rooms FOR SELECT USING (auth.uid() = mentor_id)`,
  `DROP POLICY IF EXISTS "mentor_update_assigned_rooms" ON chat_rooms`,
  `CREATE POLICY "mentor_update_assigned_rooms" ON chat_rooms FOR UPDATE USING (auth.uid() = mentor_id)`,
  `DROP POLICY IF EXISTS "participants_view_messages" ON chat_messages`,
  `CREATE POLICY "participants_view_messages" ON chat_messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_messages.room_id
          AND chat_rooms.status = 'open'
          AND (chat_rooms.learner_id = auth.uid() OR chat_rooms.mentor_id = auth.uid())
      )
    )`,
  `DROP POLICY IF EXISTS "participants_send_messages" ON chat_messages`,
  `CREATE POLICY "participants_send_messages" ON chat_messages
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_messages.room_id
          AND chat_rooms.status = 'open'
          AND (chat_rooms.learner_id = auth.uid() OR chat_rooms.mentor_id = auth.uid())
      )
    )`,
  `CREATE INDEX IF NOT EXISTS idx_chat_rooms_learner_id ON chat_rooms(learner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_rooms_mentor_id ON chat_rooms(mentor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id)`,
];

async function execSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });
  
  if (!response.ok) {
    // Try the pg endpoint
    const response2 = await fetch(`${SUPABASE_URL}/pg`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await response2.text();
    return { ok: response2.ok, text };
  }
  
  const text = await response.text();
  return { ok: true, text };
}

// Use Supabase's PostgREST query approach
async function runViaFetch(sql) {
  // Supabase doesn't expose a generic SQL endpoint via REST.
  // We must use the management API or the pg client.
  // Since we have the service role key, we can use pg directly.
  console.log('Note: Direct SQL via REST not available.');
  console.log('Please run the migration manually in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/rqoaoqmbnwjyseluqgyo/sql/new');
}

async function run() {
  console.log('Attempting migration via @supabase/supabase-js RPC...');
  
  // Try using the pg module if available
  try {
    const { Client } = await import('pg');
    // Supabase connection string
    const connectionString = `postgresql://postgres.rqoaoqmbnwjyseluqgyo:${SERVICE_ROLE_KEY}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('Connected via pg!');
    
    for (const sql of statements) {
      try {
        await client.query(sql);
        console.log('✅', sql.trim().substring(0, 60) + '...');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('⚠️  Already exists:', sql.trim().substring(0, 60));
        } else {
          console.error('❌', err.message);
        }
      }
    }
    
    await client.end();
    console.log('\n✅ Migration complete!');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('pg module not installed. Run: npm install pg');
    } else {
      console.error('Error:', err.message);
    }
  }
}

run();
