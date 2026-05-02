"use client";

import { Email } from "@/types";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { AnalyticsKPICards } from "./AnalyticsKPICards";
import { ProgressRing } from "./ProgressRing";
import { ConversionFunnel } from "./ConversionFunnel";
import { EmailsOverTimeChart } from "./EmailsOverTimeChart";
import { StatusPieChart } from "./StatusPieChart";
import { ClassificationPieChart } from "./ClassificationPieChart";
import { CampaignBarChart } from "./CampaignBarChart";
import { TopCompaniesTable } from "./TopCompaniesTable";
import { PipelineSection } from "./PipelineSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsDashboardProps {
  emails: Email[];
}

export function AnalyticsDashboard({ emails }: AnalyticsDashboardProps) {
  const {
    dailyBreakdown,
    chartPeriodDays,
    kpiSparklines,
    statusDistribution,
    classificationDistribution,
    campaignMetrics,
    topCompanies,
    overallMetrics,
    funnelData,
  } = useAnalyticsData(emails);

  return (
    <div className="space-y-4">
      {/* Row 1: KPI Cards with Sparklines */}
      <AnalyticsKPICards sparklines={kpiSparklines} />

      {/* Row 2: Bento grid - Rates + Funnel + Line chart */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left column: Conversion rates + Funnel */}
        <div className="col-span-12 space-y-4 lg:col-span-4">
          {/* Conversion Rates Card */}
          <Card className="card-hover animate-fade-up stagger-6 overflow-hidden">
            <CardHeader className="pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">Conversion Rates</CardTitle>
                <CardDescription className="text-[11px]">Key performance indicators</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around py-2">
                <ProgressRing
                  value={overallMetrics.openRate}
                  color="#0ea5e9"
                  label="Open Rate"
                  size={72}
                  strokeWidth={5}
                />
                <ProgressRing
                  value={overallMetrics.replyRate}
                  color="#22c55e"
                  label="Reply Rate"
                  size={72}
                  strokeWidth={5}
                />
                <ProgressRing
                  value={overallMetrics.hotRate}
                  color="#f59e0b"
                  label="Hot Rate"
                  size={72}
                  strokeWidth={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Funnel */}
          <div className="animate-fade-up stagger-7">
            <ConversionFunnel {...funnelData} />
          </div>
        </div>

        {/* Right column: Email Activity Line Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="animate-fade-up stagger-6 h-full">
            <EmailsOverTimeChart data={dailyBreakdown} periodDays={chartPeriodDays} />
          </div>
        </div>
      </div>

      {/* Row 3: Pie Charts + Campaign Bar */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 animate-fade-up stagger-7 md:col-span-6 lg:col-span-3">
          <StatusPieChart data={statusDistribution} />
        </div>
        <div className="col-span-12 animate-fade-up stagger-8 md:col-span-6 lg:col-span-3">
          <ClassificationPieChart data={classificationDistribution} />
        </div>
        <div className="col-span-12 animate-fade-up stagger-8 lg:col-span-6">
          <CampaignBarChart data={campaignMetrics} />
        </div>
      </div>

      {/* Row 4: Top Companies Table */}
      <div className="animate-fade-up">
        <TopCompaniesTable data={topCompanies} />
      </div>

      {/* Row 5: Pipeline (deal value tracking, fed by /inbox + detail modal) */}
      <div className="animate-fade-up">
        <PipelineSection />
      </div>
    </div>
  );
}
