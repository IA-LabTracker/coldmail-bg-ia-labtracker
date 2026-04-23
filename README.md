# 📧 Cold Email Pro

Plataforma B2B de **cold email + outreach LinkedIn** construída sobre Next.js e Supabase.
Importa leads de CSV/Excel, gerencia campanhas, orquestra disparos por múltiplos remetentes
e plataformas (SmartLead, Gmail, Outlook, Resend, Zapmail, SES, Mailgun, SMTP), controla
ritmo de aquecimento (warm-up) e integra com N8N para automação.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🚀 Funcionalidades

### 📥 Importação de leads
- Wizard de upload CSV/Excel com preview, validação por linha e confirmação
- Deduplicação e normalização de campos (empresa, email, telefone, cidade/UF, etc.)

### 📊 Dashboard
- KPIs em tempo real: enviados, respostas, hot leads, bounces
- Filtros por status, classificação, campanha e keywords
- Agrupamento por empresa, seleção múltipla (com shift-click) e ações em lote
- Infinite scroll em listas grandes

### 📨 Campanhas e disparos
- Organização de leads por campanha com KPIs por campanha
- Seleção de remetentes por plataforma/domínio no modal de disparo
- Distribuição round-robin de leads entre remetentes habilitados
- Agendamento pontual/recorrente via `schedules` + webhook N8N

### ✉️ Sender emails
- Cadastro de caixas de envio com provider (**Gmail, Outlook**, Resend, Zapmail, SES,
  Mailgun, Manual/SMTP, Custom SMTP) e plataforma de dispatch
- Sync de remetentes Zapmail
- Limite diário por caixa, status (pending/active/error/suspended), default sender

### 🌡️ Warm-up
- Rampa por caixa: volume inicial, incremento diário, meta, dias úteis
- Pausa automática por bounce rate acima do limite
- Edge function `warmup-budget` consultada pelo N8N antes de cada disparo
  (ver [docs/warmup-budget-n8n.html](docs/warmup-budget-n8n.html))

### 💼 LinkedIn outreach
- Integração Unipile (OAuth LinkedIn)
- Tabela de mensagens com status, qualidade de lead e histórico completo de perfil
- Agrupamento por empresa

### 📄 Templates
- Templates de email por plataforma (Gmail, Outlook, SmartLead, Resend, Zapmail, LinkedIn)
- Variáveis (`{{lead_name}}`, `{{company}}`, …), preview HTML e template default por escopo

### 🔐 Auth & segurança
- Supabase Auth (email/senha)
- Row Level Security em todas as tabelas (`auth.uid() = user_id`)

---

## 🛠️ Stack

**Frontend**: Next.js 14 (App Router), TypeScript 5.6, Tailwind CSS, shadcn/ui (Radix),
Framer Motion, Lucide, Sonner (toasts), Recharts (analytics), React Hook Form + Zod.

**Backend**: Supabase (PostgreSQL + Auth + Edge Functions + RLS).

**Integrações**: N8N (webhooks), Unipile (LinkedIn), Axios.

**Import**: `xlsx` para Excel, parser próprio para CSV.

---

## 📋 Pré-requisitos

- Node.js 18+
- npm 10+ (o `packageManager` do projeto é `npm@10.9.2`)
- Projeto Supabase
- N8N (opcional — necessário para disparo automatizado e warm-up)
- Conta Unipile (opcional — necessário para LinkedIn)

---

## ⚡ Instalação

```bash
git clone https://github.com/IA-LabTracker/coldmail-bg-ia-labtracker.git
cd coldmail-bg-ia-labtracker
npm install
cp .env.example .env.local
```

Configure o Supabase:

1. Crie um projeto em [app.supabase.com](https://app.supabase.com/)
2. Copie as chaves em **Settings → API** para o `.env.local`
3. Rode **todas** as migrations em ordem (ver seção abaixo)

Suba a aplicação:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Variáveis de ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# N8N (opcional — disparo via webhook)
NEXT_PUBLIC_WEBHOOK_N8N=

# Unipile (opcional — LinkedIn via Unipile)
UNIPILE_API_KEY=
UNIPILE_DSN=
UNIPILE_WEBHOOK_SECRET=
```

---

## 🗄️ Banco de dados

Migrations em [supabase/migrations/](supabase/migrations/), aplicadas em ordem cronológica
pelo nome do arquivo. Execute pelo **SQL Editor** do Supabase (ou via CLI).

Tabelas principais:

| Tabela                        | Função                                                               |
| ----------------------------- | -------------------------------------------------------------------- |
| `emails`                      | Leads / contatos (entidade central)                                  |
| `settings`                    | Config por usuário: webhooks, template base, conta LinkedIn padrão   |
| `sender_emails`               | Caixas de envio (provider, dispatch platform, daily limit, status)   |
| `sender_warmups`              | Estado de aquecimento por caixa (rampa, dias úteis, auto-pausa)      |
| `email_warmup_interactions`   | Log de envios de warm-up (consumido pela edge function)              |
| `email_templates`             | Templates reutilizáveis com escopo de plataforma                     |
| `schedules`                   | Agendamentos pontuais/recorrentes de disparo                         |
| `linkedin_accounts`           | Contas LinkedIn conectadas via Unipile                               |
| `linkedin_messages`           | Mensagens LinkedIn enviadas + dados de perfil e qualidade do lead    |

Todas aplicam RLS com `auth.uid() = user_id`.

Edge functions:

- `warmup-budget` — retorna `remaining` diário de warm-up para um `sender_email_id`.
  Contrato documentado em [docs/warmup-budget-n8n.html](docs/warmup-budget-n8n.html).

---

## 📁 Estrutura

```
app/
├── dashboard/         Analytics + Email Manager (tabs)
├── campaigns/         Overview de campanhas com KPIs
├── import/            Wizard de import CSV/Excel
├── schedules/         Criação e gestão de agendamentos
├── sender-emails/     Cadastro e sync de caixas de envio
├── templates/         Templates de email
├── linkedin-table/    Tabela de mensagens LinkedIn
├── search/            Busca de leads via webhook
├── settings/          Webhooks, LinkedIn, template base
├── profile/           Perfil do usuário
├── login/  signup/    Auth
├── pricing/  terms/   Páginas estáticas
└── api/
    ├── linkedin-accounts/
    ├── unipile-auth/
    ├── unipile-callback/
    └── schedules/trigger/

components/
├── ui/                47 primitivas shadcn/ui
├── dashboard/         EmailManagerTab, EmailTable, DispatchDialog, KPICards, …
├── campaigns/         CampaignList, CampaignTable, CampaignKPICards
├── sender-emails/     CreateSenderEmailDialog, SenderEmailSelect, DispatchBar, …
├── templates/         TemplateFormDialog, TemplateCard, TemplatePreview
├── schedules/         CreateScheduleDialog, ScheduleCardList, …
├── linkedin-table/    LinkedInTable, LinkedInDetailModal, …
├── linkedin/          ConnectionStep, UploadStep, CampaignSettingsStep
├── import/            ImportStepper, ImportStepUpload/Review/Confirm, PreviewTable
├── analytics/         AnalyticsDashboard
├── settings/          WebhooksSection, EmailTemplateSection
├── search/            SearchFormCard, SearchStatusBanner
└── shared/            PageLoading, PageError, AlertModal, …

hooks/                 useAuth, useSettings, useSenderEmails, useTemplates, …
lib/                   supabase client, import parser, grouping, formatação
supabase/migrations/   Migrations SQL ordenadas
docs/                  Especificações de integração (N8N)
types/index.ts         Tipos compartilhados
```

---

## 🎯 Scripts

```bash
npm run dev         # dev server em :3000
npm run build       # build de produção
npm run start       # serve o build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

---

## 🚀 Deploy

Recomendado **Vercel**: conecte o repositório, configure as variáveis de ambiente e
faça deploy. O build padrão do Next.js 14 com App Router funciona sem customização.

Qualquer provider que rode Next 14 serve (Railway, Fly, Render, Netlify etc.).

---

## 🔌 Integração com N8N

O disparo por N8N é feito via webhook (`NEXT_PUBLIC_WEBHOOK_N8N`). A app publica
payloads no formato documentado em [docs/N8N_SENDER_EMAILS_INTEGRATION.md](docs/N8N_SENDER_EMAILS_INTEGRATION.md),
contendo `dispatches[]` com cada grupo `{ sender_email, platform, emails[] }`.

Antes de cada envio o workflow N8N deve consultar a edge function
`warmup-budget` e só prosseguir se `remaining > 0`. Ver
[docs/warmup-budget-n8n.html](docs/warmup-budget-n8n.html) para o contrato completo.

---

## 🤝 Contribuindo

1. Fork + branch (`git checkout -b feat/minha-feature`)
2. Commits pequenos e descritivos
3. `npm run lint && npm run typecheck` antes de abrir PR
4. PR com descrição do **porquê**, não só do **o quê**

---

## 📄 Licença

MIT — ver [LICENSE](LICENSE).

---

<p align="center">
  Feito com ❤️ por <strong>IA-LabTracker</strong>
</p>
