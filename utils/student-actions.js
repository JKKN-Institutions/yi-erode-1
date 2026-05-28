"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";
import { getServerRole } from "./auth-server";

/**
 * Get student data including assigned mentor details
 */
export async function getStudentData() {
  const auth = await getServerRole();
  if (!auth.user || (auth.role !== 'learner' && auth.role !== 'student')) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      mentor:assigned_mentor_id (
        id,
        full_name,
        avatar_url,
        pseudo_name
      )
    `)
    .eq('id', auth.user.id)
    .single();

  if (error) return { error: error.message };
  return { profile };
}

/**
 * Assign a school to a student
 */
export async function chooseSchool(schoolId) {
  const auth = await getServerRole();
  if (!auth.user || (auth.role !== 'learner' && auth.role !== 'student')) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ 
      school_id: schoolId,
      updated_at: new Date().toISOString()
    })
    .eq('id', auth.user.id);

  if (error) return { error: error.message };
  
  revalidatePath('/student-dashboard');
  return { success: true };
}

/**
 * Assign a mentor to a student
 */
export async function chooseMentor(mentorId) {
  const auth = await getServerRole();
  if (!auth.user || (auth.role !== 'learner' && auth.role !== 'student')) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  
  // Verify the mentor exists and is actually a mentor
  const { data: mentor, error: mentorError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', mentorId)
    .single();
    
  if (mentorError || mentor.role !== 'mentor') {
    return { error: "Invalid mentor selected" };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      assigned_mentor_id: mentorId,
      updated_at: new Date().toISOString()
    })
    .eq('id', auth.user.id);

  if (error) return { error: error.message };
  
  revalidatePath('/student-dashboard');
  return { success: true };
}

/**
 * Request a mentor change (requires admin approval)
 */
export async function requestMentorChange() {
  const auth = await getServerRole();
  if (!auth.user || (auth.role !== 'learner' && auth.role !== 'student')) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ 
      mentor_change_status: 'requested',
      updated_at: new Date().toISOString()
    })
    .eq('id', auth.user.id);

  if (error) return { error: error.message };
  
  revalidatePath('/student-dashboard');
  return { success: true };
}
