"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompanyMetrics } from "@/hooks/useAnalyticsData";

interface TopCompaniesTableProps {
  data: CompanyMetrics[];
}

const statusDot: Record<string, string> = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-blue-400",
};

const statusLabel: Record<string, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

export function TopCompaniesTable({ data }: TopCompaniesTableProps) {
  return (
    <Card className="card-hover h-full">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Top Companies</CardTitle>
          <CardDescription className="text-[11px]">Highest email activity</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6 text-[11px]">Company</TableHead>
              <TableHead className="text-center text-[11px]">Emails</TableHead>
              <TableHead className="text-center text-[11px]">Replied</TableHead>
              <TableHead className="text-center text-[11px]">Rate</TableHead>
              <TableHead className="pr-6 text-center text-[11px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.slice(0, 8).map((company) => {
                const dot = statusDot[company.status] || statusDot.cold;
                const label = statusLabel[company.status] || "Cold";
                return (
                  <TableRow
                    key={company.company}
                    className="group transition-colors duration-200"
                  >
                    <TableCell className="pl-6 py-2.5">
                      <span className="text-xs font-medium">
                        {company.company.length > 24
                          ? company.company.slice(0, 24) + "..."
                          : company.company}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      <span className="text-xs tabular-nums">{company.totalEmails}</span>
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      <span className="text-xs tabular-nums">{company.replied}</span>
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      <span className="text-xs font-medium tabular-nums">{company.replyRate}%</span>
                    </TableCell>
                    <TableCell className="pr-6 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
