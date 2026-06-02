"use server";

import { createClient } from "./supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Submit a bug report
 */
export async function submitBugReport({ title, description, screenshotUrl, pageUrl }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Get profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const { error } = await supabase
    .from('bug_reports')
    .insert([{
      reporter_id: user.id,
      reporter_name: profile?.full_name || user.email,
      reporter_role: profile?.role || 'unknown',
      title,
      description,
      screenshot_url: screenshotUrl || null,
      page_url: pageUrl || null,
      status: 'open'
    }]);

  if (error) {
    console.error("Error submitting bug report:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all bug reports (admin only)
 */
export async function getAllBugReports() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching bug reports:", error.message);
    return [];
  }
  return data;
}

/**
 * Update bug report status (admin only)
 */
export async function updateBugReportStatus(reportId, status, adminResponse) {
  const supabase = await createClient();

  const updatePayload = { status };
  if (adminResponse) updatePayload.admin_response = adminResponse;
  if (status === 'resolved' || status === 'closed') {
    updatePayload.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('bug_reports')
    .update(updatePayload)
    .eq('id', reportId);

  if (error) {
    console.error("Error updating bug report:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin-dashboard/bug-reports');
  return { success: true };
}

/**
 * Assign bug report to Antigravity Agent for resolution (admin only)
 */
export async function assignBugToAntigravity(reportId) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('bug_reports')
    .update({
      status: 'in_progress',
      admin_response: 'Assigned to Antigravity Agent for automated resolution. Waiting for agent process...'
    })
    .eq('id', reportId);

  if (error) {
    console.error("Error assigning bug to Antigravity:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin-dashboard/bug-reports');
  return { success: true };
}

