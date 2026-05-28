"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Fetch all mentors with their assigned schools summary
 */
export async function getAllMentorsWithAllocations() {
  const supabase = await createClient();
  
  // 1. Get all mentors
  const { data: mentors, error: mentorError } = await supabase
    .from('profiles')
    .select('id, full_name, pseudo_name, role')
    .eq('role', 'mentor');

  if (mentorError) throw mentorError;

  // 2. Get their allocations (via sessions)
  const { data: allocations, error: allocError } = await supabase
    .from('session_mentors')
    .select(`
      mentor_id,
      sessions (
        id,
        schools (
          id,
          name
        )
      )
    `);

  if (allocError) throw allocError;

  // Map allocations to mentors
  return mentors.map(mentor => {
    const mentorAllocations = allocations
      .filter(a => a.mentor_id === mentor.id)
      .map(a => ({
        sessionId: a.sessions?.id,
        schoolId: a.sessions?.schools?.id,
        schoolName: a.sessions?.schools?.name
      }));

    return {
      ...mentor,
      allocations: mentorAllocations
    };
  });
}

/**
 * Assign a mentor to a school's session
 */
export async function assignMentorToSchool(mentorId, schoolId) {
  const supabase = await createClient();
  
  // Find a planned session for this school that doesn't have this mentor
  // If no session exists, we might need to create one, but usually sessions are created by coordinators
  // For this "allocation" requirement, we'll ensure we link to the school's active sessions
  
  const { data: activeSessions, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (sessionError) throw sessionError;
  
  const sessionId = activeSessions?.[0]?.id;
  if (!sessionId) {
    return { success: false, error: "This school has no scheduled sessions to assign a mentor to." };
  }

  const { error } = await supabase
    .from('session_mentors')
    .insert([{
      session_id: sessionId,
      mentor_id: mentorId
    }]);

  if (error) {
    if (error.code === '23505') return { success: false, error: "Mentor is already assigned to this school." };
    throw error;
  }

  revalidatePath('/admin/mentors');
  return { success: true };
}

/**
 * Remove mentor allocation from a school
 */
export async function removeMentorFromSchool(mentorId, schoolId) {
  const supabase = await createClient();

  // Find the session link
  const { data: sessions, error: findError } = await supabase
    .from('sessions')
    .select('id')
    .eq('school_id', schoolId);

  if (findError) throw findError;
  const sessionIds = sessions.map(s => s.id);

  const { error } = await supabase
    .from('session_mentors')
    .delete()
    .eq('mentor_id', mentorId)
    .in('session_id', sessionIds);

  if (error) throw error;

  revalidatePath('/admin/mentors');
  return { success: true };
}

/**
 * Fetch all sessions along with school details, mentor assignments, and 3x3 matrix codes
 */
export async function getSessionsWithMatrixAndMentors() {
  const supabase = await createClient();
  
  // Fetch sessions with their linked schools and assigned mentors
  const { data: sessions, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      *,
      schools:school_id ( id, name, district ),
      session_mentors (
        mentor_id,
        profiles:mentor_id ( id, full_name, pseudo_name )
      )
    `)
    .order('session_date', { ascending: true });
    
  if (sessionError) {
    console.error('Error fetching sessions for allocation:', sessionError.message);
    return [];
  }
  
  // Fetch school grade statuses to get the module codes (matrix results)
  const { data: gradeStatuses, error: statusError } = await supabase
    .from('school_grade_status')
    .select('school_id, grade, module_code');
    
  if (statusError) {
    console.error('Error fetching grade statuses for matrix:', statusError.message);
    return sessions.map(s => ({ ...s, module_code: 'Unknown' }));
  }
  
  // Map school_id + grade to module_code
  const matrixMap = {};
  gradeStatuses?.forEach(gs => {
    matrixMap[`${gs.school_id}_${gs.grade}`] = gs.module_code;
  });
  
  // Enrich sessions with their calculated matrix code
  return sessions.map(session => ({
    ...session,
    module_code: matrixMap[`${session.school_id}_${session.grade}`] || 'Not Assessed'
  }));
}

/**
 * Fetch JKKN mentors list with their availability on a specific date
 */
export async function getAvailableMentorsForDate(dateStr) {
  const supabase = await createClient();
  
  // 1. Get all mentors
  const { data: mentors, error: mentorError } = await supabase
    .from('profiles')
    .select('id, full_name, pseudo_name, phone')
    .eq('role', 'mentor');
    
  if (mentorError) {
    console.error('Error fetching mentors list:', mentorError.message);
    return [];
  }
  
  // 2. Get availabilities for the target date
  const { data: availabilities, error: availError } = await supabase
    .from('mentor_availability')
    .select('profile_id, type, reason')
    .eq('date', dateStr);
    
  if (availError) {
    console.error('Error fetching mentor availabilities:', availError.message);
    return mentors.map(m => ({ ...m, availability: 'none', reason: '' }));
  }
  
  const availMap = {};
  availabilities?.forEach(a => {
    availMap[a.profile_id] = { type: a.type, reason: a.reason };
  });
  
  return mentors.map(m => {
    const av = availMap[m.id];
    return {
      ...m,
      availability: av ? av.type : 'none', // 'free', 'blocked', or 'none'
      reason: av ? av.reason : ''
    };
  });
}

/**
 * Assign a mentor to a specific session
 */
export async function assignMentorToSession(sessionId, mentorId) {
  const supabase = await createClient();
  
  // Insert allocation link
  const { error } = await supabase
    .from('session_mentors')
    .insert([{
      session_id: sessionId,
      mentor_id: mentorId
    }]);
    
  if (error) {
    console.error('Error assigning mentor to session:', error.message);
    if (error.code === '23505') {
      return { success: false, error: "Mentor is already assigned to this session." };
    }
    return { success: false, error: error.message };
  }
  
  // Update the session's trainer_name/mentor_aliases to reflect this pseudo name
  const { data: mentor } = await supabase
    .from('profiles')
    .select('full_name, pseudo_name')
    .eq('id', mentorId)
    .single();
    
  if (mentor) {
    const { data: session } = await supabase
      .from('sessions')
      .select('mentor_aliases')
      .eq('id', sessionId)
      .single();
      
    const currentAliases = session?.mentor_aliases ? session.mentor_aliases.split(',').map(s => s.trim()) : [];
    const newAlias = mentor.pseudo_name || mentor.full_name;
    
    if (!currentAliases.includes(newAlias)) {
      currentAliases.push(newAlias);
      await supabase
        .from('sessions')
        .update({ mentor_aliases: currentAliases.join(', ') })
        .eq('id', sessionId);
    }
  }
  
  revalidatePath('/admin-dashboard/allocations');
  return { success: true };
}

/**
 * Remove a mentor assignment from a session
 */
export async function removeMentorFromSession(sessionId, mentorId) {
  const supabase = await createClient();
  
  // Delete the relation
  const { error } = await supabase
    .from('session_mentors')
    .delete()
    .eq('session_id', sessionId)
    .eq('mentor_id', mentorId);
    
  if (error) {
    console.error('Error removing mentor from session:', error.message);
    return { success: false, error: error.message };
  }
  
  // Clean up the session's mentor_aliases
  const { data: mentor } = await supabase
    .from('profiles')
    .select('full_name, pseudo_name')
    .eq('id', mentorId)
    .single();
    
  if (mentor) {
    const { data: session } = await supabase
      .from('sessions')
      .select('mentor_aliases')
      .eq('id', sessionId)
      .single();
      
    if (session?.mentor_aliases) {
      const aliasToRemove = mentor.pseudo_name || mentor.full_name;
      const currentAliases = session.mentor_aliases.split(',').map(s => s.trim());
      const updatedAliases = currentAliases.filter(a => a !== aliasToRemove);
      
      await supabase
        .from('sessions')
        .update({ mentor_aliases: updatedAliases.join(', ') })
        .eq('id', sessionId);
    }
  }
  
  revalidatePath('/admin-dashboard/allocations');
  return { success: true };
}
