# Mission ON - Smart Choices: Application Specification

## 1. Project Overview

**Mission ON - Smart Choices** is a comprehensive awareness program platform spearheaded by the Young Indians (Yi) Erode Chapter. It focuses on substance abuse prevention, empowering students with tools and mentorship to make safe decisions. The platform serves as a central hub connecting administrators, school coordinators, JKKN institution mentors, and student learners.

## 2. Technology Stack

*   **Framework:** Next.js (App Router)
*   **Frontend Library:** React
*   **Styling:** Custom CSS Modules with a modern, glassmorphic design system
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth (Google OAuth integration)

## 3. User Roles & Access Levels

The platform utilizes a robust Role-Based Access Control (RBAC) system with four primary roles:

1.  **Administrator (Admin)**
    *   Full system oversight and control.
    *   Manage and onboard schools and school coordinators.
    *   Manage mentor rosters and approve mentor changes.
    *   Manage user roles.
    *   View global analytics, activity feeds, and program effectiveness (Six Pillars).
2.  **School Coordinator**
    *   Represents a specific participating school.
    *   Tracks the assessment progress of different academic grades.
    *   Schedules live sessions (initial, follow-up, follow-through).
    *   Submits session attendance (Pulse), principal feedback, and post-intervention impact reports.
3.  **Mentor**
    *   Trained specialists (e.g., from JKKN Institutions).
    *   Manage calendar availability for sessions.
    *   View allocated schools.
    *   Log learner feedback and rate sessions.
    *   Maintain an anonymous profile (pseudo name) for secure learner communication.
4.  **Student (Learner)**
    *   Enrolls in the program by selecting their school.
    *   Gets assigned a personal mentor.
    *   Accesses communication channels with their mentor (Chat, Video, WhatsApp).
    *   Can request mentor changes.
    *   Submits feedback on the program.

## 4. Core Workflows

### 4.1. Authentication Flow
*   Users log in exclusively via Google OAuth.
*   Upon initial login, a profile is auto-created in the database via a Supabase trigger.
*   New users default to an `unassigned` role until an Admin assigns them a specific role (Admin emails are auto-assigned).
*   Users without an assigned role are redirected to a pending review screen.
*   Next.js Middleware validates sessions and enforces route protection based on the user's role.

### 4.2. School & Grade Progression
School coordinators manage the program on a per-grade basis. The workflow follows a strict pipeline:
1.  **Registered:** Baseline status. The grade is ready for the initial assessment.
2.  **Assessed:** Baseline assessment complete. Ready to schedule Session 1.
3.  **Scheduled:** Session is booked. Coordinator updates live details on the day of the session.
4.  **Completed:** Session done. Feedback must be submitted to unlock subsequent sessions.

### 4.3. Session Pulse & Feedback
*   **Session Pulse:** Coordinators track live session details, including trainer names, mentor aliases, and learner attendance.
*   **Principal's Feedback:** Qualitative evaluation provided by the school principal post-session.
*   **Impact Assessment:** Follow-up tracking of the intervention's effectiveness.
*   **Mentor Feedback:** Mentors independently log their ratings and remarks on learner engagement.

### 4.4. Analytics & The Six Pillars
The platform tracks effectiveness across six core pillars:
1. Saying No
2. Boundaries
3. Confidential Sharing
4. Suicide Awareness
5. Social Media
6. Substance Abuse
Admins can view aggregate scores and qualitative feedback to measure overall program impact.

## 5. Database Schema (Supabase)

*   `profiles`: Central user table linked to `auth.users`. Stores `full_name`, `email`, `role`, `avatar_url`, and references for specific roles (like `school_id` or `assigned_mentor_id`). Controlled via Row Level Security (RLS) policies allowing users to read/update their own data and admins to manage all data.

## 6. Directory Structure Overview

*   `/app`: Next.js App Router root.
    *   `/login`: Custom Google OAuth login page.
    *   `/auth/callback`: OAuth session exchange route.
    *   `/admin-dashboard`: Admin interface and management routes.
    *   `/mentor-dashboard`: Mentor workspace.
    *   `/school-dashboard`: School coordinator workspace.
    *   `/student-dashboard`: Learner hub.
    *   `/api`: API routes (auth checks, data cleanup).
*   `/components`: Reusable UI components (Sidebar, BugReportButton, ProfileCompletionModal).
*   `/utils`: Server and client actions for interacting with Supabase (auth, user actions, assessments).
*   `/lib`: Global configurations (CSS, Supabase client init).

## 7. Development Guidelines

*   **Authentication:** The application supports a mock authentication mode (`NEXT_PUBLIC_MOCK_AUTH=true`) for local development, utilizing cookies to simulate roles.
*   **Data Fetching:** Heavily relies on React Server Components (RSC) and server actions (`"use server"`) within the `/utils` directory for secure database interactions.
*   **Styling:** CSS modules are used extensively alongside global variables in `globals.css` for consistent theming and dynamic lighting/gradient effects.
