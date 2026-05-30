"use server";

import fs from 'fs';
import path from 'path';

/**
 * Local AI Bug Diagnostic Engine
 * Analyzes reported issues using semantic pattern matching, page context, and code references.
 */
export async function diagnoseBug(title, description = '', pageUrl = '') {
  const query = `${title} ${description}`.toLowerCase();
  
  // Rule 1: Grade selection / dropdown missing in school coordinator dashboard
  if (
    query.includes('grade') || 
    query.includes('dropdown') || 
    query.includes('choose grade') || 
    query.includes('enrolled') || 
    (pageUrl && pageUrl.includes('sessions'))
  ) {
    return {
      confidence: 95,
      title: "School Grade Enrollment Missing",
      rootCause: "The school coordinator is trying to schedule a session or view details for a grade, but the school has not enrolled any grades in their profile yet. By default, newly registered schools have empty enrolled grades, which results in empty dropdown lists.",
      recommendation: "1. Instruct the School Coordinator to go to their School Dashboard Home Page.\n2. Scroll down to the 'Enrolled Grades' section.\n3. Choose a grade level (e.g. Grade 8, 9, 10, 11, or 12) from the dropdown and click 'Enroll'.\n4. Once enrolled, the grade will immediately appear in the Sessions and Attendance dropdown lists.\n\n*Developer recommendation*: Add a helpful UI alert on the sessions page when no grades are enrolled, prompting coordinators with a link to enroll grades.",
      files: [
        { path: "/app/school-dashboard/sessions/page.js", label: "School Sessions UI (dropdown rendering)" },
        { path: "/app/school-dashboard/page.js", label: "School Dashboard Homepage (grade enrollment form)" },
        { path: "/utils/school-actions.js", label: "School Database actions" }
      ]
    };
  }

  // Rule 2: Account not linked or waiting for school assignment
  if (
    query.includes('not assigned') || 
    query.includes('assignment') || 
    query.includes('link') || 
    query.includes('waiting for') || 
    query.includes('coordinator role')
  ) {
    return {
      confidence: 90,
      title: "School Coordinator Account Unlinked",
      rootCause: "A user registered with the 'school_coordinator' role, but their profile in the database is not linked to any school ID (school_id is null).",
      recommendation: "1. Navigate to the Admin Dashboard Roster or School Coordinators list.\n2. Locate the coordinator's profile.\n3. Click 'Assign School' and select their respective school to link the profile.\n4. Ask the user to refresh their page.",
      files: [
        { path: "/app/admin-dashboard/schools-list/page.js", label: "Admin School List" },
        { path: "/components/Sidebar.js", label: "Sidebar Session Check" },
        { path: "/utils/school-actions.js", label: "School Allocation Action" }
      ]
    };
  }

  // Rule 3: Chat request notification / interaction room
  if (
    query.includes('chat') || 
    query.includes('interaction') || 
    query.includes('room') || 
    query.includes('mentor change') || 
    query.includes('notify')
  ) {
    return {
      confidence: 88,
      title: "Chat Request / Notification flow",
      rootCause: "A learner requested a chat interaction session or a mentor change, which requires admin approval or active status transitions.",
      recommendation: "1. Open the Admin Notifications Sidebar from the left menu.\n2. Look under 'Chat Requests' or 'Mentor Changes'.\n3. Click 'Approve' to approve the chat session or 'Approve & Reset Mentor' to process the change request.",
      files: [
        { path: "/components/Sidebar.js", label: "Admin Notifications Drawer Panel" },
        { path: "/utils/admin-chat-actions.js", label: "Admin Notification Retrieval and Approvals" }
      ]
    };
  }

  // Rule 4: General database connection / RLS policies
  if (
    query.includes('database') || 
    query.includes('rls') || 
    query.includes('permission') || 
    query.includes('policy') || 
    query.includes('error fetching')
  ) {
    return {
      confidence: 80,
      title: "Supabase Row-Level Security (RLS) or RLS policy violation",
      rootCause: "The query to Supabase was rejected, likely due to Row Level Security (RLS) policies not granting select/insert/update access to the current authenticated user's role.",
      recommendation: "1. Verify RLS policies on the affected table in Supabase dashboard.\n2. Ensure authenticated users have policies for selecting or inserting records depending on their metadata roles.",
      files: [
        { path: "/supabase/migrations/", label: "Database Migrations folder" }
      ]
    };
  }

  // Fallback Rule: Codebase keyword search
  // Try to find files in the app folder that contain keywords from the bug title
  const keywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const matchedFiles = [];
  
  try {
    const appDir = path.join(process.cwd(), 'app');
    const scanDir = (dir) => {
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
          const matches = keywords.filter(kw => content.includes(kw));
          if (matches.length > 0) {
            const relPath = fullPath.replace(process.cwd(), '').replace(/\\/g, '/');
            matchedFiles.push({
              path: relPath,
              label: `Matched ${matches.length} keyword(s): ${matches.join(', ')}`
            });
          }
        }
      });
    };
    
    if (keywords.length > 0 && fs.existsSync(appDir)) {
      scanDir(appDir);
    }
  } catch (e) {
    console.error("Local diagnostic file scan failed:", e);
  }

  return {
    confidence: 60,
    title: "General Codebase Diagnosis",
    rootCause: `No exact matching signature found. Keywords parsed: [${keywords.join(', ')}].`,
    recommendation: "Analyze the code references below for files containing terms from this bug report to locate the root issue.",
    files: matchedFiles.slice(0, 4).length > 0 ? matchedFiles.slice(0, 4) : [
      { path: "/app/page.js", label: "App Root page" }
    ]
  };
}
