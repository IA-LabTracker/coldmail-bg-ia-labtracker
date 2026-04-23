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
  { id: "acceptance", number: "01", title: "Acceptance of Terms", icon: ScrollText },
  { id: "definitions", number: "02", title: "Definitions", icon: BookOpen },
  { id: "description", number: "03", title: "Service Description", icon: Mail },
  { id: "registration", number: "04", title: "Registration and Account", icon: Users },
  { id: "permitted-use", number: "05", title: "Permitted Use", icon: Shield },
  { id: "restrictions", number: "06", title: "Use Restrictions", icon: XCircle },
  { id: "connected-accounts", number: "07", title: "Connected Email Accounts", icon: Globe },
  { id: "ip", number: "08", title: "Intellectual Property", icon: Lock },
  { id: "privacy", number: "09", title: "Privacy and Data Protection", icon: Shield },
  { id: "availability", number: "10", title: "Availability and Warranties", icon: Server },
  { id: "liability", number: "11", title: "Limitation of Liability", icon: AlertTriangle },
  { id: "indemnification", number: "12", title: "Indemnification", icon: HandshakeIcon },
  { id: "termination", number: "13", title: "Termination", icon: Gavel },
  { id: "changes", number: "14", title: "Changes to the Terms", icon: Pencil },
  { id: "governing-law", number: "15", title: "Governing Law and Jurisdiction", icon: Scale },
  { id: "general", number: "16", title: "General Provisions", icon: FileText },
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
                Back to Login
              </Link>
            </Button>
          </div>

          <div className="flex items-start gap-5">
            <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <ScrollText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Terms of Use
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Cold Email Pro — Cold Email Automation Platform
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="gap-1.5">
                  <FileText className="h-3 w-3" />
                  Version 1.0
                </Badge>
                <Badge variant="secondary" className="gap-1.5">
                  <Pencil className="h-3 w-3" />
                  Updated 02/20/2026
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
                Navigation
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
            <SectionCard id="acceptance" number="01" title="Acceptance of Terms" icon={ScrollText}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                By accessing or using Cold Email Pro (the &quot;Service&quot;), you agree to be
                bound by these Terms of Use (the &quot;Terms&quot;). If you do not agree with any
                part of these Terms, you may not access or use the Service. Continued use of the
                Service after any changes to these Terms constitutes your acceptance of those
                changes.
              </p>
            </SectionCard>

            <SectionCard id="definitions" number="02" title="Definitions" icon={BookOpen}>
              <div className="space-y-3">
                {[
                  {
                    term: "Service",
                    desc: "The Cold Email Pro platform, including all features for sending emails, managing campaigns, importing contacts, and reporting.",
                  },
                  {
                    term: "User",
                    desc: "Any person or entity that accesses or uses the Service.",
                  },
                  {
                    term: "Connected Account",
                    desc: "A third-party email account linked to the Service for sending campaigns.",
                  },
                  {
                    term: "Campaign",
                    desc: "A set of emails configured to be sent automatically through the Service.",
                  },
                  {
                    term: "Personal Data",
                    desc: "Any information that identifies or can identify a natural person.",
                  },
                  {
                    term: "User Content",
                    desc: "All data, text, contact lists, and materials submitted by the User to the Service.",
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

            <SectionCard id="description" number="03" title="Service Description" icon={Mail}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cold Email Pro is a SaaS cold email automation platform that enables Users to
                create, manage, and send bulk email campaigns for commercial prospecting. The
                Service includes features such as contact list import, template creation, send
                scheduling, open and click tracking, and performance reporting.
              </p>
            </SectionCard>

            <SectionCard id="registration" number="04" title="Registration and Account" icon={Users}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                To use the Service, you must create an account by providing accurate and up-to-date
                information. You are responsible for keeping your access credentials confidential
                and for all activities that occur in your account. You agree to notify Cold Email
                Pro immediately of any unauthorized use of your account.
              </p>
            </SectionCard>

            <SectionCard id="permitted-use" number="05" title="Permitted Use" icon={Shield}>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                The Service must be used exclusively for legitimate B2B commercial prospecting. By
                using the Service, you agree that:
              </p>
              <ul className="space-y-2">
                {[
                  "You have an adequate legal basis to send emails to the recipients of your campaigns.",
                  "Your emails will not contain illegal, fraudulent, misleading, defamatory, obscene, or otherwise objectionable content.",
                  "You will not use the Service to send spam, phishing, or any kind of unsolicited email in violation of applicable laws.",
                  "You will comply with all laws and regulations applicable to commercial email, including but not limited to: LGPD (Brazil), CAN-SPAM Act (USA), and GDPR (European Union).",
                  "You will include a working opt-out mechanism in all emails sent through the Service.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard id="restrictions" number="06" title="Use Restrictions" icon={XCircle}>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                You agree <strong className="text-foreground">NOT</strong> to:
              </p>
              <ul className="space-y-2">
                {[
                  "Resell, sublicense, or commercialize access to the Service or any data obtained through it.",
                  "Reverse engineer, decompile, or attempt to extract the source code of the Service.",
                  "Use the Service to send emails that infringe third-party intellectual property rights.",
                  "Attempt to bypass any technical or security limitations of the Service.",
                  "Use bots, scrapers, or other automated means to access the Service without authorization.",
                  "Share access credentials with unauthorized third parties.",
                  "Send emails with malicious content, viruses, or malware.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              id="connected-accounts"
              number="07"
              title="Connected Email Accounts"
              icon={Globe}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                By connecting third-party email accounts to the Service, you represent that you
                are authorized to use those accounts for sending commercial email. Cold Email Pro
                is not responsible for suspensions, blocks, or penalties applied by email
                providers due to use of your accounts through the Service. You are solely
                responsible for maintaining the reputation of your email accounts and domains.
              </p>
            </SectionCard>

            <SectionCard id="ip" number="08" title="Intellectual Property" icon={Lock}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                All content, design, source code, features, and technology of the Service are the
                exclusive property of Cold Email Pro and are protected by intellectual property
                laws. You retain all rights to the User Content submitted to the Service and grant
                Cold Email Pro a limited license to process that data solely for the purpose of
                providing the Service.
              </p>
            </SectionCard>

            <SectionCard
              id="privacy"
              number="09"
              title="Privacy and Data Protection"
              icon={Shield}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cold Email Pro is committed to protecting your personal data in compliance with
                LGPD and other applicable laws. By using the Service, you consent to the
                collection and processing of data as described in our Privacy Policy. You are the
                controller of any third-party personal data you submit to the Service and are
                responsible for ensuring an adequate legal basis for that processing.
              </p>
            </SectionCard>

            <SectionCard
              id="availability"
              number="10"
              title="Availability and Warranties"
              icon={Server}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;. Cold Email
                Pro does not guarantee that the Service will be uninterrupted, error-free, or
                will meet all of your requirements. We do not guarantee specific email delivery
                rates, open rates, or that your emails will not be classified as spam by
                recipients&apos; email providers.
              </p>
            </SectionCard>

            <SectionCard
              id="liability"
              number="11"
              title="Limitation of Liability"
              icon={AlertTriangle}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                To the maximum extent permitted by law, Cold Email Pro will not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including loss
                of profits, data, business opportunities, or goodwill, resulting from your use or
                inability to use the Service. The total aggregate liability of Cold Email Pro is
                limited to the amount paid by the User in the 12 months preceding the event that
                gave rise to the claim.
              </p>
            </SectionCard>

            <SectionCard id="indemnification" number="12" title="Indemnification" icon={HandshakeIcon}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You agree to indemnify and hold harmless Cold Email Pro, its directors, employees,
                and partners from any claims, damages, losses, or expenses (including attorneys&apos;
                fees) arising from: (a) your use of the Service; (b) breach of these Terms; (c)
                infringement of third-party rights; or (d) the content of emails sent through the
                Service.
              </p>
            </SectionCard>

            <SectionCard id="termination" number="13" title="Termination" icon={Gavel}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cold Email Pro reserves the right to suspend or terminate your account at any
                time, with or without prior notice, if you breach these Terms or use the Service
                in a way that could cause harm to Cold Email Pro or to third parties. You may
                terminate your account at any time by contacting our support. After termination,
                your data will be deleted within 30 days, except where retention is required by
                law.
              </p>
            </SectionCard>

            <SectionCard id="changes" number="14" title="Changes to the Terms" icon={Pencil}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cold Email Pro may modify these Terms at any time. Significant changes will be
                communicated by email or through an in-Service notification. Continued use of the
                Service after the changes are published constitutes your acceptance of the new
                Terms.
              </p>
            </SectionCard>

            <SectionCard id="governing-law" number="15" title="Governing Law and Jurisdiction" icon={Scale}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                These Terms are governed by and construed in accordance with the laws of the
                Federative Republic of Brazil. The courts of São Paulo/SP are elected as the
                competent venue to settle any disputes arising from these Terms, with express
                waiver of any other, however privileged it may be.
              </p>
            </SectionCard>

            <SectionCard id="general" number="16" title="General Provisions" icon={FileText}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If any provision of these Terms is deemed invalid or unenforceable, the remaining
                provisions will remain in full force and effect. Failure by Cold Email Pro to
                exercise any right provided in these Terms does not constitute a waiver of that
                right. These Terms constitute the entire agreement between you and Cold Email Pro
                regarding use of the Service.
              </p>
            </SectionCard>

            {/* Contact */}
            <Separator />

            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Questions?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If you have questions about these Terms of Use, please contact us.
                  </p>
                </div>
                <Button variant="outline" asChild className="shrink-0">
                  <a href="mailto:suporte@coldemailpro.com">suporte@coldemailpro.com</a>
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-center pb-4">
              <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
                <a href="#">
                  <ArrowLeft className="h-4 w-4 rotate-90" />
                  Back to top
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
