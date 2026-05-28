const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: schools, error: errSchools } = await supabase
    .from('schools')
    .select('id, name, contact_person, email');

  if (errSchools) {
    console.error("Error fetching schools:", errSchools.message);
  } else {
    console.log("--- Schools ---");
    schools.forEach(s => {
      console.log(`ID: ${s.id} | Name: ${s.name} | Contact: ${s.contact_person} | Email: ${s.email}`);
    });
  }

  const { data: coordinators, error: errCoords } = await supabase
    .from('profiles')
    .select('id, email, role, school_id')
    .eq('role', 'school_coordinator');

  if (errCoords) {
    console.error("Error fetching coordinators:", errCoords.message);
  } else {
    console.log("\n--- School Coordinators ---");
    coordinators.forEach(c => {
      console.log(`ID: ${c.id} | Email: ${c.email} | School ID: ${c.school_id}`);
    });
  }
}

run();
