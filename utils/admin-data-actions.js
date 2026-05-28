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

// 4. Fetch process tracking data for all schools
export async function getSchoolsProcessTracking() {
  const supabase = await createClient();
  
  // 1. Fetch all schools
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, name, district, board_type, contact_person, grades')
    .order('name');
    
  if (schoolsError) {
    console.error("Error fetching schools for tracking:", schoolsError.message);
    return [];
  }
  
  // 2. Fetch all grade statuses
  const { data: gradeStatuses, error: statusesError } = await supabase
    .from('school_grade_status')
    .select('*');
    
  // 3. Fetch all sessions with their assigned mentors (via session_mentors)
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select(`
      *,
      session_mentors (
        mentor_id,
        profiles:mentor_id (full_name, pseudo_name)
      )
    `);
    
  const statusesMap = {}; // key: schoolId_grade
  gradeStatuses?.forEach(gs => {
    statusesMap[`${gs.school_id}_${gs.grade}`] = gs;
  });
  
  const sessionsMap = {}; // key: schoolId_grade
  sessions?.forEach(s => {
    const key = `${s.school_id}_${s.grade}`;
    if (!sessionsMap[key]) {
      sessionsMap[key] = [];
    }
    sessionsMap[key].push(s);
  });
  
  return schools.map(school => {
    // For each school, compile its grades progress
    const gradesProgress = (school.grades || []).map(grade => {
      const key = `${school.id}_${grade}`;
      const statusRecord = statusesMap[key];
      const gradeSessions = sessionsMap[key] || [];
      
      return {
        grade,
        status: statusRecord?.status || 'registered',
        moduleCode: statusRecord?.module_code || null,
        categoryA: statusRecord?.category_a || null,
        categoryB: statusRecord?.category_b || null,
        sessions: gradeSessions.map(s => ({
          id: s.id,
          type: s.session_type,
          date: s.session_date,
          time: s.start_time,
          status: s.status,
          attendance: (s.learner_count !== null && s.learner_count !== undefined) ? {
            attended: s.learner_count,
            strength: s.learner_details?.student_strength || 0,
            absentees: s.learner_details?.absentees || ''
          } : null,
          feedback: s.principal_feedback || null,
          mentors: s.session_mentors?.map(sm => sm.profiles?.pseudo_name || sm.profiles?.full_name).filter(Boolean).join(', ') || s.mentor_aliases || ''
        }))
      };
    });
    
    return {
      id: school.id,
      name: school.name,
      district: school.district,
      boardType: school.board_type,
      contactPerson: school.contact_person,
      grades: gradesProgress
    };
  });
}
