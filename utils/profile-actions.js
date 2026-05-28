"use server";

import { createClient } from "./supabase/server";

export async function checkProfileCompletion() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { requireCompletion: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return { requireCompletion: false };

  // Admins never need profile completion.
  if (profile.role === 'admin') return { requireCompletion: false, profile };

  const isLearner = profile.role === 'learner' || profile.role === 'student';

  let requireCompletion = false;

  if (profile.role === 'mentor') {
    if (!profile.course || !profile.college || !profile.phone || !profile.pseudo_name) {
      requireCompletion = true;
    }
  } else if (isLearner) {
    if (!profile.academic_class) {
      requireCompletion = true;
    }
  } else if (profile.role === 'school_coordinator') {
    if (!profile.phone) {
      requireCompletion = true;
    }
  }

  return { requireCompletion, profile };
}

export async function updateProfileDetails(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not logged in" };

  const updatePayload = { updated_at: new Date().toISOString() };

  const fields = ['phone', 'course', 'college', 'pseudo_name', 'academic_class'];
  fields.forEach(f => {
    if (formData.get(f)) {
      updatePayload[f] = formData.get(f);
    }
  });

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id);

  if (error) {
    console.error("Error updating profile:", error.message);
    return { success: false, error: error.message };
  }

  // Intentionally not calling revalidatePath('/', 'layout') here — revalidating
  // the root layout caused the modal/sidebar to remount on every page change,
  // which surfaced as a continuous refresh loop for some sessions.
  return { success: true };
}
