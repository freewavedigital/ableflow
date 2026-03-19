import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/hooks/useBranch";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/lib/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import KpiTile from "@/components/analytics/KpiTile";
import RevenueChart from "@/components/analytics/RevenueChart";
import JobOutcomeChart from "@/components/analytics/JobOutcomeChart";
import TechnicianTable from "@/components/analytics/TechnicianTable";
import LeadConversionChart from "@/components/analytics/LeadConversionChart";
import {
  DollarSign, Briefcase, TrendingUp, Clock, Users, FileText, AlertCircle, CheckCircle2
} from "lucide-react";
import { subDays, subMonths, isAfter, parseISO, startOfDay } from "date-fns";
import { Navigate } from "react-router-dom";

const DATE_RANGES = [
  { value: "7d",   label: "Last 7 days" },
  { value: "30d",  label: "Last 30 days" },
  { value: "90d",  label: "Last 90 days" },
  { value: "6m",   label: "Last 6 months" },
  { value: "1y",   label: "Last 12 months" },
  { value: "all",  label: "All time" },
];

function getRangeStart(range) {
  const now = new Date();
  if (range === "7d")  return subDays(now, 7);
  if (range === "30d") return subDays(now, 30);
  if (range === "90d") return subDays(now, 90);
  if (range === "6m")  return subMonths(now, 6);
  if (range === "1y")  return subMonths(now, 12);
  return null;
}

function filterByRange(items, range, dateField = "created_date") {
  const start = getRangeStart(range);
  if (!start) return items;
  return items.filter((item) => {
    const d = item[dateField];
    if (!d) return false;
    return isAfter(new Date(d), startOfDay(start));
  });
}

export default function Analytics() {
  const { selectedBranchId } = useBranch();
  const perms = usePermissions();
  const { user } = useAuth();
  const [range, setRange] = useState("30d");

  // Gate: only branch_manager+ can see this
  if (!perms.canViewFinancials) {
    return <Navigate to="/Dashboard" replace />;
  }

  const { data: jobs = [] } = useQuery({
    queryKey: ["all-jobs-analytics"],
    queryFn: () => base44.entities.Job.list("-scheduled_date", 500),
  });
  const { data: enquiries = [] } = useQuery({
    queryKey: ["all-enquiries-analytics"],
    queryFn: () => base44.entities.Enquiry.list("-created_date", 500),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["all-invoices-analytics"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 500),
  });
  const { data: quotes = [] } = useQuery({
    queryKey: ["all-quotes-analytics"],
    queryFn: () => base44.entities.Quote.list("-created_date", 200),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Branch filter
  const byBranch = (list) =>
    selectedBranchId === "all" ? list : list.filter((i) => i.branch_id === selectedBranchId);

  // Date + branch filtered sets
  const fJobs      = useMemo(() => filterByRange(byBranch(jobs), range, "scheduled_date"), [jobs, selectedBranchId, range]);
  const fEnq       = useMemo(() => filterByRange(byBranch(enquiries), range), [enquiries, selectedBranchId, range]);
  const fInvoices  = useMemo(() => filterByRange(byBranch(invoices), range), [invoices, selectedBranchId, range]);
  const fQuotes    = useMemo(() => filterByRange(byBranch(quotes), range), [quotes, selectedBranchId, range]);

  // ── KPI calculations ─────────────────────────────────────────────────────
  const totalRevenue = fInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const totalOutstanding = fInvoices
    .filter((i) => ["sent", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const completedJobs = fJobs.filter((j) => ["completed", "invoiced", "closed"].includes(j.status));
  const totalJobs = fJobs.length;

  const conversionRate = fEnq.length > 0
    ? Math.round((fEnq.filter((e) => e.status === "converted_to_job").length / fEnq.length) * 100)
    : 0;

  const jobsWithDuration = fJobs.filter((j) => j.time_on_site_minutes && j.time_on_site_minutes > 0);
  const avgDuration = jobsWithDuration.length > 0
    ? Math.round(jobsWithDuration.reduce((s, j) => s + j.time_on_site_minutes, 0) / jobsWithDuration.length)
    : null;

  const overdueInvoices = byBranch(invoices).filter((i) => i.status === "overdue").length;
  const quoteApprovalRate = fQuotes.length > 0
    ? Math.round((fQuotes.filter((q) => ["approved", "converted_to_job"].includes(q.status)).length / fQuotes.length) * 100)
    : 0;

  // Technicians who are active
  const technicianUsers = users.filter((u) => u.role === "technician");

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Analytics"
        subtitle="Branch performance metrics and KPIs"
      >
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiTile
          icon={DollarSign}
          label="Revenue Collected"
          value={`$${totalRevenue.toLocaleString()}`}
          sub={`$${totalOutstanding.toLocaleString()} outstanding`}
          accent="green"
        />
        <KpiTile
          icon={Briefcase}
          label="Jobs Completed"
          value={completedJobs.length}
          sub={`of ${totalJobs} total`}
          accent="blue"
        />
        <KpiTile
          icon={TrendingUp}
          label="Lead Conversion"
          value={`${conversionRate}%`}
          sub={`${fEnq.length} leads in period`}
          accent="purple"
        />
        <KpiTile
          icon={Clock}
          label="Avg Job Duration"
          value={avgDuration != null ? `${avgDuration}m` : "—"}
          sub={avgDuration != null ? `${jobsWithDuration.length} jobs with data` : "No clock-in data yet"}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiTile
          icon={FileText}
          label="Quote Approval Rate"
          value={`${quoteApprovalRate}%`}
          sub={`${fQuotes.length} quotes issued`}
          accent="cyan"
        />
        <KpiTile
          icon={Users}
          label="Active Technicians"
          value={technicianUsers.length}
          sub="registered in system"
          accent="blue"
        />
        <KpiTile
          icon={AlertCircle}
          label="Overdue Invoices"
          value={overdueInvoices}
          sub="across all periods"
          accent="rose"
        />
        <KpiTile
          icon={CheckCircle2}
          label="Jobs This Period"
          value={totalJobs}
          sub={`${fJobs.filter((j) => j.status === "in_progress").length} currently active`}
          accent="green"
        />
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <RevenueChart invoices={fInvoices} />
        <LeadConversionChart enquiries={fEnq} />
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <JobOutcomeChart jobs={fJobs} />
        <TechnicianTable jobs={fJobs} users={users} />
      </div>
    </div>
  );
}