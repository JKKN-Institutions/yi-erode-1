const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Recent Activity Logs ---");
  const { data: logs, error: logsError } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (logsError) {
    console.error("Error fetching activity logs:", logsError.message);
  } else {
    logs.forEach(l => {
      console.log(`[${l.created_at}] Action: ${l.action} | User: ${l.user_email || 'anonymous'} | Details: ${l.details}`);
    });
  }

  console.log("\n--- Recent Bug Reports ---");
  const { data: bugs, error: bugsError } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (bugsError) {
    console.error("Error fetching bug reports:", bugsError.message);
  } else {
    bugs.forEach(b => {
      console.log(`[${b.created_at}] User: ${b.user_email} | Title: ${b.title} | Desc: ${b.description}`);
    });
  }
}

run();
