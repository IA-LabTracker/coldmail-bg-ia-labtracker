import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  ScrollText,
  Shield,
  Scale,
  FileText,
  AlertTriangle,
  Users,
  Lock,
  Globe,
  Server,
  Gavel,
  HandshakeIcon,
  XCircle,
  Pencil,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "aceitacao", number: "01", title: "Aceitação dos Termos", icon: ScrollText },
  { id: "definicoes", number: "02", title: "Definições", icon: BookOpen },
  { id: "descricao", number: "03", title: "Descrição do Serviço", icon: Mail },
  { id: "cadastro", number: "04", title: "Cadastro e Conta", icon: Users },
  { id: "uso-permitido", number: "05", title: "Uso Permitido", icon: Shield },
  { id: "restricoes", number: "06", title: "Restrições de Uso", icon: XCircle },
  { id: "contas-email", number: "07", title: "Contas de Email Conectadas", icon: Globe },
  { id: "propriedade", number: "08", title: "Propriedade Intelectual", icon: Lock },
  { id: "privacidade", number: "09", title: "Privacidade e Proteção de Dados", icon: Shield },
  { id: "disponibilidade", number: "10", title: "Disponibilidade e Garantias", icon: Server },
  { id: "limitacao", number: "11", title: "Limitação de Responsabilidade", icon: AlertTriangle },
  { id: "indenizacao", number: "12", title: "Indenização", icon: HandshakeIcon },
  { id: "rescisao", number: "13", title: "Rescisão", icon: Gavel },
  { id: "alteracoes", number: "14", title: "Alterações nos Termos", icon: Pencil },
  { id: "lei-aplicavel", number: "15", title: "Lei Aplicável e Foro", icon: Scale },
  { id: "disposicoes", number: "16", title: "Disposições Gerais", icon: FileText },
];

function SectionCard({
  id,
  number,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  number: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id}>
      <Card className="overflow-hidden border-border/50 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/30 px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs tabular-nums">
              {number}
            </Badge>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
        </div>
        <CardContent className="px-6 py-5">{children}</CardContent>
      </Card>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Login
              </Link>
            </Button>
          </div>

          <div className="flex items-start gap-5">
            <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <ScrollText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Termos de Uso
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Cold Email Pro — Plataforma de Automação de Cold Emails
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="gap-1.5">
                  <FileText className="h-3 w-3" />
                  Versão 1.0
                </Badge>
                <Badge variant="secondary" className="gap-1.5">
                  <Pencil className="h-3 w-3" />
                  Atualizado em 20/02/2026
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Navegação
              </p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="font-mono text-xs text-muted-foreground/60">{s.number}</span>
                    <span className="truncate">{s.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            <SectionCard id="aceitacao" number="01" title="Aceitação dos Termos" icon={ScrollText}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ao acessar ou usar o Cold Email Pro (&quot;Serviço&quot;), você concorda em ficar
                vinculado a estes Termos de Uso (&quot;Termos&quot;). Se você não concordar com
                qualquer parte destes Termos, não poderá acessar ou usar o Serviço. O uso continuado
                do Serviço após quaisquer alterações nestes Termos constitui sua aceitação das
                alterações.
              </p>
            </SectionCard>

            <SectionCard id="definicoes" number="02" title="Definições" icon={BookOpen}>
              <div className="space-y-3">
                {[
                  {
                    term: "Serviço",
                    desc: "A plataforma Cold Email Pro, incluindo todas as funcionalidades de envio de emails, gerenciamento de campanhas, importação de contatos e relatórios.",
                  },
                  {
                    term: "Usuário",
                    desc: "Qualquer pessoa ou entidade que acesse ou utilize o Serviço.",
                  },
                  {
                    term: "Conta Conectada",
                    desc: "Conta de email de terceiros vinculada ao Serviço para envio de campanhas.",
                  },
                  {
                    term: "Campanha",
                    desc: "Conjunto de emails configurados para envio automatizado através do Serviço.",
                  },
                  {
                    term: "Dados Pessoais",
                    desc: "Qualquer informação que identifique ou possa identificar uma pessoa natural.",
                  },
                  {
                    term: "Conteúdo do Usuário",
                    desc: "Todos os dados, textos, listas de contatos e materiais enviados pelo Usuário ao Serviço.",
                  },
                ].map((item) => (
                  <div key={item.term} className="flex gap-3 rounded-lg bg-muted/40 px-4 py-3">
                    <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">
                      {item.term}
                    </Badge>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard id="descricao" number="03" title="Descrição do Serviço" icon={Mail}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O Cold Email Pro é uma plataforma SaaS de automação de emails frios (cold emails)
                que permite aos Usuários criar, gerenciar e enviar campanhas de email em massa para
                prospecção comercial. O Serviço inclui funcionalidades como importação de listas de
                contatos, criação de templates, agendamento de envios, rastreamento de aberturas e
                cliques, e relatórios de desempenho.
              </p>
            </SectionCard>

            <SectionCard id="cadastro" number="04" title="Cadastro e Conta" icon={Users}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Para utilizar o Serviço, você deve criar uma conta fornecendo informações precisas e
                atualizadas. Você é responsável por manter a confidencialidade de suas credenciais
                de acesso e por todas as atividades realizadas em sua conta. Você concorda em
                notificar imediatamente o Cold Email Pro sobre qualquer uso não autorizado de sua
                conta.
              </p>
            </SectionCard>

            <SectionCard id="uso-permitido" number="05" title="Uso Permitido" icon={Shield}>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                O Serviço deve ser utilizado exclusivamente para fins de prospecção comercial
                legítima (B2B). Ao utilizar o Serviço, você concorda que:
              </p>
              <ul className="space-y-2">
                {[
                  "Possui base legal adequada para enviar emails aos destinatários de suas campanhas.",
                  "Seus emails não conterão conteúdo ilegal, fraudulento, enganoso, difamatório, obsceno ou de outra forma objetável.",
                  "Não utilizará o Serviço para enviar spam, phishing ou qualquer tipo de email não solicitado em violação às leis aplicáveis.",
                  "Cumprirá todas as leis e regulamentos aplicáveis ao envio de emails comerciais, incluindo, mas não se limitando a: LGPD (Brasil), CAN-SPAM Act (EUA) e GDPR (União Europeia).",
                  "Incluirá mecanismo de descadastro (opt-out) funcional em todos os emails enviados através do Serviço.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard id="restricoes" number="06" title="Restrições de Uso" icon={XCircle}>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Você concorda em <strong className="text-foreground">NÃO</strong>:
              </p>
              <ul className="space-y-2">
                {[
                  "Revender, sublicenciar ou comercializar o acesso ao Serviço ou qualquer dado obtido através dele.",
                  "Fazer engenharia reversa, descompilar ou tentar extrair o código-fonte do Serviço.",
                  "Utilizar o Serviço para enviar emails que violem direitos de propriedade intelectual de terceiros.",
                  "Tentar contornar quaisquer limitações técnicas ou de segurança do Serviço.",
                  "Utilizar bots, scrapers ou outros meios automatizados para acessar o Serviço de forma não autorizada.",
                  "Compartilhar credenciais de acesso com terceiros não autorizados.",
                  "Enviar emails com conteúdo malicioso, vírus ou malware.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              id="contas-email"
              number="07"
              title="Contas de Email Conectadas"
              icon={Globe}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ao conectar contas de email de terceiros ao Serviço, você declara que possui
                autorização para utilizar essas contas para envio de emails comerciais. O Cold Email
                Pro não se responsabiliza por suspensões, bloqueios ou penalidades aplicadas por
                provedores de email devido ao uso de suas contas através do Serviço. Você é o único
                responsável por manter a reputação de suas contas de email e domínios.
              </p>
            </SectionCard>

            <SectionCard id="propriedade" number="08" title="Propriedade Intelectual" icon={Lock}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Todo o conteúdo, design, código-fonte, funcionalidades e tecnologia do Serviço são
                de propriedade exclusiva do Cold Email Pro e estão protegidos por leis de
                propriedade intelectual. Você retém todos os direitos sobre o Conteúdo do Usuário
                enviado ao Serviço, concedendo ao Cold Email Pro uma licença limitada para processar
                esses dados exclusivamente para a prestação do Serviço.
              </p>
            </SectionCard>

            <SectionCard
              id="privacidade"
              number="09"
              title="Privacidade e Proteção de Dados"
              icon={Shield}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                O Cold Email Pro se compromete a proteger seus dados pessoais em conformidade com a
                LGPD e demais legislações aplicáveis. Ao utilizar o Serviço, você consente com a
                coleta e processamento de dados conforme descrito em nossa Política de Privacidade.
                Você é o controlador dos dados pessoais de terceiros que enviar ao Serviço e é
                responsável por garantir a base legal adequada para esse tratamento.
              </p>
            </SectionCard>

            <SectionCard
              id="disponibilidade"
              number="10"
              title="Disponibilidade e Garantias"
              icon={Server}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                O Serviço é fornecido &quot;COMO ESTÁ&quot; e &quot;CONFORME DISPONÍVEL&quot;. O
                Cold Email Pro não garante que o Serviço será ininterrupto, livre de erros ou que
                atenderá a todos os seus requisitos. Não garantimos taxas específicas de entrega de
                emails, taxas de abertura, ou que seus emails não serão classificados como spam
                pelos provedores de email dos destinatários.
              </p>
            </SectionCard>

            <SectionCard
              id="limitacao"
              number="11"
              title="Limitação de Responsabilidade"
              icon={AlertTriangle}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                Na extensão máxima permitida por lei, o Cold Email Pro não será responsável por
                quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos,
                incluindo perda de lucros, dados, oportunidades de negócios ou goodwill, resultantes
                do uso ou incapacidade de uso do Serviço. A responsabilidade agregada total do Cold
                Email Pro está limitada ao valor pago pelo Usuário nos 12 meses anteriores ao evento
                que deu origem à reclamação.
              </p>
            </SectionCard>

            <SectionCard id="indenizacao" number="12" title="Indenização" icon={HandshakeIcon}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Você concorda em indenizar e isentar o Cold Email Pro, seus diretores, funcionários
                e parceiros de quaisquer reclamações, danos, perdas ou despesas (incluindo
                honorários advocatícios) decorrentes de: (a) seu uso do Serviço; (b) violação destes
                Termos; (c) violação de direitos de terceiros; ou (d) conteúdo dos emails enviados
                através do Serviço.
              </p>
            </SectionCard>

            <SectionCard id="rescisao" number="13" title="Rescisão" icon={Gavel}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O Cold Email Pro reserva-se o direito de suspender ou encerrar sua conta a qualquer
                momento, com ou sem aviso prévio, caso você viole estes Termos ou utilize o Serviço
                de forma que possa causar danos ao Cold Email Pro ou a terceiros. Você pode encerrar
                sua conta a qualquer momento entrando em contato com nosso suporte. Após o
                encerramento, seus dados serão excluídos em até 30 dias, salvo quando a retenção for
                necessária por obrigação legal.
              </p>
            </SectionCard>

            <SectionCard id="alteracoes" number="14" title="Alterações nos Termos" icon={Pencil}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O Cold Email Pro pode modificar estes Termos a qualquer momento. Alterações
                significativas serão comunicadas por email ou através de notificação no Serviço. O
                uso continuado do Serviço após a publicação das alterações constitui sua aceitação
                dos novos Termos.
              </p>
            </SectionCard>

            <SectionCard id="lei-aplicavel" number="15" title="Lei Aplicável e Foro" icon={Scale}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Estes Termos serão regidos e interpretados de acordo com as leis da República
                Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP como competente
                para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia
                expressa a qualquer outro, por mais privilegiado que seja.
              </p>
            </SectionCard>

            <SectionCard id="disposicoes" number="16" title="Disposições Gerais" icon={FileText}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Se qualquer disposição destes Termos for considerada inválida ou inexequível, as
                demais disposições permanecerão em pleno vigor e efeito. A falha do Cold Email Pro
                em exercer qualquer direito previsto nestes Termos não constituirá renúncia a esse
                direito. Estes Termos constituem o acordo integral entre você e o Cold Email Pro em
                relação ao uso do Serviço.
              </p>
            </SectionCard>

            {/* Contato */}
            <Separator />

            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Dúvidas?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Em caso de dúvidas sobre estes Termos de Uso, entre em contato conosco.
                  </p>
                </div>
                <Button variant="outline" asChild className="shrink-0">
                  <a href="mailto:suporte@coldemailpro.com">suporte@coldemailpro.com</a>
                </Button>
              </CardContent>
            </Card>

            {/* Back to top */}
            <div className="flex justify-center pb-4">
              <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
                <a href="#">
                  <ArrowLeft className="h-4 w-4 rotate-90" />
                  Voltar ao topo
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
