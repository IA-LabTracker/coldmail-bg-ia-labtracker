# Cold Email Pro — Project Context

Plataforma B2B de cold email + LinkedIn outreach. Usuário importa leads (CSV/Excel),
gerencia campanhas, cadastra múltiplas caixas de envio (sender emails) com plataforma
de dispatch, roda warm-up controlado, agenda disparos via N8N. Single-tenant por RLS
(`auth.uid() = user_id`).

**Built by:** IA LabTracker · **Usuário:** Brasileiro, prefere respostas diretas em pt-BR.

---

## Stack

- **Next.js 14.2** (App Router) + **TypeScript 5.6** + **React 18.3**
- **Tailwind CSS 3.4** + **shadcn/ui** (47 primitivas em `components/ui/`) + **Framer Motion**
- **Recharts** (analytics), **Sonner** (toasts), **Lucide** (ícones)
- **Supabase** (Postgres + Auth email/senha + Edge Functions + RLS)
- **Zod** + **React Hook Form** quando form é complexo; `useState` direto no resto
- **xlsx** para import Excel, parser próprio para CSV
- **Integrações**: N8N (webhooks), Unipile (LinkedIn OAuth), Zapmail (sync de mailboxes)

Sem Redux/Zustand — estado local + `AuthContext` + queries diretas no Supabase.

---

## Rotas (`app/`)

```
/dashboard         Analytics + Email Manager (tabs)
/campaigns         Overview de campanhas + [name] detail · aba Warmup por sender
/import            Wizard CSV/Excel (upload → review → confirm)
/schedules         Agendamentos pontuais/recorrentes
/sender-emails     Lista de caixas · [id] detail page
/templates         Templates de email (com filtro por plataforma)
/linkedin-table    Tabela de mensagens LinkedIn
/search            Busca de leads via webhook
/settings          Webhooks, LinkedIn, template base
/profile /pricing /terms /login /signup
```

**API routes** (`app/api/`):
- `linkedin-accounts/` — GET/DELETE contas LinkedIn
- `unipile-auth/` — POST cria auth link Unipile
- `unipile-callback/` — webhook Unipile
- `schedules/trigger/` — dispara webhook N8N
- `zapmail/sync/` — sincroniza mailboxes do Zapmail

---

## Banco de dados

Todas as tabelas em `public`, RLS via `auth.uid() = user_id`.

| Tabela | Papel |
|---|---|
| `emails` | Leads/contatos (entidade central). Campos: company, email, lead_name, phone, city/state, status, lead_classification, campaign_name, keywords[], notes, client_tag, client_step, sender_email_id, dispatch_platform, date_sent, reply_* |
| `profiles` | Dados extras do usuário (full_name, avatar_url, company_name) |
| `subscriptions` | Plano do usuário (starter/professional, mensal/anual) |
| `settings` | webhook_url, email_template, linkedin_account_id, linkedin_webhook_url |
| `sender_emails` | Caixas de envio. provider + platform + daily_limit + is_default + status |
| `sender_warmups` | Config de warmup por sender: enabled, start_volume, increment_per_day, daily_limit, business_days_only, bounce_threshold_pct, started_at, paused_at, auto_paused_at, topped_out_at |
| `email_warmup_interactions` | Log de envios de warmup. **Schema fraco:** thread_id, sender (text), receiver, interaction_type, interaction_order, created_at — **sem** user_id/sender_email_id/placement. Join é via `sender` = `sender_emails.email_address` |
| `email_templates` | Templates com escopo de plataforma (any/gmail/outlook/smartlead/resend/zapmail/linkedin) |
| `schedules` | Disparos agendados (one_time/recurring) com lead_selections[] |
| `linkedin_accounts` | Contas Unipile conectadas |
| `linkedin_messages` | Mensagens LinkedIn + perfil completo + lead_quality_score |

### Gotchas do banco

1. **Schema drift:** `sender_emails` tem `platform`, `daily_limit`, `today_usage` em produção
   que não estão em migration nenhuma do repo (foram adicionadas via dashboard).
2. **CHECK constraint:** `sender_emails.platform` só aceita `none | smartlead | resend | zapmail | google | outlook`
   (extendido em `20260422120000_extend_sender_platform_check.sql`). Adicionar novo provider exige
   DROP + ADD do constraint.
3. **`email_warmup_interactions` não tem RLS útil** — não tem `user_id`. O hook filtra via
   `sender IN (myAddresses)` em query client-side.

### Edge Functions

- **`warmup-budget`** (ACTIVE) — GET `?sender_email_id=<uuid>` retorna `{ enabled, status, allowed_today, already_sent, remaining, is_rest_day, is_at_target, paused_reason }`. Doc completa em `docs/warmup-budget-n8n.html`. N8N consulta antes de cada disparo e só manda se `remaining > 0`.

---

## Estrutura de componentes

```
components/
├── ui/              47 primitivas shadcn/ui
├── AppLayout, Sidebar, Navbar, Logo, ThemeProvider

├── dashboard/       EmailManagerTab, EmailTable, EmailDetailModal, EmailFilters,
│                    KPICards, DispatchDialog, BulkActions, CompanyGroupRow,
│                    CreateLeadDialog, ExpandableRow, Pagination

├── sender-emails/   CreateSenderEmailDialog, SenderEmailListItem, SenderEmailSelect,
│                    SenderEmailMultiSelect, SenderEmailDispatchBar, PlatformIndicator,
│                    SenderEmailDetailHeader, SenderEmailKPICards,
│                    SenderEmailDetailSkeleton, SenderEmailListSkeleton

├── campaigns/       CampaignList, CampaignListItem, CampaignTable, CampaignKPICards,
│                    CampaignFilters, RenameCampaignDialog,
│                    WarmupTab, WarmupCard, WarmupSettingsDialog   ← warm-up vive aqui hoje

├── schedules/       CreateScheduleDialog, ScheduleCardList, ScheduleTable,
│                    ScheduleDetailModal, DeleteScheduleDialog, ScheduleKPICards,
│                    ScheduleFilters, CampaignLeadPicker, DaySelector,
│                    SchedulesPageSkeleton

├── templates/       TemplateCard, TemplateFormDialog, TemplateDetailModal,
│                    TemplatePreview, TemplatePlatformBadge

├── analytics/       AnalyticsDashboard, AnalyticsKPICards, CampaignBarChart,
│                    StatusPieChart, ClassificationPieChart, ConversionFunnel,
│                    EmailsOverTimeChart, ProgressRing, TopCompaniesTable

├── import/          ImportStepper, ImportStepUpload/Review/Confirm, PreviewTable,
│                    EditableCell, ValidationWarnings, CampaignAssignBar, ImportStats

├── linkedin-table/  LinkedInTable, LinkedInDetailModal, LinkedInKPICards,
│                    LinkedInFilters, LinkedInBulkBar, LinkedInCompanyGroupRow
├── linkedin/        ConnectionStep, UploadStep, TemplateStep, CampaignSettingsStep

├── search/          SearchFormCard, SearchStatusBanner, SearchHowItWorks, SearchPageHeader
├── settings/        WebhooksSection, FeedbackAlert, SectionHeader
├── shared/          AlertModal, ConfirmDeleteDialog, ErrorMessage, PageError,
│                    PageLoading, LoadingSpinner, EmailListTable, MiniSparkline, ChatMessageList
```

---

## Hooks (`hooks/`)

- `useSenderEmails` — CRUD de caixas + setDefault + refetch
- `useSenderWarmups` — warmup config + `computeWarmupProgress(w)` + stats agregadas
  (sentToday, warmupSentToday, bounceRatePct) + auto-pause por bounce
- `useScheduleActions` — `saveSchedule` / `toggleStatus` / `deleteSchedule` com
  optimistic update + rollback no webhook (extraído da page em Apr/26)
- `useTemplates` — CRUD + resolver default por plataforma
- `useEmailSelection` — multi-select com shift-click
- `useAnalyticsData` — agregados para dashboard
- `useLinkedInMessages`, `useSettings`, `useProfile`, `useInfiniteScroll`, `useSelection`, `use-toast`

---

## Lib (`lib/`)

- `supabase.ts` / `supabase-server.ts` / `supabase-middleware.ts`
- `scheduleLogic.ts` — `resolveSelectedEmails`, `computeNextRunAt`, `isFutureRun`, `WEEKDAY_INDEX`
- `scheduleWebhook.ts` — `triggerScheduleWebhook` (payload serializado único)
- `scheduleDates.ts` — parse local date
- `resolveTemplate.ts` — escolhe template default por sender.platform
- `autoRouting.ts` — distribuição round-robin entre senders
- `warmupRecommendations.ts` — `WARMUP_LIMITS`, `classifyDailyLimit`
- `importParser.ts`, `csvParser.ts` — import
- `groupEmailsByCompany`, `groupLinkedInByCompany` — agrupamento
- `formatDate`, `sparkline`, `utils` (cn)

---

## Conceitos-chave

### Provider vs Platform (sender emails)

- **Provider** = onde o email é hospedado. `manual | google | outlook | resend | zapmail | ses | mailgun | smtp`
- **Platform** = qual rota de dispatch usa. `none | google | outlook | smartlead | resend | zapmail | auto`
- O dispatch bar e o modal de criação (`CreateSenderEmailDialog`) mostram logos dos serviços
  à esquerda de cada opção via `<PlatformIndicator platform={x} iconOnly />`.

### Leads

- "Leads" vivem em `emails` — **não há** página dedicada de leads.
- Import (CSV/Excel) é o caminho padrão para criar leads.
- Manager fica em `/dashboard` → aba Email Manager.

### Dispatch flow

1. Usuário seleciona leads + remetente(s) no dashboard/campaign detail
2. `DispatchDialog` (bulk) ou `SenderEmailDispatchBar` (single sender) monta o payload
3. POST para `NEXT_PUBLIC_WEBHOOK_N8N` (ou `settings.webhook_url` do usuário)
4. Payload tem **dispatches[]** com `{ sender_email, platform, emails[] }` + campos legacy flat
5. Optimistic update em `emails.sender_email_id` e `dispatch_platform`

### Warmup flow

1. Usuário ativa warmup por sender em `/campaigns` (aba Warmup) — config em `sender_warmups`
2. N8N, antes de cada envio de warmup, chama edge function `warmup-budget`
3. Se `remaining > 0`, N8N dispara e grava em `email_warmup_interactions` (`interaction_type='sent'`)
4. `useSenderWarmups` auto-pausa se `bounceRatePct > bounce_threshold_pct` (min 10 envios na janela)
5. `topped_out_at` é marcado quando rampa chega ao daily_limit (toast "cruise")

---

## Padrões

### Data fetching

```ts
const { data, error } = await supabase
  .from("emails").select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

### Modais de criação/edição

- Dialog shadcn/ui + `useState` local ou RHF+Zod quando complexo
- Referências: `CreateScheduleDialog.tsx` (useState), `EmailDetailModal.tsx` (RHF+Zod),
  `CreateSenderEmailDialog.tsx` (2-col grid)
- Sempre reset no close + toast em sucesso/erro

### Delete confirmation

Use `ConfirmDeleteDialog` de `components/shared/` em vez de `AlertModal` inline.

### Refactor pattern (recém-aplicado em sender-emails e schedules)

Quando uma page passa de ~300 linhas, extrair:

1. **Lógica pura** → `lib/<feature>Logic.ts` (computações, reducers, resolvers)
2. **I/O async** → `lib/<feature>Webhook.ts` ou similar
3. **Mutations com estado** → `hooks/use<Feature>Actions.ts` (optimistic update + rollback)
4. **Skeletons grandes** → componente próprio (`<Feature>PageSkeleton.tsx`)
5. **Header/KPIs/filters** → componentes memoizados (`React.memo` + config em module-level)
6. **Single-pass filter** com `useMemo` — evitar `.filter().filter().filter()` encadeados

Exemplos: `useScheduleActions`, `SenderEmailKPICards` (com `computeEmailStats`).

### Performance

- `React.memo` em componentes grandes que recebem props estáveis
- `useMemo` para agregações derivadas de arrays
- Config de KPIs/colunas em module-level, **nunca** recriar no render
- Comparações de data em `.getTime()` (number), não `Date < Date`
- Pré-agrupar (`Map<key, T[]>`) antes de loops N×M (ex: `resolveSelectedEmails`)

---

## Comandos

```bash
npm run dev         # :3000
npm run build       # produção
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

Sempre rodar `npm run typecheck` depois de mexer em TypeScript. Sem testes automatizados no repo.

---

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_WEBHOOK_N8N                     (fallback se user não tiver webhook_url em settings)
UNIPILE_API_KEY, UNIPILE_DSN, UNIPILE_WEBHOOK_SECRET   (LinkedIn)
```

---

## Docs vivas (`docs/`)

- `N8N_SENDER_EMAILS_INTEGRATION.md/.pdf` — contrato do payload de dispatch via webhook
- `warmup-budget-n8n.html/.pdf` — contrato da edge function `warmup-budget`

Quando mudar payload, **atualizar a doc no mesmo PR**.

---

## Notas importantes

- App é **single-tenant por usuário** (RLS). Cada registro tem `user_id`, tudo filtrado por `auth.uid()`.
- **MCP Supabase disponível**: use `mcp__supabase__execute_sql` pra conferir schema vivo antes
  de assumir que migration no repo == produção (há drift).
- **MCP Supabase também permite DDL** via `apply_migration` — depois de aplicar, **sempre** criar
  o arquivo `.sql` correspondente em `supabase/migrations/` pra não aumentar o drift.
- **Não tenho acesso ao N8N** — entregas que precisam de workflow vão como spec (MD ou PDF em `docs/`).
