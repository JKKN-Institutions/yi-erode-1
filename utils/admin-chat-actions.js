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
