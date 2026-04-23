# N8N — Workflows do Cold Email Pro

Mapa vivo dos workflows que o Cold Email Pro usa. Todos em `https://n8n.coisasdecapitu.com.br`.

> **Acesso via MCP:** tools `mcp__n8n-mcp__*` disponíveis (list_workflows, get_workflow, update_full_workflow, update_partial_workflow, create_workflow, executions, etc). Credencial em `.env` (`N8N_API_KEY`). O servidor tem **44 workflows no total** — os listados aqui são o subset do Cold Email Pro.

> **Convenção:** a UI do n8n chama isso de "pasta berlims". A API v1 **não expõe folder** diretamente (feature enterprise). Identificar pelo prefixo `[email]`, `[emails]`, `[Linkedin]`, `Aquecimento`, `[SmartLead]`, `[Tigger]`.

---

## Dispatch (envio de campanhas)

### `GIFZ8zzIWiXGdral` — `[email] pt 1 Split emails para envio` · ACTIVE · 19 nodes
**Trigger:** `Webhook` — é o endpoint que o frontend chama via `NEXT_PUBLIC_WEBHOOK_N8N`.

**Flow:** `Webhook` → `Flatten Emails` (Code) → `Switch Platform` (3 branches: smartlead/resend/zapmail) → `If` + `Wait` (delay opcional por agendamento) → `Call envia email pt 2 com delay` (executeWorkflow → `jhzBrpA2g5mYOMon`).

**Responsabilidade:** entrypoint. Recebe `dispatches[]` do front, faz flatten dos emails, roteia por plataforma, invoca o pt2 por item.

---

### `jhzBrpA2g5mYOMon` — `[email] Send Email pt2` · ACTIVE · 49 nodes ⚠️ o maior
**Trigger:** `executeWorkflowTrigger` (chamado pelo pt1).

**Flow principal:**
- `Switch1` (3 platforms) → busca `SENDER_NAME` no Postgres → `Wait` → `randomiza email` (Code) → `Switch` (tipo de email — inicial/followup/etc) → `Edit Fields` 3-5 (subject+body conforme tipo) → `If` → `HTTP Request1` (envio real via API) → `Update a row` (Supabase — grava status)
- Branch alternativa: `Zapmail - Enviar Email` (HTTP) → `Update a row1`
- **Fluxo isolado "1-7":** cria campanha no SmartLead de forma sequencial (Criar Campanha → Schedule → Salvar ID → Adicionar Contas → Criar Sequência → Adicionar Lead → Ativar). Parece ser usado para campanhas managed pelo SmartLead.

**Responsabilidade:** o envio real. Três modos: HTTP direto (Resend/Mailgun/etc), Zapmail, ou criar campanha no SmartLead.

---

## Reply / eventos de email

### `NkZO6yq9LeKVBnbs` — `[Email]Webhook eventos e recebimento` · ACTIVE · 14 nodes ⭐
**Trigger:** `Webhook` — provavelmente assinado por SmartLead/Resend webhook events.

**Flow:** `Webhook` → `Switch` (4 branches: Resposta, Bounced, Aberto, Entregue) → `Set` (monta payload) → `Supabase` (update `emails` row).

**Responsabilidade:** ingestão de eventos de email. Atualiza o status dos leads conforme evento chega.

> **Checar:** quais colunas da `emails` este workflow escreve para "Resposta"? Pela pergunta anterior sobre replies não aparecerem na UI, suspeita: pode estar escrevendo só `status='replied'` mas **não** o `response_content` / `reply_we_got`. Precisa abrir os nodes `Reposta` + `Reposta_staus` pra confirmar.

---

## Warmup

### `GaDxY8f5dQnP0LG4` — `Aquecimento de emails(envio)` · ACTIVE · 14 nodes
**Trigger:** `Schedule Trigger` (cron).

**Flow:** `Schedule` → `Get many rows` (Supabase — busca senders com warmup enabled) → `randomizador` (Code) → `AI Agent` (LangChain + OpenAI — gera texto natural) → `normaliza_dados` (Code) → `Loop Over Items` → `If` → `HTTP Request1` (envia) **OU** `Create a draft` (Gmail node) → `Create a row` (Supabase — loga em `email_warmup_interactions`) → `Wait` → loop.

**Responsabilidade:** envio de warmup em ciclo com conteúdo gerado por IA.

> ⚠️ **Gap:** este workflow **não chama a edge function `warmup-budget`** antes de cada envio. Hoje o orçamento diário (`sender_warmups.daily_limit`, `business_days_only`, `topped_out_at`, `auto_paused_at`) não é respeitado — o front configura, mas o N8N ignora. Corrigir adicionando HTTP Request pra `https://kxgwviiewmnmignqmptu.supabase.co/functions/v1/warmup-budget?sender_email_id=<id>` e um `If remaining > 0` antes de cada envio. Spec completa em `docs/warmup-budget-n8n.html`.

---

### `bTuTALx2EDDqBrxK` — `Aquecimento de email(recebimento)` · ACTIVE · 14 nodes
**Trigger:** `Webhook` (recebe notificação de email chegando num dos nossos senders).

**Flow:** `Webhook` → `buscar_sender_email` (Postgres) → `If1` → `Wait` → `AI Agent` (OpenAI gera resposta natural) → `normaliza_dados` → `enviar_reply` (HTTP) → `Update a row` (Supabase — loga interaction).

**Responsabilidade:** quando outro sender da "rede de warmup" manda email pro nosso sender, respondemos automaticamente pra parecer tráfego orgânico.

---

## Follow-ups e triggers agendados

### `0x9tjMCXLxba1LqZ` — `[emails] Follow ups` · ACTIVE · 20 nodes
**Trigger:** `Schedule Trigger`.

**Flow:** `Schedule` → `get_emails` (Postgres) → `If` (precisa enviar follow-up?) → `mensagens_email` (Code gera texto) → `Loop` → `email_name` (Code) → `Execute a SQL query` (Postgres) → `If1` → `Send Email Resend` (HTTP) → `followup` (Code) → `Update_table_client_step` (Supabase — atualiza `emails.client_step`).

**Responsabilidade:** dispara follow-ups recorrentes, avança `client_step` na tabela `emails` conforme estágio.

---

### `G1G1DkHf7GrU79us` — `[Tigger] - zera limite` · ACTIVE · 4 nodes
**Trigger:** `Schedule Trigger` (diário).

**Flow:** `Schedule` → `Update a row` (Supabase — provavelmente zera `sender_emails.today_usage`) → `Update a row1` (outro update em cascata).

**Responsabilidade:** reset diário dos contadores de uso por sender. Roda à noite/madrugada.

---

## LinkedIn (via Unipile)

### `estBS0PmeL1hFpDe` — `[Linkedin] envio de mensagem` · ACTIVE · 17 nodes
Envio de mensagens LinkedIn via Unipile API.

### `8FaGelWVDKyoAS7r` — `[linkedin] Recebe eventos mensagens` · ACTIVE · 11 nodes
Webhook que recebe eventos (mensagens recebidas, status de entrega) do Unipile.

### `UBXSpTG6kyijdzaw` — `[descarteLinkedin - Conexão - Uniple` · ACTIVE · 4 nodes
### `6hgCvqOmiAoFjQG7` — `[descarte]Uniple-conexão` · ACTIVE · 3 nodes
> O prefixo `[descarte]` sugere workflows antigos/obsoletos que ainda estão ativos. Investigar se podem ser desativados.

---

## Outros (possivelmente relacionados)

### `nNEGPw9Eb4suATn3` — `[email] Pesquisa V1` · ACTIVE · 42 nodes
Webhook de pesquisa de leads — provavelmente o endpoint usado em `/search`.

### `8CamkGMPY06aiLQ7` — `[SmartLead] - Atualiza-base` · ACTIVE · 7 nodes
Sync com SmartLead (talvez importa resultados de campanhas geridas lá pra dentro da nossa base).

### `tswxfXRyxIjzdARP` — `[Berlims_group] Criacao de campanha BREVO` · INACTIVE · 3 nodes
O único que explicitamente tem "Berlims" no nome. Parece ser integração antiga com BREVO, hoje desligada.

---

## Inventário rápido (todos os ativos)

| ID | Nome | Nodes | Papel |
|---|---|---:|---|
| `GIFZ8zzIWiXGdral` | [email] pt 1 Split emails | 19 | Entry webhook de dispatch |
| `jhzBrpA2g5mYOMon` | [email] Send Email pt2 | 49 | Envio real |
| `NkZO6yq9LeKVBnbs` | [Email]Webhook eventos e recebimento | 14 | Eventos SmartLead/Resend |
| `0x9tjMCXLxba1LqZ` | [emails] Follow ups | 20 | Follow-ups agendados |
| `GaDxY8f5dQnP0LG4` | Aquecimento de emails(envio) | 14 | Warmup send |
| `bTuTALx2EDDqBrxK` | Aquecimento de email(recebimento) | 14 | Warmup reply auto |
| `G1G1DkHf7GrU79us` | [Tigger] - zera limite | 4 | Reset diário de contadores |
| `estBS0PmeL1hFpDe` | [Linkedin] envio de mensagem | 17 | LinkedIn send |
| `8FaGelWVDKyoAS7r` | [linkedin] Recebe eventos mensagens | 11 | LinkedIn events |
| `nNEGPw9Eb4suATn3` | [email] Pesquisa V1 | 42 | `/search` backend |
| `8CamkGMPY06aiLQ7` | [SmartLead] - Atualiza-base | 7 | Sync SmartLead |
| `UBXSpTG6kyijdzaw` | [descarteLinkedin - Conexão - Uniple | 4 | Unipile OAuth (legado?) |
| `6hgCvqOmiAoFjQG7` | [descarte]Uniple-conexão | 3 | Unipile OAuth (legado?) |

---

## Gaps conhecidos / ações pendentes

1. **Warmup não respeita orçamento.** `GaDxY8f5dQnP0LG4` deveria consultar `warmup-budget` edge function antes de cada envio (ver `docs/warmup-budget-n8n.html`). Hoje não consulta — o front configura mas o N8N ignora.

2. **Reply ingestion incompleta.** `NkZO6yq9LeKVBnbs` recebe evento de "Resposta" e atualiza Supabase, mas os campos `response_content` / `reply_we_got` / `reply_time` estão **0% populados** nos 1203 leads. Suspeita: o node só atualiza `status='replied'` sem salvar o corpo da resposta. Precisa abrir o node `Reposta` / `Reposta_staus` pra confirmar e corrigir.

3. **Schema drift.** `sender_emails` tem colunas (`platform`, `daily_limit`, `today_usage`) que o N8N escreve mas **não estão em migration nenhuma no repo**. Foram criadas via dashboard Supabase. O `[Tigger] - zera limite` depende de `today_usage`.

4. **Descartes ativos.** `[descarte]Uniple-conexão` e `[descarteLinkedin - Conexão - Uniple` estão ACTIVE mesmo com prefixo `[descarte]`. Confirmar se podem ser desativados.

---

## Como descobrir/editar workflows a partir daqui

```
# Via MCP tools (dentro do Claude Code):
mcp__n8n-mcp__n8n_list_workflows            # lista tudo
mcp__n8n-mcp__n8n_get_workflow(id, mode=structure)  # topologia sem credencial
mcp__n8n-mcp__n8n_get_workflow(id, mode=full)       # JSON completo
mcp__n8n-mcp__n8n_update_partial_workflow           # editar
mcp__n8n-mcp__n8n_executions(workflowId=...)        # histórico de runs
mcp__n8n-mcp__n8n_validate_workflow(id)             # valida antes de ativar
```

**Regra:** ao alterar workflow, **atualizar esta doc no mesmo PR** pra não acumular drift entre n8n e repo.
