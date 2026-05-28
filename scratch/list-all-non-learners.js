const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .not('role', 'in', '("learner","student")')
    .order('role');

  if (error) {
    console.error("Error fetching profiles:", error.message);
  } else {
    console.log("--- Non-Learners ---");
    profiles.forEach(p => {
      console.log(`ID: ${p.id} | Email: ${p.email} | Name: ${p.full_name} | Role: ${p.role} | School ID: ${p.school_id}`);
    });
  }
}

run();
