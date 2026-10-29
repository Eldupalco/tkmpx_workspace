# Next.js + Chakra UI + TypeScript Web Client

A modern, component- and feature-based frontend designed to work with your NestJS & Prisma Attendance API.

---

## 📁 Project Architecture (Feature-Based)

```text
web/
├── app/                              # Next.js App Router (Page Views & Shells)
│   ├── layout.tsx                    # Root HTML layout and metadata
│   ├── providers.tsx                 # Client-side ChakraProvider & AuthProvider
│   ├── login/page.tsx                # Authentication entry view
│   ├── dashboard/page.tsx            # Employee self-service workspace
│   └── admin/dashboard/page.tsx      # Admin workforce operations & audit radar
│
├── features/                         # 🎯 Domain-Driven Business Modules
│   ├── auth/                         # Login, session guard, JWT context & auth API
│   ├── attendance/                   # Punch buttons, history tables, timesheets, leave modals
│   ├── schedule/                     # Weekly shift cards & bulk schedule assignment
│   └── users/                        # Team members roster, profile settings, live presence
│
├── components/                       # 🧩 Shared Reusable UI Design System
│   ├── Navbar.tsx                    # Header with user avatar, profile menu, and live status
│   ├── StatCard.tsx                  # Metric KPI card with custom tooltips and status badges
│   ├── Pagination.tsx                # Universal arrow pagination controls
│   ├── DateRangePopover.tsx          # Floating calendar picker with 1-click presets
│   └── index.ts                      # Clean barrel exports for @/components
│
├── lib/                              # 🛠️ Shared Infrastructure
│   ├── api-client.ts                 # Base fetch configuration & Bearer auth headers
│   └── api.ts                        # Facade re-exporting all feature endpoints
│
├── types/                            # 📦 Global Types
│   └── attendance.ts                 # Facade re-exporting all domain interfaces
│
└── package.json                      # Runs on http://localhost:3001
```

---

## 🚀 How to Run

### 1. Start the Frontend Development Server

From the project root or the `web/` directory:
```bash
cd web
pnpm dev
# or npm run dev
```

Open your browser to [http://localhost:3001](http://localhost:3001).

> **Note on Port 3001:** The web client runs on port `3001` so that it doesn't conflict with your NestJS backend running on port `3000`.

### 2. Connect to NestJS API

Set an environment variable or create `.env.local` inside `web/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📚 Detailed Documentation for Beginners

- 🚀 **[End-to-End Beginner Setup & Installation Guide](../docs/beginner-setup-guide.md)**: Complete step-by-step installation from Docker database to web login.
- 🌐 **[Web API Architecture & Integration Guide](../docs/web-api-architecture-guide.md)**: How Next.js pages authenticate and consume backend endpoints.
