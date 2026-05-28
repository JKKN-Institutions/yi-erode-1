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
    if (data.definitions && data.definitions.sessions) {
      console.log("Sessions columns:", Object.keys(data.definitions.sessions.properties));
      console.log("end_time detail:", data.definitions.sessions.properties.end_time);
      console.log("start_time detail:", data.definitions.sessions.properties.start_time);
    } else {
      console.log("Sessions definitions not found.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

check();
