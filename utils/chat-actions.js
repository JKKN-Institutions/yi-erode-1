"use server";

import { createClient, createAdminClient } from "./supabase/server";
import { getServerRole } from "./auth-server";

/**
 * Get a chat room by ID — accessible by learner or mentor who are participants
 */
export async function getChatRoomById(roomId) {
  const auth = await getServerRole();
  if (!auth.user) return { error: "Unauthorized" };

  const adminSupabase = await createAdminClient();
  const { data: room, error } = await adminSupabase
    .from("chat_rooms")
    .select("*, learner:learner_id(id, full_name, avatar_url), mentor:mentor_id(id, pseudo_name, avatar_url)")
    .eq("id", roomId)
    .single();

  if (error) return { error: error.message };

  // Ensure caller is a participant
  if (room.learner_id !== auth.user.id && room.mentor_id !== auth.user.id && auth.role !== "admin") {
    return { error: "Access denied" };
  }

  return { room };
}

/**
 * Get messages for an open chat room
 */
export async function getChatMessages(roomId) {
  const auth = await getServerRole();
  if (!auth.user) return { error: "Unauthorized", messages: [] };

  const adminSupabase = await createAdminClient();

  // Verify the room is open and caller is a participant
  const { data: room, error: roomError } = await adminSupabase
    .from("chat_rooms")
    .select("learner_id, mentor_id, status")
    .eq("id", roomId)
    .single();

  if (roomError) return { error: roomError.message, messages: [] };
  if (room.status !== "open") return { error: "Room is not open", messages: [] };
  if (room.learner_id !== auth.user.id && room.mentor_id !== auth.user.id && auth.role !== "admin") {
    return { error: "Access denied", messages: [] };
  }

  const { data: messages, error } = await adminSupabase
    .from("chat_messages")
    .select("*, sender:sender_id(id, full_name, pseudo_name, avatar_url)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message, messages: [] };
  return { messages: messages || [] };
}

/**
 * Send a message in an open chat room
 */
export async function sendChatMessage(roomId, message) {
  const auth = await getServerRole();
  if (!auth.user) return { error: "Unauthorized" };
  if (!message?.trim()) return { error: "Message cannot be empty" };

  const adminSupabase = await createAdminClient();

  // Verify room is open and caller is a participant
  const { data: room, error: roomError } = await adminSupabase
    .from("chat_rooms")
    .select("learner_id, mentor_id, status")
    .eq("id", roomId)
    .single();

  if (roomError) return { error: roomError.message };
  if (room.status !== "open") return { error: "Chat room is not open" };
  if (room.learner_id !== auth.user.id && room.mentor_id !== auth.user.id) {
    return { error: "Access denied" };
  }

  const { error } = await adminSupabase.from("chat_messages").insert([
    {
      room_id: roomId,
      sender_id: auth.user.id,
      message: message.trim(),
    },
  ]);

  if (error) return { error: error.message };
  return { success: true };
}
