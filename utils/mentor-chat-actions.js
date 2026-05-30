"use server";

import { createAdminClient } from "./supabase/server";
import { getServerRole } from "./auth-server";
import { revalidatePath } from "next/cache";

async function assertMentor() {
  const auth = await getServerRole();
  if (!auth.user || (auth.role !== "mentor" && auth.role !== "admin")) {
    throw new Error("Mentor access required");
  }
  return auth;
}

/**
 * Get rooms assigned to this mentor that need to be opened (status = pending_mentor)
 */
export async function getPendingMentorRooms() {
  const auth = await assertMentor();
  const adminSupabase = await createAdminClient();

  const { data, error } = await adminSupabase
    .from("chat_rooms")
    .select(`
      *,
      learner:learner_id(id, full_name, avatar_url)
    `)
    .eq("mentor_id", auth.user.id)
    .eq("status", "pending_mentor")
    .order("admin_approved_at", { ascending: false });

  if (error) {
    console.error("getPendingMentorRooms error:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Get currently open chat rooms for this mentor
 */
export async function getMentorOpenRooms() {
  const auth = await assertMentor();
  const adminSupabase = await createAdminClient();

  const { data, error } = await adminSupabase
    .from("chat_rooms")
    .select(`
      *,
      learner:learner_id(id, full_name, avatar_url)
    `)
    .eq("mentor_id", auth.user.id)
    .eq("status", "open")
    .order("mentor_opened_at", { ascending: false });

  if (error) {
    console.error("getMentorOpenRooms error:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Open a chat room (mentor action) — changes status from pending_mentor → open
 */
export async function openChatRoom(roomId) {
  const auth = await assertMentor();
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from("chat_rooms")
    .update({
      status: "open",
      mentor_opened_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("mentor_id", auth.user.id)
    .eq("status", "pending_mentor");

  if (error) return { error: error.message };

  revalidatePath("/mentor-dashboard");
  return { success: true };
}

/**
 * Close a chat room (mentor action) — changes status from open → closed
 */
export async function closeChatRoom(roomId) {
  const auth = await assertMentor();
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from("chat_rooms")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("mentor_id", auth.user.id)
    .eq("status", "open");

  if (error) return { error: error.message };

  revalidatePath("/mentor-dashboard");
  return { success: true };
}

/**
 * Get all rooms for this mentor (all statuses) for history view
 */
export async function getMentorAllRooms() {
  const auth = await assertMentor();
  const adminSupabase = await createAdminClient();

  const { data, error } = await adminSupabase
    .from("chat_rooms")
    .select(`
      *,
      learner:learner_id(id, full_name, avatar_url)
    `)
    .eq("mentor_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMentorAllRooms error:", error.message);
    return [];
  }
  return data || [];
}
