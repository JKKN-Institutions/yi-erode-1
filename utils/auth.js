/**
 * Dev Auth Utility — Cookie-based role management for development.
 * In production, this will be replaced by Supabase Auth.
 */

// Client-side: get role from cookie
export function getDevRole() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)dev_role=(\w+)/);
  return match ? match[1] : null;
}

// Client-side: set role cookie
export function setDevRole(role) {
  document.cookie = `dev_role=${role}; path=/; max-age=${60 * 60 * 24 * 30}`;
  document.cookie = `dev_user=${encodeURIComponent(JSON.stringify(getDemoUser(role)))}; path=/; max-age=${60 * 60 * 24 * 30}`;
}

// Client-side: clear role cookie
export function clearDevRole() {
  document.cookie = 'dev_role=; path=/; max-age=0';
  document.cookie = 'dev_user=; path=/; max-age=0';
}

// Get demo user data for a role
export function getDemoUser(role) {
  const users = {
    admin: { name: 'Yi Administrator', email: 'admin@yierode.org', role: 'admin' },
    mentor: { name: 'Shield Mentor', email: 'mentor@jkkn.edu', role: 'mentor' },
    school_coordinator: { name: 'School Coordinator', email: 'coordinator@school.edu', role: 'school_coordinator' },
    student: { name: 'Yi Learner', email: 'learner@yierode.org', role: 'student' },
  };
  return users[role] || users.admin;
}

// Client-side: get user from cookie
export function getDevUser() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)dev_user=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}
