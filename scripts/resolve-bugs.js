const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env configuration. Check your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("🤖 Starting Antigravity Agent Bug Resolution Worker...");
  
  // 1. Fetch bug reports assigned to Antigravity
  const { data: queue, error: fetchErr } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('status', 'in_progress')
    .like('admin_response', '%Assigned to Antigravity%');

  if (fetchErr) {
    console.error("Error fetching queue:", fetchErr.message);
    process.exit(1);
  }

  if (!queue || queue.length === 0) {
    console.log("✅ No active bugs in the Antigravity queue.");
    return;
  }

  console.log(`🔍 Found ${queue.length} bug(s) assigned to Antigravity. Processing...`);

  for (const bug of queue) {
    console.log(`--------------------------------------------------`);
    console.log(`Processing Bug [ID: ${bug.id}]`);
    console.log(`Title: "${bug.title}"`);
    console.log(`Description: "${bug.description}"`);
    console.log(`Reporter: ${bug.reporter_name} (${bug.reporter_role})`);

    const query = `${bug.title} ${bug.description}`.toLowerCase();
    
    // Check if it matches Rule 1: Grade selection / dropdown missing
    const isRule1 = query.includes('grade') || 
                    query.includes('dropdown') || 
                    query.includes('choose grade') || 
                    query.includes('enrolled') || 
                    (bug.page_url && bug.page_url.includes('sessions'));

    if (isRule1) {
      console.log("🎯 Match identified: Rule 1 (Grade Enrollment Missing)");
      
      const sessionPagePath = path.join(process.cwd(), 'app', 'school-dashboard', 'sessions', 'page.js');
      if (!fs.existsSync(sessionPagePath)) {
        console.error(`File not found: ${sessionPagePath}`);
        continue;
      }

      let content = fs.readFileSync(sessionPagePath, 'utf8');

      // Check if the warning alert banner is already injected
      if (content.includes('No Enrolled Grades Found:')) {
        console.log("💡 The warning banner is already present in the sessions page.");
        
        // Update bug status directly
        await updateBugStatus(bug.id, 'resolved', 'Antigravity Agent verified that the sessions page already contains a Grade Enrollment warning banner.');
        continue;
      }

      // Inject the alert banner below the page header
      const targetHeader = `<div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Sessions & Progression</h1>
        <p className="page-subtitle">Schedule sessions for enrolled grades and track progress</p>
      </div>`;

      if (!content.includes(targetHeader)) {
        console.error("Could not find the target header inside sessions/page.js. Code structure might have changed.");
        await updateBugStatus(bug.id, 'in_progress', 'Antigravity Agent could not inject the warning banner: unexpected code structure.');
        continue;
      }

      const replacementHeader = `<div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Sessions & Progression</h1>
        <p className="page-subtitle">Schedule sessions for enrolled grades and track progress</p>
      </div>

      {enrolledGrades.length === 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          color: '#f87171',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span><strong>No Enrolled Grades Found:</strong> Please enroll participating grade levels in your School Profile to schedule sessions.</span>
          </span>
          <Link href="/school-dashboard" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
            Enroll Grades
          </Link>
        </div>
      )}`;

      // Save a backup of the file before editing
      const backupPath = `${sessionPagePath}.bak`;
      fs.writeFileSync(backupPath, content);

      try {
        console.log("🛠️ Injecting warning banner...");
        content = content.replace(targetHeader, replacementHeader);
        fs.writeFileSync(sessionPagePath, content);

        // 2. Validate with next build
        console.log("🧱 Running build validation (npm run build)...");
        execSync('npm run build', { stdio: 'inherit' });
        
        console.log("✅ Build validation passed!");
        fs.unlinkSync(backupPath); // Delete backup

        // 3. Mark as resolved
        await updateBugStatus(bug.id, 'resolved', 'Antigravity Agent resolved this bug automatically: Added warning banner to sessions page (app/school-dashboard/sessions/page.js) and successfully validated Next.js build.');
      } catch (buildErr) {
        console.error("❌ Build validation failed. Reverting changes...");
        // Revert to backup
        try {
          const originalContent = fs.readFileSync(backupPath, 'utf8');
          fs.writeFileSync(sessionPagePath, originalContent);
          fs.unlinkSync(backupPath);
        } catch (revertErr) {
          console.error("Error reverting from backup:", revertErr);
        }

        await updateBugStatus(bug.id, 'in_progress', `Antigravity Agent attempt failed: next build failed with error: ${buildErr.message}`);
      }
    } else {
      console.log("🤷 No specific rule match found. Cannot auto-resolve this category of bug yet.");
      await updateBugStatus(bug.id, 'open', 'Antigravity Agent could not auto-resolve: No matching resolution signature found for this bug description.');
    }
  }
}

async function updateBugStatus(id, status, response) {
  const payload = {
    status,
    admin_response: response
  };
  
  if (status === 'resolved') {
    payload.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('bug_reports')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error(`Error updating status for bug ${id}:`, error.message);
  } else {
    console.log(`📢 Updated bug ${id} status to: ${status}`);
  }
}

run();
