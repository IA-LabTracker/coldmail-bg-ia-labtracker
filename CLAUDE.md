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
3. **`email_warmup_interactions` RLS** — não tem `user_id`. As policies (a partir de
   `20260501120000_security_rls_lockdown.sql`) escopam via `sender IN (sender_emails do user)`
   no SELECT e via `sender IN (...)` no INSERT. N8N continua escrevendo via service role.

### Hardening (2026-05-01) — leia antes de mexer no banco

- **Toda tabela usa RLS** com policies do tipo `user_id = (SELECT auth.uid())` — o `(SELECT ...)`
  é **obrigatório** para o planner cachear o uid uma vez por query (sem isso, ele re-avalia por
  linha; advisor `auth_rls_initplan`).
- **Nunca recriar** policies `Allow all *` ou `USING (true)` — havia em `emails` e `settings`,
  e qualquer usuário autenticado lia/modificava dados de TODOS os outros tenants.
- **Toda função plpgsql** tem `SET search_path = ''`. Ao criar nova função, qualifique TODAS as
  refs com `public.` ou `pg_catalog.` no corpo, senão quebra em runtime.
- **Funções SECURITY DEFINER** (`handle_new_user`, `handle_new_user_subscription`) tiveram
  `EXECUTE` revogado de `anon, authenticated, PUBLIC` — disparam apenas por trigger.
- **Índices**: hot queries usam composite `(user_id, X)` (porque RLS força `user_id` first).
  Antes de adicionar single-column `(X)`, pergunte se `(user_id, X)` não cobre.

### Edge Functions

- **`warmup-budget`** (ACTIVE) — GET `?sender_email_id=<uuid>` retorna `{ enabled, status, allowed_today, already_sent, remaining, is_rest_day, is_at_target, paused_reason }`. Doc completa em `docs/warmup-budget-n8n.html`. N8N consulta antes de cada disparo e só manda se `remaining > 0`.

---

## N8N — acesso e workflows

**Instância:** `https://n8n.coisasdecapitu.com.br` (self-hosted). API key em `.env` (`N8N_API_KEY`).

**Acesso via MCP:** tools `mcp__n8n-mcp__*` já configuradas em `.mcp.json` (gitignored). Inclui `n8n_list_workflows`, `n8n_get_workflow`, `n8n_update_partial_workflow`, `n8n_create_workflow`, `n8n_executions`, `n8n_validate_workflow`, `search_nodes`, `get_node`, etc. Antes de chamar, carregar schema via `ToolSearch` com `select:mcp__n8n-mcp__<nome>`.

**Inventário completo dos workflows do Cold Email Pro:** [docs/n8n-workflows.md](docs/n8n-workflows.md) — mapeia os 13 workflows ativos por categoria (dispatch, reply events, warmup, follow-ups, LinkedIn), com IDs, triggers, topologia resumida e gaps conhecidos. **Consultar sempre antes de propor mudança no N8N.**

**Workflows-chave (decoreba):**
- `GIFZ8zzIWiXGdral` — `[email] pt 1 Split emails para envio` → entry do `NEXT_PUBLIC_WEBHOOK_N8N`
- `jhzBrpA2g5mYOMon` — `[email] Send Email pt2` → envio real (49 nodes, o maior)
- `NkZO6yq9LeKVBnbs` — `[Email]Webhook eventos e recebimento` → ingestão de eventos (reply/bounce/opened)
- `GaDxY8f5dQnP0LG4` + `bTuTALx2EDDqBrxK` — warmup send + warmup reply auto
- `G1G1DkHf7GrU79us` — `[Tigger] - zera limite` (reset diário)

**Regra:** ao alterar workflow no n8n, **atualizar `docs/n8n-workflows.md` no mesmo PR**.

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
- `importParser.ts` — XLSX/CSV parser com size+row caps, formula-injection defang, email RFC check
- `csvParser.ts` — fallback CSV puro
- `validateWebhookUrl.ts` — guard de SSRF para URLs vindas do user (server-side)
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
- **Single-pass filter** com short-circuit por flag (ver `EmailManagerTab.filteredEmails`)
  em vez de `.filter().filter()...` em sequência
- **Single-pass aggregate** quando precisa de N agregações da mesma lista — popular N buckets
  num for loop só, depois derivar contagens e sparklines deles (ver `KPICards`)
- **Lazy-load tabs/charts pesados** com `next/dynamic` + `ssr: false` (ver `app/dashboard/page.tsx`
  importando `AnalyticsDashboard` e `EmailManagerTab` dinamicamente)
- **Recharts pesa muito**: qualquer page nova com gráficos deve carregar via dynamic import.

---

## Segurança (modelo + regras de ouro)

> **2026-05-01:** lockdown completo aplicado em DB + código. Ler antes de tocar em qualquer
> rota de API, query, ou input vindo do usuário.

### Princípios

1. **RLS é a primeira linha de defesa** — toda tabela tem policies escopadas por `user_id`.
   Nunca usar `service role key` no client. No server, só usar onde é INDISPENSÁVEL (webhooks
   sem sessão), e sempre filtrando manualmente por `user_id` extraído do JWT verificado.
2. **Tudo que vem do usuário é hostil** — emails, URLs, HTML de templates, CSV/XLSX, querystring.
3. **CSP + headers ativos** em `next.config.js`: `frame-ancestors 'none'`, `object-src 'none'`,
   `base-uri 'self'`, `form-action 'self'`, HSTS preload, X-Frame DENY, X-Content nosniff.
   `connect-src` é permissivo (`https:`/`wss:`) porque users configuram webhooks próprios.
4. **CSRF**: rotas server confiam em cookies SameSite=Lax do Supabase + verificação explícita
   de `auth.getUser()`. Rotas com `Authorization: Bearer` exigem token explícito do client.

### Componentes de segurança

| Risco | Onde mora a defesa |
|---|---|
| **SSRF** em webhook URL do user | `lib/validateWebhookUrl.ts` — bloqueia private/loopback/link-local + portas estranhas. Usado em `app/api/schedules/trigger/route.ts`. **Rotas novas que façam fetch para URL do user DEVEM usar este helper.** |
| **SSRF preventivo no client** | `hooks/useSettings.ts` — Zod refine bloqueia o user de salvar URL com host privado (defense in depth, server valida de novo). |
| **Open redirect** na landing | `app/page.tsx#safeLandingPath` — whitelist de paths internos. |
| **XSS em template HTML** | `components/templates/TemplatePreview.tsx` renderiza dentro de `<iframe sandbox="" srcDoc=...>`. **Nunca** voltar para `dangerouslySetInnerHTML`. |
| **CSP** | `next.config.js#securityHeaders` aplica em todas as rotas. |
| **Webhook timing attack** | `app/api/unipile-callback/route.ts#safeCompare` usa `crypto.timingSafeEqual`. Secret é OBRIGATÓRIO (era opcional). |
| **Open redirect Unipile** | `app/api/unipile-auth/route.ts#isAllowedRedirectUrl` valida só contra `NEXT_PUBLIC_APP_URL` (nunca contra Host header). |
| **Formula injection (CSV)** | `lib/importParser.ts#defangFormula` prefixa `'` em células que começam com `= + - @ \t \r`. |
| **Email-header injection** | `lib/importParser.ts#sanitizeEmail` strip CR/LF/TAB e valida regex RFC-básica. |
| **Decompression bomb / DOS no import** | `parseImportFile` enforce `MAX_FILE_BYTES=50MB` + `MAX_ROWS=100_000` via `XLSX.read({ sheetRows })`. |

### Ao criar uma rota nova em `app/api/`

1. Comece com `const supabase = createSupabaseServer(); const { data: { user } } = await supabase.auth.getUser();` e retorne 401 se faltar user.
2. Se for fetch para URL do user: passe pelo `validateWebhookUrl()` antes do `fetch()`. Inclua
   `signal: AbortSignal.timeout(15_000)` e `redirect: "error"`.
3. Se usar `SUPABASE_SERVICE_ROLE_KEY`: filtre todo `.from(...)` por `user_id = user.id`.
   RLS é bypass com service role — você é o único guard.
4. Erro 5xx: log detalhe no servidor, **não devolva** o detalhe para o client em produção
   (`process.env.NODE_ENV === "production" ? "Internal error" : err.message`).
5. Webhooks de terceiros (Unipile, Zapmail) verificam segredo com `timingSafeEqual` e
   **falham fechado** se o segredo não estiver configurado no env.

### Variáveis de ambiente sensíveis

- **NUNCA** logar `SUPABASE_SERVICE_ROLE_KEY`, `UNIPILE_API_KEY`, `ZAPMAIL_API_KEY`, `N8N_API_KEY`,
  `UNIPILE_WEBHOOK_SECRET`. `.env` é gitignored — confirmar com `git ls-files .env` antes de
  commitar qualquer mudança em config.
- `UNIPILE_WEBHOOK_SECRET` é **obrigatório** em prod — sem ele a rota retorna 500 e nada é
  processado. Configure no painel da Unipile + no env do deploy.
- Para habilitar **Leaked Password Protection** (último warning do advisor) ative em
  Authentication → Security no painel do Supabase.

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
