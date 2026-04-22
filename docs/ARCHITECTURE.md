# NEXUS App Architecture

## 🏗️ Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Sign Up    │  │    Login     │  │   Logout     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MAIN APPLICATION                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     SIDEBAR                           │  │
│  │  • Dashboard  • Tasks  • Community                    │  │
│  │  • Groups  • Analytics  • Leaderboard                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   MAIN CONTENT                        │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Dashboard  │  │    Tasks    │  │  Analytics  │  │  │
│  │  │             │  │             │  │             │  │  │
│  │  │ • Stats     │  │ • Create    │  │ • Charts    │  │  │
│  │  │ • Urgent    │  │ • Edit      │  │ • Badges    │  │  │
│  │  │ • Recent    │  │ • Delete    │  │ • Trends    │  │  │
│  │  │ • Badges    │  │ • Complete  │  │ • Breakdown │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Community  │  │   Groups    │  │ Leaderboard │  │  │
│  │  │ (Placeholder)│  │(Placeholder)│  │(Placeholder)│  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │  Firestore   │  │   Hosting    │      │
│  │              │  │              │  │              │      │
│  │ • Users      │  │ • Tasks      │  │ • Static     │      │
│  │ • Sessions   │  │ • Posts      │  │   Files      │      │
│  │ • Security   │  │ • Groups     │  │ • CDN        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Action (Create Task)
     ▼
┌─────────────────┐
│  React Component│
│   (Tasks.jsx)   │
└────┬────────────┘
     │
     │ 2. Call Hook
     ▼
┌─────────────────┐
│  useFirestore   │
│     Hook        │
└────┬────────────┘
     │
     │ 3. Firebase API Call
     ▼
┌─────────────────┐
│   Firestore     │
│   Database      │
└────┬────────────┘
     │
     │ 4. Real-time Update
     ▼
┌─────────────────┐
│  React Component│
│   (Auto Update) │
└────┬────────────┘
     │
     │ 5. UI Update
     ▼
┌──────────┐
│   User   │
│  Sees    │
│  Change  │
└──────────┘
```

## 🔐 Authentication Flow

```
┌─────────────┐
│  User Opens │
│     App     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Check Auth     │
│  Status         │
└──────┬──────────┘
       │
       ├─── Not Logged In ───┐
       │                     │
       │                     ▼
       │              ┌──────────────┐
       │              │  Show Auth   │
       │              │  Component   │
       │              └──────┬───────┘
       │                     │
       │                     │ Login/Signup
       │                     ▼
       │              ┌──────────────┐
       │              │   Firebase   │
       │              │     Auth     │
       │              └──────┬───────┘
       │                     │
       │                     │ Success
       │                     ▼
       └─── Logged In ───────┐
                             │
                             ▼
                      ┌──────────────┐
                      │  Load User   │
                      │    Data      │
                      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  Show Main   │
                      │     App      │
                      └──────────────┘
```

## 📁 Component Hierarchy

```
App.jsx
├── Auth.jsx (if not logged in)
│   ├── FInput (name, email, password)
│   └── Btn (submit)
│
└── Main App (if logged in)
    ├── Sidebar.jsx
    │   ├── Logo
    │   ├── Navigation
    │   │   ├── Dashboard
    │   │   ├── Tasks
    │   │   ├── Community
    │   │   ├── Groups
    │   │   ├── Analytics
    │   │   └── Leaderboard
    │   └── User Profile
    │       ├── Avatar
    │       ├── Level Info
    │       └── Logout Button
    │
    └── Page Content
        ├── Dashboard.jsx
        │   ├── StatCard (x4)
        │   ├── Level Progress
        │   ├── Urgent Tasks
        │   └── Recent Wins
        │
        ├── Tasks.jsx
        │   ├── Filters
        │   ├── TaskCard (multiple)
        │   └── TaskFormModal
        │       ├── FInput (title, desc, deadline)
        │       ├── FSelect (difficulty, category)
        │       └── Btn (save, cancel)
        │
        ├── Analytics.jsx
        │   ├── StatCard (x4)
        │   ├── BarChart (daily tasks)
        │   ├── PieChart (categories)
        │   └── Badge Grid
        │
        ├── Community.jsx (placeholder)
        ├── Groups.jsx (placeholder)
        └── Leaderboard.jsx (placeholder)
```

## 🔄 State Management

```
┌─────────────────────────────────────────┐
│         Firebase Firestore              │
│         (Source of Truth)               │
└────────────────┬────────────────────────┘
                 │
                 │ Real-time Listeners
                 ▼
┌─────────────────────────────────────────┐
│         useFirestore Hook               │
│         (Data Management)               │
└────────────────┬────────────────────────┘
                 │
                 │ Provides: data, add, update, remove
                 ▼
┌─────────────────────────────────────────┐
│         React Components                │
│         (UI Rendering)                  │
└─────────────────────────────────────────┘
```

## 🎯 Task Completion Flow

```
User clicks "Mark Complete"
         │
         ▼
┌─────────────────────┐
│  Calculate Score    │
│  • Base (difficulty)│
│  • Early bonus      │
│  • Late penalty     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Task        │
│  • status: Complete │
│  • completedAt      │
│  • pointsEarned     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update User Stats  │
│  • score += points  │
│  • completed++      │
│  • hardTasks++      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Level Up     │
│  • Calculate level  │
│  • Update progress  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Badges       │
│  • Evaluate rules   │
│  • Show new badges  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  UI Updates         │
│  • Show XP gained   │
│  • Update dashboard │
│  • Refresh analytics│
└─────────────────────┘
```

## 🔒 Security Architecture

```
┌─────────────────────────────────────────┐
│              Client Side                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Environment Variables (.env)     │ │
│  │  • API Keys (public, safe)        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Firebase SDK                     │ │
│  │  • Auth Token Management          │ │
│  └───────────────────────────────────┘ │
└────────────────┬────────────────────────┘
                 │
                 │ Authenticated Requests
                 ▼
┌─────────────────────────────────────────┐
│           Firebase Backend              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Authentication                   │ │
│  │  • Verify user identity           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Firestore Security Rules         │ │
│  │  • Check userId matches           │ │
│  │  • Validate permissions           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Database                         │ │
│  │  • Isolated user data             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 📱 Responsive Design

```
┌─────────────────────────────────────────┐
│            Desktop (> 768px)            │
│                                         │
│  ┌──────────┬──────────────────────┐   │
│  │          │                      │   │
│  │ Sidebar  │    Main Content      │   │
│  │ (Fixed)  │    (Scrollable)      │   │
│  │          │                      │   │
│  └──────────┴──────────────────────┘   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│            Mobile (< 768px)             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ☰ Menu Button (Top Left)       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │      Main Content               │   │
│  │      (Full Width)               │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Sidebar (Overlay when menu clicked)   │
└─────────────────────────────────────────┘
```

## 🚀 Deployment Pipeline

```
┌─────────────┐
│  Developer  │
│   Machine   │
└──────┬──────┘
       │
       │ npm run build
       ▼
┌─────────────┐
│   Vite      │
│   Build     │
└──────┬──────┘
       │
       │ Optimized dist/
       ▼
┌─────────────┐
│  Firebase   │
│   Deploy    │
└──────┬──────┘
       │
       │ Upload to CDN
       ▼
┌─────────────┐
│  Firebase   │
│  Hosting    │
└──────┬──────┘
       │
       │ Serve globally
       ▼
┌─────────────┐
│    Users    │
│  Worldwide  │
└─────────────┘
```

---

This architecture provides:
- ✅ Scalability
- ✅ Security
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Easy maintenance
- ✅ Fast performance
