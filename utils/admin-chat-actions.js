"use server";

import { createAdminClient } from "./supabase/server";
import { getServerRole } from "./auth-server";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const auth = await getServerRole();
  if (!auth.user || auth.role !== "admin") throw new Error("Admin access required");
  return auth;
}

/**
 * Get all pending chat room requests (status = pending_admin)
 */
export async function getPendingChatRequests() {
  await assertAdmin();
  const adminSupabase = await createAdminClient();

  const { data, error } = await adminSupabase
    .from("chat_rooms")
    .select(`
      *,
      learner:learner_id(id, full_name, avatar_url, school_id),
      mentor:mentor_id(id, pseudo_name, avatar_url)
    `)
    .eq("status", "pending_admin")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPendingChatRequests error:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Get all chat rooms for admin with full info
 */
export async function getAllChatRooms() {
  await assertAdmin();
  const adminSupabase = await createAdminClient();

  const { data, error } = await adminSupabase
    .from("chat_rooms")
    .select(`
      *,
      learner:learner_id(id, full_name, avatar_url),
      mentor:mentor_id(id, pseudo_name, avatar_url)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllChatRooms error:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Approve a chat request — moves to pending_mentor
 */
export async function approveChatRequest(roomId) {
  await assertAdmin();
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from("chat_rooms")
    .update({
      status: "pending_mentor",
      admin_approved_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("status", "pending_admin");

  if (error) return { error: error.message };

  revalidatePath("/admin-dashboard/chat-requests");
  return { success: true };
}

/**
 * Reject a chat request — moves to closed
 */
export async function rejectChatRequest(roomId) {
  await assertAdmin();
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from("chat_rooms")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("status", "pending_admin");

  if (error) return { error: error.message };

  revalidatePath("/admin-dashboard/chat-requests");
  return { success: true };
}

/**
 * Get count of pending chat requests (for notification badge)
 */
export async function getPendingChatRequestCount() {
  try {
    await assertAdmin();
  } catch {
    return 0;
  }
  const adminSupabase = await createAdminClient();

  const { count, error } = await adminSupabase
    .from("chat_rooms")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_admin");

  if (error) return 0;
  return count || 0;
}

/**
 * Get consolidated notifications for admin (chat rooms, mentor changes, bug reports)
 */
export async function getAdminNotifications() {
  await assertAdmin();
  const adminSupabase = await createAdminClient();

  // 1. Pending chat requests
  const { data: chatReqs } = await adminSupabase
    .from("chat_rooms")
    .select(`
      *,
      learner:learner_id(id, full_name, avatar_url, school_id),
      mentor:mentor_id(id, pseudo_name, avatar_url)
    `)
    .eq("status", "pending_admin")
    .order("created_at", { ascending: false });

  // 2. Mentor change requests (differentiating who requested it)
  const { data: mentorChangeReqs } = await adminSupabase
    .from("profiles")
    .select("id, full_name, avatar_url, assigned_mentor_id, mentor_change_status, mentor_change_requested_by")
    .eq("mentor_change_status", "requested");

  // Fetch mentor pseudo names for change requests
  let enrichedChangeReqs = [];
  if (mentorChangeReqs && mentorChangeReqs.length > 0) {
    const mentorIds = mentorChangeReqs.map(r => r.assigned_mentor_id).filter(Boolean);
    const { data: mentors } = await adminSupabase
      .from("profiles")
      .select("id, pseudo_name")
      .in("id", mentorIds);

    const mentorMap = {};
    mentors?.forEach(m => { mentorMap[m.id] = m.pseudo_name; });

    enrichedChangeReqs = mentorChangeReqs.map(r => ({
      ...r,
      mentor_pseudo_name: mentorMap[r.assigned_mentor_id] || "Assigned Mentor"
    }));
  }

  // 3. Open bug reports / Support tickets from all users
  const { data: bugReports } = await adminSupabase
    .from("bug_reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return {
    chatRequests: chatReqs || [],
    mentorChangeRequests: enrichedChangeReqs || [],
    bugReports: bugReports || []
  };
}

/**
 * Approve a mentor change request by resetting the learner's assigned mentor
 */
export async function approveMentorChangeRequest(profileId) {
  await assertAdmin();
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from("profiles")
    .update({
      assigned_mentor_id: null,
      mentor_change_status: "none",
      mentor_change_requested_by: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/admin-dashboard");
  return { success: true };
}

/**
 * Quick resolve a support / bug report ticket from the sidebar drawer
 */
export async function resolveBugReport(reportId) {
  await assertAdmin();
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from("bug_reports")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      admin_response: "Resolved via Sidebar Quick Action"
    })
    .eq("id", reportId);

  if (error) return { error: error.message };

  revalidatePath("/admin-dashboard/bug-reports");
  return { success: true };
}
