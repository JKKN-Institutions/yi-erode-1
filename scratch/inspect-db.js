const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  // Query table list
  const { data: tables, error: tablesError } = await supabase
    .from('profiles')
    .select('role')
    .limit(1);

  if (tablesError) {
    console.error("Error querying profiles:", tablesError.message);
  } else {
    console.log("Profiles queried successfully");
  }

  // Let's do some query on pg_catalog or query data from school_grade_status
  console.log("\n--- Checking school_grade_status columns (via sample row query) ---");
  const { data: gradeStatus, error: gradeStatusError } = await supabase
    .from('school_grade_status')
    .select('*')
    .limit(1);
  if (gradeStatusError) {
    console.error("Error querying school_grade_status:", gradeStatusError.message);
  } else {
    console.log("school_grade_status columns:", Object.keys(gradeStatus[0] || {}));
    console.log("Sample school_grade_status:", gradeStatus[0]);
  }

  console.log("\n--- Checking sessions columns (via sample row query) ---");
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .limit(1);
  if (sessionsError) {
    console.error("Error querying sessions:", sessionsError.message);
  } else {
    console.log("sessions columns:", Object.keys(sessions[0] || {}));
    console.log("Sample sessions:", sessions[0]);
  }

  console.log("\n--- Checking assessments columns (via sample row query) ---");
  const { data: assessments, error: assessmentsError } = await supabase
    .from('assessments')
    .select('*')
    .limit(1);
  if (assessmentsError) {
    console.error("Error querying assessments:", assessmentsError.message);
  } else {
    console.log("assessments columns:", Object.keys(assessments[0] || {}));
    console.log("Sample assessments:", assessments[0]);
  }

  console.log("\n--- Checking schools columns (via sample row query) ---");
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('*')
    .limit(1);
  if (schoolsError) {
    console.error("Error querying schools:", schoolsError.message);
  } else {
    console.log("schools columns:", Object.keys(schools[0] || {}));
    console.log("Sample schools:", schools[0]);
  }
}

inspect();
