# Design Document

## Project Overview

This project is a student productivity application built around daily execution, subject-based planning, and lightweight study analytics. The current experience combines task management, subject tracking, focus sessions, and profile personalization in a single React frontend backed by Supabase.

The product language in the repository currently uses both `NEXUS` and `Clarity OS`. In practice, the UI reads more like `Clarity OS`, while metadata and docs still reference `NEXUS`.

## Product Goals

- Help students decide what to work on today
- Keep subjects, exams, and tasks connected
- Reduce planning friction with a calm, structured interface
- Surface momentum through streaks, readiness, and study-time visibility
- Support personalization without turning the app into a settings-heavy tool

## Primary User

The app appears designed for students managing multiple subjects, exam dates, and day-to-day study tasks. The ideal user needs:

- a clear daily task view
- subject-aware planning
- lightweight progress tracking
- a simple profile and preference system

## Core User Flows

### 1. Authentication

Users sign up or log in with email/password through Supabase Auth. After login, routing respects the user’s preferred default page when available.

### 2. Onboarding

When a signed-in user has no subjects and has not completed onboarding, the app opens an onboarding flow. This suggests that subjects are the foundation for the rest of the experience.

### 3. Daily Dashboard

The dashboard is the operational home screen. It pulls together:

- greeting and date context
- today’s tasks
- subject-linked exam urgency
- streak and weekly completion signals
- focus timer and study-minute tracking

This page is designed to answer: "What matters today?"

### 4. Task Planning

The tasks page organizes work into:

- `Today`
- `Upcoming`
- `Later`

It supports subject filtering and optional grouping by subject. This makes the backlog feel structured rather than flat.

### 5. Subject Management

Users can create, edit, and delete subjects with:

- name
- color
- exam date
- description

Subjects act as planning anchors and visual categories across the app.

### 6. Analytics

The analytics page turns completed tasks and study sessions into:

- streak metrics
- subject-level progress
- completion patterns
- heatmap-style consistency views

### 7. Profile and Preferences

The profile page includes:

- display name and bio
- avatar color
- school
- target date
- theme preference
- accent color
- default landing page

Some profile preferences are also cached locally to keep the interface resilient when profile schema fields are missing or sync is incomplete.

## Information Architecture

The app shell uses a straightforward five-area structure:

- Dashboard
- Tasks
- Subjects
- Analytics
- Profile

Desktop navigation lives in a left sidebar. Mobile navigation shifts to a bottom nav, which keeps the main sections reachable without adding routing complexity.

## Visual Design System

### Design Tone

The visual language is calm, modern, and utility-first. It avoids noisy decoration and leans on spacing, soft elevation, and color-coded status.

### Typography

The app imports:

- `Outfit` for primary UI text
- `Inter` as an available support font
- `JetBrains Mono` for numeric/system-style values

This gives the product a slightly polished, modern feel while keeping metrics readable.

### Color System

The CSS defines a token-based theme system with:

- background layers
- text hierarchy
- border hierarchy
- accent color
- semantic urgency colors
- subject palette colors

Primary semantic tones:

- `safe`
- `mid`
- `high`
- `critical`

These are reused across tasks, exam urgency, and progress views.

### Theming

The app supports:

- light mode
- dark mode
- system mode

Theme behavior is centralized through `ThemeContext`, and the UI also supports user-selectable accent colors.

### Surfaces and Shape

The interface relies on:

- rounded cards
- raised secondary surfaces
- subtle borders
- soft shadows

Common radii:

- `12px` for raised controls
- `16px` for major cards and panels

This keeps the product approachable without becoming overly playful.

### Motion

Motion is minimal and supportive:

- entry animations for page sections
- hover elevation on cards and controls
- short color/border/shadow transitions

The intent is responsiveness, not spectacle.

## UX Patterns

### 1. Operational Cards

Most screens use card-based sections for:

- summaries
- forms
- grouped content
- analytics panels

### 2. Status-Oriented Copy

UI copy is concise and action-oriented. Examples include exam countdown messaging, empty-state messaging, and lightweight warnings.

### 3. Progressive Organization

The app groups complexity instead of showing everything at once:

- tasks by time horizon
- tasks by subject
- analytics by timeframe
- profile settings by concern

### 4. Local Resilience

Profile preferences use local storage as a fallback layer. This is a practical UX choice because it softens rough edges when backend schema and frontend capabilities evolve at different speeds.

## Technical Architecture

## Frontend

- React 18
- Vite
- React Router
- Context for theme and subject state
- Custom hooks for auth and task data

Important frontend areas:

- `frontend/src/App.jsx` for app-level routing and auth gates
- `frontend/src/components/AppShell.jsx` for shared layout and navigation
- `frontend/src/styles.css` for global design tokens and component styling
- `frontend/src/pages/*` for route-level experiences

## Backend / Data

Supabase provides:

- authentication
- Postgres storage
- realtime subscriptions

Key tables in the current schema:

- `profiles`
- `tasks`
- `subjects`
- `study_sessions`
- `daily_reviews`

RLS is enabled across core tables, with per-user ownership policies.

## Realtime Behavior

Realtime subscriptions are already used for:

- `study_sessions` updates on the dashboard
- `study_sessions` updates on analytics

This keeps focus and study metrics current without manual refresh.

## Data Model Summary

### Profiles

Stores identity and user preferences. The SQL schema currently includes a base profile structure, while the frontend expects additional optional fields such as:

- `display_name`
- `bio`
- `avatar_color`
- `school`
- `target_date`
- `theme`
- `accent_color`
- `default_page`

That gap is partially handled in the UI with fallbacks and missing-column guards.

### Tasks

Tasks include:

- text
- weight
- completed state
- target date
- completion day
- subject link
- estimated minutes

### Subjects

Subjects include:

- name
- color
- exam date
- description

### Study Sessions

Used for focus-time analytics and subject-linked study tracking.

### Daily Reviews

Supports reflective inputs like focus score and blockers, though this appears less surfaced than the other features right now.

## Current Design Strengths

- Clear student-focused product direction
- Strong subject/task relationship
- Good use of semantic colors for urgency
- Responsive navigation model
- Practical light/dark/system theming
- Realtime study feedback adds energy to the app
- Profile customization is more thoughtful than a basic settings page

## Current Design Gaps / Observations

### 1. Branding is split

The repo references both `NEXUS` and `Clarity OS`. A single brand direction would make the product feel more intentional.

### 2. Schema and UI are slightly ahead of each other

The profile UI expects more fields than the base SQL schema guarantees. The frontend handles this defensively, but the design and data contract should be aligned.

### 3. Iconography is custom inline SVG

The current icons work, but a shared icon system would improve consistency and maintainability.

### 4. Global styles are centralized in one large stylesheet

This is workable today, but as the app grows, the design system may become harder to evolve cleanly without either component-level organization or clearer style sections.

## Recommended Next Design Steps

1. Choose one product name and apply it across app metadata, UI copy, and docs.
2. Align the `profiles` table schema with the fields already supported in the profile page.
3. Document reusable UI primitives such as cards, buttons, pills, filters, and stat blocks.
4. Standardize icons with a shared library or internal icon wrapper.
5. Add a small component inventory section over time as new patterns stabilize.

## Suggested File Ownership for Design

- Global design tokens and visual system: `frontend/src/styles.css`
- Route structure and layout behavior: `frontend/src/App.jsx`, `frontend/src/components/AppShell.jsx`
- Page-level experience definitions: `frontend/src/pages/`
- Backend design constraints: `database/supabase_schema.sql`

## Short Summary

This project is a thoughtfully scoped student productivity app with a strong daily-planning foundation. Its design is already heading in a good direction: calm interface, subject-centered structure, useful analytics, and flexible personalization. The biggest opportunities now are consistency, schema alignment, and turning the current styling approach into a more explicit design system.
