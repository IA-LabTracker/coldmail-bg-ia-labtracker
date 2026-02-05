# 📧 Cold Email Pro - B2B Email & LinkedIn Automation Platform

Uma plataforma moderna e completa para automação de cold emails B2B e campanhas do LinkedIn, construída com Next.js, Supabase e integração com N8N.

![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🚀 Features

### 📊 **Dashboard Completo**

- **KPIs em tempo real**: Total enviado, respostas recebidas, hot leads, bounced
- **Filtros avançados**: Por status, classificação de lead, campanha e busca
- **Tabela interativa** com seleção múltipla e ações em lote
- **Paginação** e ordenação dinâmica

### 📧 **Gestão de Emails**

- **Campanhas organizadas** por empresa, região e indústria
- **Tracking completo**: Status de entrega, respostas, tempo de resposta
- **Classificação de leads**: Hot, Warm, Cold
- **Informações detalhadas**: Nome, telefone, endereço, Google Maps

### 🤖 **Automação Inteligente**

- **Integração N8N**: Webhooks para automação de workflows
- **Ações em lote**: Envio de emails iniciais para múltiplos leads
- **LinkedIn automation**: Ferramentas para campanhas sociais
- **Templates personalizáveis**: Sistema de modelos de email

### 🔐 **Sistema de Autenticação**

- **Supabase Auth**: Login seguro com email/senha
- **OAuth integrado**: Google, GitHub (configurável)
- **Row Level Security**: Dados isolados por usuário
- **Gerenciamento de sessão** automático

### 🎨 **Interface Moderna**

- **Design responsivo**: Funciona em desktop, tablet e mobile
- **shadcn/ui components**: Interface consistente e acessível
- **Dark mode ready**: Preparado para tema escuro
- **Loading states**: Estados de carregamento e erro elegantes

## 🛠️ Stack Tecnológica

### **Frontend**

- **Next.js 14+** - React framework com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Componentes reutilizáveis e acessíveis
- **Lucide React** - Ícones SVG otimizados

### **Backend & Database**

- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security** - Segurança nível de linha
- **Real-time subscriptions** - Updates em tempo real

### **Integrações**

- **N8N Webhooks** - Automação de workflows
- **Unipile API** - Integrações sociais
- **Axios** - Cliente HTTP

## 📋 Pré-requisitos

- **Node.js 18+**
- **npm 10+** ou **yarn 1.22+**
- **Conta Supabase** (gratuita)
- **Conta N8N** (opcional, para automação)

## ⚡ Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/IA-LabTracker/coldmail-bg-ia-labtracker.git
cd coldmail-bg-ia-labtracker
```

2. **Instale as dependências**

```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env.local
```

4. **Configure seu Supabase**
   - Acesse [app.supabase.com](https://app.supabase.com/)
   - Crie um novo projeto
   - Vá em **Settings > API** e copie suas chaves

5. **Execute as migrações**
   - No dashboard do Supabase, vá em **SQL Editor**
   - Execute o conteúdo de `supabase/migrations/20260204162558_001_create_emails_and_settings_tables.sql`

6. **Inicie o projeto**

```bash
npm run dev
# ou
yarn dev
```

7. **Acesse** http://localhost:3000

## ⚙️ Configuração

### **Variáveis de Ambiente (.env.local)**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# N8N Webhook (opcional)
NEXT_PUBLIC_WEBHOOK_N8N=sua_webhook_url

# Unipile API (opcional)
UNIPILE_API_KEY=sua_unipile_key
UNIPILE_DSN=sua_unipile_dsn
```

### **Estrutura do Banco de Dados**

O projeto criará automaticamente duas tabelas principais:

- **`emails`**: Armazena dados de campanhas e leads
- **`settings`**: Configurações do usuário e webhooks

## 📱 Como Usar

### **1. Primeiro Acesso**

1. Acesse `/signup` para criar uma conta
2. Confirme seu email (se habilitado)
3. Faça login em `/login`

### **2. Dashboard**

- Visualize KPIs de suas campanhas
- Filtre emails por status, classificação ou campanha
- Use a busca para encontrar leads específicos

### **3. Gerenciar Emails**

- Selecione emails usando os checkboxes
- Use **"Send Initial Email"** para disparar automação
- Configure webhooks em **Settings**

### **4. LinkedIn Automation**

- Acesse `/linkedin` para campanhas sociais
- Configure templates e sequências
- Conecte sua conta LinkedIn

### **5. Configurações**

- Acesse `/settings` para:
  - Configurar webhooks N8N
  - Definir templates de email
  - Conectar contas sociais

## 📁 Estrutura do Projeto

```
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard page
│   ├── linkedin/          # LinkedIn automation
│   ├── login/            # Authentication pages
│   ├── signup/
│   ├── settings/         # User settings
│   └── search/           # Search functionality
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific
│   ├── linkedin/         # LinkedIn-specific
│   ├── shared/           # Reusable components
│   └── ui/              # shadcn/ui components
├── contexts/             # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utilities
├── supabase/           # Database migrations
└── types/              # TypeScript types
```

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm run start

# Linting
npm run lint

# Type checking
npm run typecheck
```

## 🚀 Deploy

### **Vercel (Recomendado)**

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático em cada push

### **Outras Plataformas**

- **Netlify**: Funciona com configuração de build
- **Railway**: Suporte nativo ao Next.js
- **Docker**: Dockerfile incluído (futuro)

## 🤝 Contribuindo

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

## 📝 Roadmap

- [ ] **Multi-tenant support** - Suporte a equipes
- [ ] **Email templates** - Editor visual
- [ ] **A/B testing** - Teste de campanhas
- [ ] **Analytics avançado** - Métricas detalhadas
- [ ] **API REST** - Integração externa
- [ ] **Mobile app** - React Native
- [ ] **AI insights** - Sugestões inteligentes

## 🐛 Problemas Conhecidos

- **Corepack warning**: Pode aparecer warning no Vercel (não afeta funcionamento)
- **Migration manual**: Migrations devem ser executadas manualmente no Supabase

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **[Supabase](https://supabase.com/)** - Backend incrível
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes elegantes
- **[Lucide](https://lucide.dev/)** - Ícones lindos
- **[Vercel](https://vercel.com/)** - Deploy fantástico

---

<p align="center">
  Feito com ❤️ por <strong>IA-LabTracker</strong>
</p>

<p align="center">
  <a href="#top">⬆️ Voltar ao topo</a>
</p>
