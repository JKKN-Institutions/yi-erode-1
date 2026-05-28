const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Query all tables using postgres system catalog
  const { data, error } = await supabase
    .rpc('get_tables_list'); // checking if there's any custom rpc first

  if (error) {
    // Fallback: try querying a common catalog table or use execute_sql if we can.
    // Wait, let's query the public schema tables list if possible
    console.log("No get_tables_list RPC. Querying via select from pg_catalog or standard schema tables...");
    
    // We can execute a query to find tables, but since Supabase REST API doesn't let us query pg_tables directly unless we have an RPC or use a known table,
    // let's try querying standard tables that we know or check if there's an activity_log or bug_reports table.
  }
  
  // Let's try querying some potential tables:
  const tablesToCheck = ['activity_logs', 'activity_log', 'bug_reports', 'bug_report', 'mentors', 'assessments', 'sessions', 'profiles', 'schools', 'school_grade_status'];
  for (const table of tablesToCheck) {
    const { data: row, error: tableErr } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (tableErr) {
      console.log(`Table '${table}' does not exist or error: ${tableErr.message}`);
    } else {
      console.log(`Table '${table}' EXISTS!`);
    }
  }
}

run();
