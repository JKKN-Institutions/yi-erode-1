"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";
import { getServerRole } from "./auth-server";
import { logActivity } from "./logger";

/**
 * Fetch mentor availability
 */
export async function getMentorAvailability(profileId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('mentor_availability')
    .select('*')
    .eq('profile_id', profileId);
  
  if (error) {
    console.error('Error fetching availability:', error.message);
    return [];
  }
  return data;
}

/**
 * Update mentor availability (block/unblock dates)
 */
export async function updateMentorAvailability(profileId, date, type, reason = '') {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('mentor_availability')
    .upsert([{ 
      profile_id: profileId, 
      date, 
      type, 
      reason
    }], { onConflict: 'profile_id, date' });

  if (error) {
    console.error('Error updating availability:', error.message);
    return { success: false, error: error.message };
  }
  
  if (type === 'blocked') {
    await logActivity('Blocked Calendar Date', `Date ${date} frozen. Reason: ${reason || 'Not provided'}`);
  } else {
    await logActivity('Freed Calendar Date', `Date ${date} marked as available again.`);
  }
  
  revalidatePath('/mentor-dashboard');
  return { success: true };
}

/**
 * Fetch schools assigned to this mentor
 */
export async function getAssignedSchools(profileId) {
  const supabase = await createClient();
  
  // Link: profiles -> session_mentors -> sessions -> schools
  const { data, error } = await supabase
    .from('session_mentors')
    .select(`
      session_id,
      sessions (
        id,
        session_date,
        session_type,
        schools (
          id,
          name,
          district,
          status
        )
      )
    `)
    .eq('mentor_id', profileId);

  if (error) {
    console.error('Error fetching schools:', error.message);
    return [];
  }

  // Deduplicate and format
  const schools = {};
  data.forEach(item => {
    const school = item.sessions?.schools;
    if (school && !schools[school.id]) {
      schools[school.id] = {
        ...school,
        next_session: item.sessions.session_date,
        type: item.sessions.session_type
      };
    }
  });

  return Object.values(schools);
}

/**
 * Fetch mentor interactions (anonymous messages)
 */
export async function getMentorInteractions(mentorId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('anonymous_interactions')
    .select(`
      *,
      schools ( name )
    `)
    .eq('mentor_id', mentorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching interactions:', error.message);
    return [];
  }
  return data;
}

/**
 * Submit an anonymous interaction (Student side)
 */
export async function submitInteraction(mentorId, schoolId, message) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('anonymous_interactions')
    .insert([{
      mentor_id: mentorId,
      school_id: schoolId,
      message,
      sender_type: 'student'
    }]);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Fetch feedback logs entered by this mentor
 */
export async function getMentorFeedbackStats(mentorId) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('mentor_feedback_log')
    .select('*')
    .eq('mentor_id', mentorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mentor feedback log:', error.message);
    return [];
  }

  return data.map(f => ({
    id: f.id,
    school: f.school_name,
    date: f.session_date,
    comments: f.comments,
    rating: f.rating
  }));
}

/**
 * Submit a feedback entry logged by the mentor
 */
export async function submitMentorFeedback(mentorId, schoolName, rating, comments, sessionDate) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('mentor_feedback_log')
    .insert([{
      mentor_id: mentorId,
      school_name: schoolName,
      rating: parseInt(rating),
      comments: comments || null,
      session_date: sessionDate || null
    }]);

  if (error) {
    console.error('Error submitting mentor feedback:', error.message);
    return { success: false, error: error.message };
  }

  await logActivity('Logged Learner Feedback', `School: ${schoolName}, Rating: ${rating}/5`);
  revalidatePath('/mentor-dashboard');
  return { success: true };
}

/**
 * Fetch mentor's own profile data
 */
export async function getMentorProfile(profileId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, course, college, pseudo_name, avatar_url')
    .eq('id', profileId)
    .single();

  if (error) {
    console.error('Error fetching mentor profile:', error.message);
    return null;
  }
  return data;
}

/**
 * Update mentor profile (except pseudo_name)
 */
export async function updateMentorProfile(profileId, updates) {
  const supabase = await createClient();
  
  // Never allow pseudo_name update from mentor
  delete updates.pseudo_name;
  delete updates.role;
  delete updates.id;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId);

  if (error) {
    console.error('Error updating mentor profile:', error.message);
    return { success: false, error: error.message };
  }

  await logActivity('Updated Profile', 'Mentor updated their personal details.');
  revalidatePath('/mentor-dashboard');
  return { success: true };
}

/**
 * Create a new session (Mentor or Admin)
 */
export async function createSession(formData) {
  const supabase = await createClient();
  const auth = await getServerRole();

  if (!auth.user) return { error: "Unauthorized" };

  const sessionData = {
    title: formData.get('title'),
    description: formData.get('description'),
    session_date: formData.get('scheduled_at'),
    created_by: auth.user.id,
    session_type: 'awareness' // Default
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert([sessionData])
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error.message);
    return { error: error.message };
  }

  revalidatePath('/mentor-dashboard');
  revalidatePath('/admin-dashboard');
  return { success: true, data };
}

/**
 * Request mentor change initiated by mentor
 */
export async function requestMentorChangeByMentor(learnerId) {
  const auth = await getServerRole();
  if (!auth.user || (auth.role !== 'mentor' && auth.role !== 'admin')) {
    return { error: "Mentor access required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ 
      mentor_change_status: 'requested',
      mentor_change_requested_by: 'mentor',
      updated_at: new Date().toISOString()
    })
    .eq('id', learnerId);

  if (error) return { error: error.message };
  
  revalidatePath('/mentor-dashboard');
  return { success: true };
}
