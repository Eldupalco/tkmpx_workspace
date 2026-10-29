# System Endpoint & UI Integration Checklist

This checklist tracks the end-to-end integration status between the **NestJS Backend API (`http://localhost:3000`)** and the **Next.js Web Client (`http://localhost:3001`)**.

---

## 1. Authentication Module (`/auth`)

| Endpoint | Method | Role | Backend | Web API (`api.ts`) | UI Component / Workflow | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `/auth/login` | `POST` | Public | [x] | [x] | [`LoginForm.tsx`](../web/components/LoginForm.tsx) | **Fully Integrated** |
| `/auth/profile` | `GET` | Auth | [x] | [x] | [`AuthContext.tsx`](../web/context/AuthContext.tsx) (Session restore) | **Fully Integrated** |
| `/auth/profile` | `PATCH` | Auth | [x] | [x] | [`ProfileModal.tsx`](../web/components/ProfileModal.tsx) | **Fully Integrated** |
| `/auth/change-password` | `POST` | Auth | [x] | [x] | [`ProfileModal.tsx`](../web/components/ProfileModal.tsx) | **Fully Integrated** |
| `/auth/forgot-password` | `POST` | Public | [x] | [ ] | Forgot Password Modal | *Pending UI* |
| `/auth/reset-password` | `POST` | Public | [x] | [ ] | Reset Password Page/Modal | *Pending UI* |
| `/auth/register` | `POST` | Public | [x] | [ ] | Public Self-Registration | *Pending UI / Optional* |

---

## 2. Users Module (`/users`) — Admin Only

| Endpoint | Method | Role | Backend | Web API (`api.ts`) | UI Component / Workflow | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `/users` | `GET` | Admin | [x] | [x] | [`admin/dashboard/page.tsx`](../web/app/admin/dashboard/page.tsx) (Filter & Team Roster) | **Fully Integrated** |
| `/users` | `POST` | Admin | [x] | [x] | [`UserModal.tsx`](../web/components/UserModal.tsx) (`createUser`) | **Fully Integrated** |
| `/users/:id` | `GET` | Admin | [x] | [x] | Loaded in `usersList` cache | **Fully Integrated** |
| `/users/:id` | `PATCH` | Admin | [x] | [x] | [`UserModal.tsx`](../web/components/UserModal.tsx) (`updateUser`) | **Fully Integrated** |
| `/users/:id` | `DELETE` | Admin | [x] | [x] | [`admin/dashboard/page.tsx`](../web/app/admin/dashboard/page.tsx) (`deleteUser`) | **Fully Integrated** |

---

## 3. Attendances Module (`/attendances`)

| Endpoint | Method | Role | Backend | Web API (`api.ts`) | UI Component / Workflow | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `/attendances` | `GET` | Auth/Admin | [x] | [x] | Both Dashboards ([`AttendanceTable.tsx`](../web/components/AttendanceTable.tsx)) | **Fully Integrated** |
| `/attendances/today-status` | `GET` | Auth/Admin | [x] | [x] | [`employee/dashboard/page.tsx`](../web/app/employee/dashboard/page.tsx) ([`CheckInButton.tsx`](../web/components/CheckInButton.tsx)) | **Fully Integrated** |
| `/attendances/currently-in` | `GET` | Admin | [x] | [x] | [`LivePresenceCard.tsx`](../web/components/LivePresenceCard.tsx) | **Fully Integrated** |
| `/attendances/dashboard` | `GET` | Admin | [x] | [x] | [`admin/dashboard/page.tsx`](../web/app/admin/dashboard/page.tsx) (6 Pulse KPIs) | **Fully Integrated** |
| `/attendances/summary` | `GET` | Auth/Admin | [x] | [x] | [`employee/dashboard/page.tsx`](../web/app/employee/dashboard/page.tsx) (4 Employee KPIs) | **Fully Integrated** |
| `/attendances/timesheet` | `GET` | Auth/Admin | [x] | [x] | [`TimesheetModal.tsx`](../web/components/TimesheetModal.tsx) | **Fully Integrated** |
| `/attendances/export` | `GET` | Auth/Admin | [x] | [x] | Both Dashboards (`downloadAttendanceCsv`) | **Fully Integrated** |
| `/attendances/check-in` | `POST` | Auth/Admin | [x] | [x] | [`CheckInButton.tsx`](../web/components/CheckInButton.tsx) | **Fully Integrated** |
| `/attendances/:id/check-out`| `POST` | Auth/Admin | [x] | [x] | [`CheckInButton.tsx`](../web/components/CheckInButton.tsx) & Manager Override | **Fully Integrated** |
| `/attendances/leave` | `POST` | Auth/Admin | [x] | [x] | [`LeaveRequestModal.tsx`](../web/components/LeaveRequestModal.tsx) | **Fully Integrated** |
| `/attendances` | `POST` | Auth/Admin | [x] | [ ] | Manual Backfill Punch Modal | *Pending UI* |
| `/attendances/:id` | `GET` | Auth/Admin | [x] | [ ] | Attendance Detail Inspection Drawer | *Pending UI* |
| `/attendances/:id` | `PATCH` | Auth/Admin | [x] | [ ] | Edit Punch Time / Notes Modal | *Pending UI* |
| `/attendances/:id` | `DELETE`| Admin | [x] | [ ] | Delete Erroneous Punch Record | *Pending UI* |

---

## 4. Schedules Module (`/schedules`)

| Endpoint | Method | Role | Backend | Web API (`api.ts`) | UI Component / Workflow | Status |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `/schedules/my-schedule` | `GET` | Auth/Admin | [x] | [x] | [`ScheduleCard.tsx`](../web/components/ScheduleCard.tsx) | **Fully Integrated** |
| `/schedules/today` | `GET` | Auth/Admin | [x] | [x] | [`ScheduleCard.tsx`](../web/components/ScheduleCard.tsx) (Today indicator) | **Fully Integrated** |
| `/schedules/bulk` | `POST` | Admin | [x] | [x] | [`BulkScheduleModal.tsx`](../web/components/BulkScheduleModal.tsx) | **Fully Integrated** |
| `/schedules/bulk-users` | `POST` | Admin | [x] | [ ] | Multi-User Shift Assignment Modal | *Pending UI* |
| `/schedules` | `GET` | Auth/Admin | [x] | [ ] | Raw Shift Table View | *Pending UI* |
| `/schedules/:id` | `GET` | Auth/Admin | [x] | [ ] | Single Shift Inspection | *Pending UI* |
| `/schedules` | `POST` | Admin | [x] | [ ] | Single-Day Shift Creator | *Superseded by Bulk* |
| `/schedules/:id` | `PATCH` | Admin | [x] | [ ] | Edit Shift Hours Modal | *Pending UI* |
| `/schedules/:id` | `DELETE`| Admin | [x] | [ ] | Delete Recurring Shift Rule | *Pending UI* |

---

## Progress Overview
- **Total Backend Endpoints:** 30
- **Fully Integrated in UI:** 20 (All core workforce workflows + complete Admin User Management CRUD)
- **Pending UI Integration:** 10 (Password self-service recovery, manual backfill, cohort shifts)

---

## 5. UI & Data Table Cleanliness Standards (Achieved)

- **Search & Pagination on Every Data Table / List:**
  - **Employee Punch History Table:** Real-time debounced search (300ms) across notes/dates, status dropdown filter (`All`, `Present`, `Late`, `On Leave`, `Absent`), 1-click Reset, and server-side `<Pagination>` with configurable records-per-page.
  - **Admin Attendance Roster Table:**
    - Searchable Employee Input (debounced search across user names, emails, and IDs).
    - Dedicated Notes Search Input.
    - Status Filter with case-insensitive matching supporting `present`, `late`, `on_leave` / `leave`, and `absent`.
    - Floating Date Range Popover ([`DateRangePopover.tsx`](../web/components/DateRangePopover.tsx)) with 1-click presets (*Today*, *Yesterday*, *This Week*, *Last 7 Days*, *This Month*, *Last 30 Days*) and custom date interval inputs.
    - 1-click **Reset** clearing all active filter states.
    - Server-side `<Pagination>` with rows-per-page options.
  - **Admin Team Members Table (Tab 3):** Search by employee name or email, role filter (`All`, `Admin`, `Staff`), 1-click Reset, custom empty state, and client-side `<Pagination>` with page size switcher.
  - **Timesheet & Overtime Modal:** Search by date, status filter, count indicator, and sticky header.
- **Visual Polish & Ergonomics (60-30-10 System):**
  - Consistent table cell padding (`py={3.5}`), row hover feedback (`_hover={{ bg: 'slate.50' }}` with smooth `0.15s` ease transitions), clean typographic headers with `10px` uppercase tracking, and right-aligned action buttons (`isNumeric`).
  - No decorative icon clutter in tabs or KPI metric cards.


