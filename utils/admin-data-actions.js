"use server";

import { createClient } from "./supabase/server";

/**
 * Helper: Enrich profiles with emails from auth.users via secure RPC
 */
async function enrichWithEmails(supabase, profiles) {
  if (!profiles || profiles.length === 0) return profiles;
  
  const ids = profiles.map(p => p.id);
  const { data: emailData, error } = await supabase.rpc('get_user_emails', { user_ids: ids });
  
  if (error || !emailData) {
    console.error("Error fetching user emails:", error?.message);
    return profiles.map(p => ({ ...p, email: '—' }));
  }

  const emailMap = {};
  emailData.forEach(e => { emailMap[e.id] = e.email; });

  return profiles.map(p => ({
    ...p,
    email: emailMap[p.id] || '—'
  }));
}

// 1. Fetch School Coordinators + Schools
export async function getSchoolCoordinatorsList() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      school_id,
      schools:school_id (name, district, status)
    `)
    .eq('role', 'school_coordinator');
    
  if (error) {
    console.error("Error fetching school coordinators:", error);
    return [];
  }

  return enrichWithEmails(supabase, data);
}

// 2. Fetch Mentors Data
export async function getMentorsList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      phone,
      course,
      college,
      pseudo_name,
      mentor_availability (date, type),
      session_mentors (
        sessions (id, session_date, schools(name))
      )
    `)
    .eq('role', 'mentor');
    
  if (error) {
    console.error("Error fetching mentors:", error);
    return [];
  }

  return enrichWithEmails(supabase, data);
}

// 3. Fetch Learners Data
export async function getLearnersList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      academic_class,
      school_id,
      schools:school_id (name),
      assigned_mentor_id,
      mentor:assigned_mentor_id (pseudo_name, full_name)
    `)
    .in('role', ['learner', 'student']);
    
  if (error) {
    console.error("Error fetching learners:", error);
    return [];
  }

  return enrichWithEmails(supabase, data);
}
