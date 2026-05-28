const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Query table list and column names
  const tables = ['sessions', 'school_grade_status', 'feedback'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
      
    if (error) {
      console.log(`Table "${table}" query error:`, error.message);
    } else {
      console.log(`Table "${table}" schema sample:`, data?.[0] ? Object.keys(data[0]) : "Empty table");
    }
  }
}

check();
