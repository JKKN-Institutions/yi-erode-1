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
    console.log("API Paths:", Object.keys(data.paths || {}));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

check();
