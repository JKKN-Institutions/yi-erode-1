"use server";

import { createClient, createAdminClient } from "./supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "./logger";

/**
 * Fetch all schools from the database
 */
export async function getSchools() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching schools:', error.message);
    return [];
  }
  return data;
}

/**
 * Register a new school (Admin only)
 */
export async function registerSchool(formData) {
  const supabase = await createClient();
  
  const schoolData = {
    name: formData.get('name'),
    district: formData.get('district'),
    board_type: formData.get('board_type'),
    address: formData.get('address'),
    contact_person: formData.get('contact_person'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    status: 'registered'
  };

  const { data, error } = await supabase
    .from('schools')
    .insert([schoolData])
    .select()
    .single();

  if (error) {
    console.error('Error registering school:', error.message);
    return { success: false, error: error.message };
  }

  await logActivity('Registered School', `Registered ${schoolData.name} located in ${schoolData.district}`);

  revalidatePath('/schools');
  return { success: true, data };
}

/**
 * Assign a coordinator to a school
 */
export async function assignSchoolToProfile(profileId, schoolId) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ 
      school_id: schoolId,
      role: 'school_coordinator',
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId);

  if (error) {
    console.error('Error assigning school:', error.message);
    return { success: false, error: error.message };
  }

  await logActivity('Assigned School Coordinator', `Profile ${profileId} mapped to school ID ${schoolId}`);

  revalidatePath('/admin/roles');
  return { success: true };
}

/**
 * Get single school by ID
 */
export async function getSchoolById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching school:', error.message);
    return null;
  }
  return data;
}

/**
 * Fetch sessions for a specific school
 */
export async function getSchoolSessions(schoolId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_mentors (
        profiles ( full_name )
      )
    `)
    .eq('school_id', schoolId)
    .order('session_date', { ascending: true });

  if (error) {
    console.error('Error fetching sessions:', error.message);
    return [];
  }
  return data;
}
/**
 * Fetch status for all participating grades in a school
 */
export async function getSchoolGradeStatuses(schoolId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_grade_status')
    .select('*')
    .eq('school_id', schoolId);
  
  if (error) {
    console.error('Error fetching grade statuses:', error.message);
    return [];
  }
  return data;
}

/**
 * Initialize status for a new grade
 */
export async function initializeGradeStatus(schoolId, grade) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('school_grade_status')
    .insert([{ school_id: schoolId, grade, status: 'registered' }])
    .select()
    .single();

  if (error) {
    console.error('Error initializing grade status:', error.message);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/school-dashboard');
  return { success: true, data };
}

/**
 * Update session details with trainer, mentors, learners, and attachments
 */
export async function updateSessionPulse(sessionId, updateData) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('sessions')
    .update({
      trainer_name: updateData.trainer_name,
      mentor_aliases: updateData.mentor_aliases,
      learner_count: updateData.learner_count,
      learner_details: updateData.learner_details,
      attachment_urls: updateData.attachment_urls,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session pulse:', error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/schedule');
  return { success: true };
}

/**
 * Submit Principal Feedback for a session
 */
export async function submitPrincipalFeedback(sessionId, feedback) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('sessions')
    .update({
      principal_feedback: feedback,
      status: 'completed'
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error submitting principal feedback:', error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/schedule');
  return { success: true };
}

/**
 * Submit Post-Intervention Feedback / Impact
 */
export async function submitImpactAssessment(sessionId, impactData) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('sessions')
    .update({
      post_intervention_feedback_1: impactData.feedback_1,
      post_intervention_feedback_2: impactData.feedback_2,
      impact_summary: impactData.summary
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error submitting impact:', error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/schedule');
  return { success: true };
}

/**
 * Add a participating grade to the school and initialize its status
 */
export async function addSchoolGrade(schoolId, grade) {
  const supabase = await createAdminClient();
  
  // 1. Fetch current grades
  const { data: school, error: fetchError } = await supabase
    .from('schools')
    .select('grades')
    .eq('id', schoolId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching school grades:', fetchError.message);
    return { success: false, error: fetchError.message };
  }
  
  const currentGrades = school.grades || [];
  const gradeStr = grade.toString();
  
  // Check if it's already there
  const alreadyExists = currentGrades.some(g => g.toString() === gradeStr);
  
  if (!alreadyExists) {
    // Append and save to schools table
    const updatedGrades = [...currentGrades, gradeStr];
    const { error: updateError } = await supabase
      .from('schools')
      .update({ grades: updatedGrades })
      .eq('id', schoolId);
      
    if (updateError) {
      console.error('Error updating school grades:', updateError.message);
      return { success: false, error: updateError.message };
    }
  }

  // 2. Initialize in school_grade_status table (if not already there)
  const { data: existingStatus } = await supabase
    .from('school_grade_status')
    .select('id')
    .eq('school_id', schoolId)
    .eq('grade', gradeStr)
    .maybeSingle();

  if (!existingStatus) {
    const { error: insertError } = await supabase
      .from('school_grade_status')
      .insert([{ school_id: schoolId, grade: gradeStr, status: 'registered' }]);

    if (insertError) {
      console.warn('Error inserting grade status (might exist):', insertError.message);
    }
  }

  await logActivity('Added School Grade', `Added Grade ${gradeStr} to school ID ${schoolId}`);
  
  revalidatePath('/school-dashboard');
  return { success: true };
}

/**
 * Save attendance details for a specific session
 */
export async function saveSessionAttendance(sessionId, { student_strength, attended_count, absentees }) {
  const supabase = await createAdminClient();
  
  const { data: session, error: getError } = await supabase
    .from('sessions')
    .select('learner_details')
    .eq('id', sessionId)
    .single();
    
  if (getError) {
    console.error('Error fetching session for attendance:', getError.message);
    return { success: false, error: getError.message };
  }
  
  const currentDetails = typeof session?.learner_details === 'object' && session.learner_details !== null
    ? session.learner_details
    : {};
    
  const updatedDetails = {
    ...currentDetails,
    student_strength: parseInt(student_strength),
    absentees: absentees
  };
  
  const { error } = await supabase
    .from('sessions')
    .update({
      learner_count: parseInt(attended_count),
      learner_details: updatedDetails,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
    
  if (error) {
    console.error('Error updating attendance:', error.message);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/school-dashboard/attendance');
  revalidatePath('/school-dashboard/sessions');
  return { success: true };
}

/**
 * Save principal feedback and follow-up/impact details for a specific session
 */
export async function saveSessionFeedback(sessionId, { principal_feedback, impact_feedback, impact_summary }) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('sessions')
    .update({
      principal_feedback: principal_feedback,
      post_intervention_feedback_1: impact_feedback,
      impact_summary: impact_summary,
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
    
  if (error) {
    console.error('Error updating session feedback:', error.message);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/school-dashboard/feedback');
  revalidatePath('/school-dashboard/sessions');
  return { success: true };
}

