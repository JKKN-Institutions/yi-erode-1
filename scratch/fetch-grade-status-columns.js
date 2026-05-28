const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    const data = await res.json();
    if (data.definitions && data.definitions.school_grade_status) {
      console.log("school_grade_status columns:", Object.keys(data.definitions.school_grade_status.properties));
      console.log("school_grade_status details:", data.definitions.school_grade_status.properties);
    } else {
      console.log("school_grade_status definitions not found. Definitions list:", Object.keys(data.definitions || {}));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

check();
