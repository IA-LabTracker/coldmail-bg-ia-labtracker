# Cold Email Pro — Project Context

## What is this?
B2B cold email & LinkedIn automation platform. Users import leads (CSV/Excel), manage campaigns, track email/LinkedIn outreach, schedule dispatches, and analyze results.

**Built by:** IA LabTracker

## Tech Stack
- **Framework:** Next.js 14+ (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives) + Framer Motion
- **Database:** PostgreSQL via Supabase (RLS enforced on all tables)
- **Auth:** Supabase Auth (email/password) — `AuthContext` provides `user`/`session`
- **Forms:** React Hook Form + Zod validation
- **State:** React hooks + direct Supabase queries (no Redux/Zustand)
- **Integrations:** Unipile (LinkedIn OAuth), N8N (webhook automation)
- **Notifications:** Sonner (toast)
- **Icons:** Lucide React

## Database Tables
| Table | Purpose |
|-------|---------|
| `emails` | Lead/email records — the core entity. Fields: company, email, lead_name, phone, city, state, status, lead_classification, campaign_name, keywords[], notes, client_tag, client_step, etc. |
| `settings` | Per-user config: webhook_url, email_template, linkedin_account_id |
| `linkedin_messages` | LinkedIn outreach tracking with full profile data, quality scoring |
| `linkedin_accounts` | Unipile LinkedIn account connections |
| `schedules` | Email dispatch automation (one_time/recurring) |

All tables use RLS: `auth.uid() = user_id`

## Project Structure
```
app/
├── dashboard/       → Analytics + Email Manager (tabs)
├── campaigns/       → Campaign overview with KPIs
├── search/          → Webhook-based lead search
├── linkedin-table/  → LinkedIn messages table
├── schedules/       → Schedule creation & management
├── import/          → Multi-step CSV/Excel import wizard
├── settings/        → Webhooks, LinkedIn, email templates
├── api/
│   ├── linkedin-accounts/  → GET/DELETE LinkedIn accounts
│   ├── unipile-auth/       → POST create Unipile auth link
│   ├── unipile-callback/   → POST webhook from Unipile
│   └── schedules/trigger/  → POST trigger N8N webhook

components/
├── ui/              → 47 shadcn/ui primitives
├── dashboard/       → EmailManagerTab, EmailDetailModal, KPICards, EmailTable, BulkActions, EmailFilters, CompanyGroupRow
├── campaigns/       → CampaignList, CampaignTable, CampaignKPICards
├── linkedin-table/  → LinkedInTable, LinkedInDetailModal, LinkedInKPICards
├── linkedin/        → ConnectionStep, UploadStep, CampaignSettingsStep
├── schedules/       → CreateScheduleDialog, ScheduleCardList, ScheduleDetailModal, CampaignLeadPicker
├── import/          → ImportStepper, ImportStepUpload/Review/Confirm, PreviewTable
├── search/          → SearchFormCard, SearchStatusBanner
├── settings/        → WebhooksSection, EmailTemplateSection
├── analytics/       → AnalyticsDashboard
├── shared/          → PageLoading, PageError, LoadingSpinner, ErrorMessage, AlertModal
├── AppLayout.tsx, Sidebar.tsx, Navbar.tsx

hooks/
├── useAuth.ts, useSettings.ts, useLinkedInMessages.ts
├── useAnalyticsData.ts, useEmailSelection.ts, useSelection.ts
├── useInfiniteScroll.ts

lib/
├── supabase.ts (browser), supabase-server.ts, supabase-middleware.ts
├── importParser.ts, importValidator.ts, csvParser.ts
├── groupEmailsByCompany.ts, groupLinkedInByCompany.ts
├── scheduleDates.ts, formatDate.ts, utils.ts

types/index.ts       → Email, Settings, LinkedInMessage, Schedule, ImportRow, etc.
```

## Key Patterns

### Data Fetching
Direct Supabase queries in components/hooks:
```typescript
const { data, error } = await supabase
  .from("emails")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

### Create/Edit Modals
Pattern: Dialog (shadcn/ui) + local state or React Hook Form + Zod.
- Reference: `CreateScheduleDialog.tsx` (useState pattern)
- Reference: `EmailDetailModal.tsx` (React Hook Form + Zod pattern)
- Always reset form on close, show toast on success/error

### Grouping
Emails grouped by company (`groupEmailsByCompany`) for table display.
LinkedIn messages grouped similarly.

### Selection & Bulk Actions
`useEmailSelection` hook for multi-select with shift-click support.
`BulkActions` component for bulk operations.

### Infinite Scroll
`useInfiniteScroll` hook for lazy loading grouped data.

## Commands
```bash
npm run dev         # Dev server :3000
npm run build       # Production build
npm run lint        # ESLint
npm run typecheck   # TypeScript check
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
UNIPILE_API_KEY, UNIPILE_DSN, UNIPILE_WEBHOOK_SECRET (optional)
```

## Important Notes
- "Leads" are stored in the `emails` table — each row = one lead/contact
- No dedicated "leads" page exists; leads are managed through Dashboard > Email Manager tab
- Import is the primary way to create leads (CSV/Excel upload)
- The app is single-tenant (per-user data isolation via Supabase RLS)
- Portuguese-speaking user (Brazilian)
