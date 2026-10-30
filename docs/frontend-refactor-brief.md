# Frontend Brief: Components, Hooks and Data Flow

Discussion document for the lead review of the `web/` refactor on branch `feat/dtr-punches-and-security-fixes`. Date: 30/10/2026.

## Conclusion

The web app now follows one pattern everywhere:

- **Layouts** own the frame and access check of an area (`/employee`, `/admin`).
- **Pages** only arrange sections.
- **Sections** load their own data through **feature hooks** (TanStack Query).
- **Feature hooks** call **API functions**, which all go through one client (`lib/api-client.ts`).

Result: no prop drilling on the employee dashboard, requests run in parallel and are cached, one failed request no longer blanks the page, and new pages are protected by default. Open points for discussion are listed in the last section.

## 1. Folder map

```
web/
├── app/                              # WHERE things show (routes)
│   ├── layout.tsx                    # Root: HTML, fonts, <Providers>
│   ├── providers.tsx                 # QueryClient, Chakra theme, AuthProvider
│   ├── employee/
│   │   ├── layout.tsx                # AuthGuard (user, admin) + Navbar + Container
│   │   └── dashboard/
│   │       ├── page.tsx              # Arranges 5 sections, no logic
│   │       ├── error.tsx             # Crash fallback with "Try again"
│   │       └── components/           # Sections that load their own data
│   └── admin/
│       ├── layout.tsx                # AuthGuard (admin) + Navbar + Container
│       └── dashboard/
│           ├── page.tsx
│           ├── hooks/useAdminDashboard.ts   # Modal state and user actions
│           └── components/
├── features/                         # WHAT the app does (logic, reusable UI)
│   ├── auth/        api/ components/ context/ types/
│   ├── attendance/  api/ components/ hooks/ types/
│   ├── schedule/    api/ components/ hooks/ types/
│   └── users/       api/ components/ hooks/ types/
├── components/                       # Shared UI: Navbar, StatCard, Pagination, DateRangePopover
└── lib/api-client.ts                 # The only place that talks HTTP
```

`app/` decides **where** and **for whom**; `features/` decides **what**. Pages import from features, never the other way round.

## 2. Building blocks

| Block | What it is | Example | Rule |
|---|---|---|---|
| Layout | Wraps every page in its folder; applied by Next.js from the folder position | `app/employee/layout.tsx` | Frame and access check only. No data loading. |
| Page | Route entry, `page.tsx` | `app/employee/dashboard/page.tsx` | Arranges sections. No state, no data. |
| Section component | A block of the page that loads its own data | `EmployeeSummaryCards`, `PunchHistorySection` | Calls feature hooks; owns its filters and local UI state. |
| Presentational component | Pure UI, receives everything by props | `StatCard`, `AttendanceTable`, `Pagination` | No API calls. Reusable across areas. |
| Feature query hook | Reads server data with caching | `useAttendanceSummary()` | One hook per endpoint, in `features/<module>/hooks/`. |
| Feature mutation hook | Changes server data, then refreshes the cache | `usePunch()` | Invalidates only the affected cache keys. |
| Context hook | Reads app-wide state | `useAuth()` | Only for truly global state (session). |
| API function | One endpoint call | `fetchAttendanceSummary()` | Goes through `apiRequest` / `apiRequestPage` / `apiDownload`. |
| API client | Headers, 401 logout, error handling | `lib/api-client.ts` | Throws `ApiError` (message + HTTP status). |

## 3. How the pieces connect: one example end to end

The summary cards on the employee dashboard, from screen to database.

**Page** only places the section:

```tsx
// app/employee/dashboard/page.tsx
<VStack spacing={6} align="stretch">
  <EmployeeHeader />
  <PunchTerminalCard />
  <EmployeeSummaryCards />
  <ScheduleSection />
  <PunchHistorySection />
</VStack>
```

**Section** asks a feature hook for data and renders it:

```tsx
// app/employee/dashboard/components/EmployeeSummaryCards.tsx
const { data: summary = EMPTY_SUMMARY, isPending } = useAttendanceSummary();
if (isPending) return <Skeleton ... />;
return <StatCard title="Present Shifts" value={summary.present} ... />;
```

**Feature hook** wraps TanStack Query with a cache key scoped to the user:

```ts
// features/attendance/hooks/attendance.queries.ts
export function useAttendanceSummary() {
  const { user, token } = useAuth();
  return useQuery<AttendanceSummary>({
    queryKey: attendanceKeys.summary(user?.id ?? ''),
    queryFn: () => fetchAttendanceSummary(token!),
    enabled: !!token && !!user,
  });
}
```

**API function** names the endpoint and its types:

```ts
// features/attendance/api/attendance.api.ts (simplified: optional userId omitted)
export function fetchAttendanceSummary(token: string): Promise<AttendanceSummary> {
  return apiRequest('/attendances/summary', { token, errorMessage: 'Failed to fetch attendance summary' });
}
```

**API client** sends the request and handles errors for every call:

```ts
// lib/api-client.ts (simplified)
const res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body, cache: 'no-store' });
if (res.status === 401 && token) onUnauthorized?.();   // session expired: log out
if (!res.ok) throw new ApiError(message, res.status);
```

## 4. Render cycle on the employee dashboard

| Step | What happens |
|---|---|
| 1. Hydration | Server sends HTML; the browser attaches React (`'use client'` pages). |
| 2. Session check | `AuthProvider` restores the token from `localStorage` and verifies it with `GET /auth/profile`. `AuthGuard` shows "Verifying your session…" meanwhile, or redirects to `/login`. |
| 3. Mount | Layout mounts (Navbar, Container), then the five sections mount. |
| 4. Data | Each section's `useQuery` returns cached data if younger than 30 s, otherwise calls the API. All sections load in parallel. |
| 5. Re-render | Data arrives: skeleton is replaced by content, per section. |
| 6. User action | Typing in search updates the input at once; 300 ms later the filter state changes, the cache key changes and only the history reloads. |
| 7. Mutation | A punch calls `usePunch`; on success the user's attendance cache is invalidated and the affected sections reload. |
| 8. Unmount | Leaving the page unmounts the sections; the layout stays mounted while the user stays under `/employee`. |

## 5. Hook inventory

| Hook | Kind | File | Used by |
|---|---|---|---|
| `useAuth` | Context | `features/auth/context/AuthContext.tsx` | Guards, Navbar, every feature hook |
| `useTodayStatus` | Query | `features/attendance/hooks/attendance.queries.ts` | `PunchTerminalCard` |
| `useAttendanceSummary` | Query | same | `EmployeeSummaryCards` |
| `useAttendanceHistory` | Query (paged) | same | `PunchHistorySection` |
| `useTimesheet` | Query (only while modal open) | same | `EmployeeHeader` |
| `usePunch` | Mutation | same | `PunchTerminalCard` |
| `useMySchedule`, `useTodaySchedule` | Query | `features/schedule/hooks/schedule.queries.ts` | `ScheduleSection` |
| `useDashboardMetrics`, `useCurrentlyIn` | Query | `features/users/hooks/admin.queries.ts` | Admin dashboard |
| `useAttendanceRoster` | Query (paged) | same | `AttendanceRosterTab` |
| `useAdminPunch` | Mutation | same | `AttendanceRosterTab` (manager override punch) |
| `useUsersPage` | Query (paged, server search) | same | `TeamRosteringTab` |
| `useUsers` | Query (all users) | same | Bulk-schedule user picker, tab count |
| `useAdminDashboard` | Page hook | `app/admin/dashboard/hooks/` | Admin page: modals and user actions (create, edit, delete, shifts) |
| `useState`, `useEffect` | React | anywhere | Local UI state; debounce timers |
| `useDisclosure`, `useToast` | Chakra UI | components | Modal open/close; notifications |
| `useQueryClient` | TanStack | components, AuthContext | Invalidate after changes; clear cache on logout |

**Cache keys** are built by factories (`attendanceKeys`, `scheduleKeys`, `adminKeys`), so related data can be refreshed together, for example `invalidateQueries({ queryKey: attendanceKeys.all(user.id) })` after a leave request.

## 6. Shared configuration

`app/providers.tsx` creates one `QueryClient` per browser session:

| Setting | Value | Effect |
|---|---|---|
| `staleTime` | 30 s | Re-opening a screen within 30 s uses the cache, no API call. |
| `retry` | 1 | One retry for network glitches before reporting an error. |
| `queryCache.onError` | One toast, fixed id | Any failed load shows a single "Some data could not be loaded" toast, no duplicates. |
| Logout | `queryClient.clear()` | The next user never sees cached data of the previous user. |

## 7. Conventions for new work

1. New area → `app/<area>/layout.tsx` with its `AuthGuard` roles.
2. New page → `page.tsx` that only arranges sections.
3. New data → API function in `features/<module>/api/`, named types in `types/`, query or mutation hook in `hooks/`.
4. Sections call hooks directly; pass props only to presentational components and for actions owned by the page (modals).
5. Never copy server data into `useState`; read it from the query.
6. `useEffect` only for timers, subscriptions or browser APIs, not to derive values.
7. Request and response shapes are named interfaces; roles and statuses use `UserRole`, `AttendanceStatus`, `StatusFilter`.

## 8. Before and after

| Measure | Before | After |
|---|---|---|
| Employee dashboard page + page hook | 143 + 242 lines, 21 `useState` | 23 lines, no page hook |
| Data loading on filter change | All 5 endpoints, one after another | Only the history |
| One failed request | Whole page marked offline | One toast; other sections unaffected |
| `res.ok` checks in API files | 25 | 0 (one `send()` in the client) |
| One-line re-export files | 13 | 0 |
| Admin team list | First 50 users, filtered in the browser | Server-side search, role filter and paging |

## 9. Open points for discussion

1. **Session token in `localStorage`.** Readable by injected scripts and not checked on the server before render. Proposal: httpOnly cookie set by NestJS plus `middleware.ts` (phase 2, needs backend change).
2. **Admin roster tab made self-contained** (done). It owns its filters, data, manager punch override and the company CSV export; its 16 props are gone. The record count moved from the tab heading into the tab.
3. **`QueryClient` retries 4xx errors and shows the toast on 401.** Proposal: skip retry for 4xx `ApiError`, skip toast for 401. Small change in `providers.tsx`.
4. **Filters reset on page refresh.** URL-based filters were tried and removed for simplicity. Decide whether shareable filter links are needed.
5. **Bulk-schedule user picker** loads all users into a dropdown. Fine into the hundreds; needs search-as-you-type for thousands.
6. **No automated frontend tests.** Proposal: React Testing Library for sections, one Playwright test for login and punch.
7. **Navbar `isLiveApi` indicator** is no longer driven by any page and always shows "System Online". Remove or reconnect.
8. **`docs/frontend-architecture-and-implementation-guide.md` is outdated** (mentions `useEmployeeDashboard`, `CheckInButton`). Replace with this brief or update it.
9. **Not yet verified in a browser.** Type-check and production build pass; manual test against the running API is still pending.
