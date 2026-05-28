const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(10);

  if (error) {
    console.error("Error querying profiles:", error.message);
  } else {
    console.log("Profiles in database:");
    profiles.forEach(p => {
      console.log(`ID: ${p.id}, Email: ${p.email}, Role: ${p.role}, School ID: ${p.school_id}`);
    });
  }
}

check();
