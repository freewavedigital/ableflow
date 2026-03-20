import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/hooks/useBranch";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  Inbox,
  Briefcase,
  FileText,
  Receipt,
  Clock,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { format, isToday, isPast, parseISO } from "date-fns";
import TechDashboard from "@/components/tech/TechDashboard";

// ─── Stat tile ───────────────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, sub, to, accent }) {
  const accentMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${accentMap[accent]}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Feed row ─────────────────────────────────────────────────────────────────
function FeedRow({ to, primary, secondary, right }) {
  return (
    <Link to={to} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{primary}</p>
        <p className="text-xs text-muted-foreground truncate">{secondary}</p>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </Link>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function FeedCard({ icon: Icon, title, cta, ctaTo, children, empty }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            {title}
          </CardTitle>
          {cta && (
            <Link to={ctaTo} className="text-xs text-primary hover:underline flex items-center gap-0.5">
              {cta} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {children
          ? children
          : <p className="text-sm text-muted-foreground text-center py-5">{empty}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { selectedBranchId } = useBranch();
  const { user } = useAuth();
  const isTechnician = user?.role === "technician";

  const { data: enquiries = [] } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => base44.entities.Enquiry.list("-created_date", 100),
    enabled: !isTechnician,
  });
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-scheduled_date", 200),
  });
  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => base44.entities.Quote.list("-created_date", 50),
    enabled: !isTechnician,
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 50),
    enabled: !isTechnician,
  });

  const byBranch = (list) =>
    selectedBranchId === "all" ? list : list.filter((i) => i.branch_id === selectedBranchId);

  const fJobs = byBranch(jobs);
  const fEnq = byBranch(enquiries);
  const fQuotes = byBranch(quotes);
  const fInvoices = byBranch(invoices);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayJobs = fJobs.filter((j) => j.scheduled_date === today);
  const activeJobs = fJobs.filter((j) => !["closed", "cancelled", "invoiced"].includes(j.status));
  const activeLeads = fEnq.filter((e) => !["converted_to_job", "lost"].includes(e.status));
  const newLeads = fEnq.filter((e) => e.status === "new_lead");
  const pendingQuotes = fQuotes.filter((q) => ["draft", "sent", "viewed"].includes(q.status));
  const unpaidInvoices = fInvoices.filter((i) => ["sent", "overdue"].includes(i.status));

  const overdueFollowUps = fEnq
    .filter((e) => e.follow_up_date && isPast(parseISO(e.follow_up_date)) && !["converted_to_job", "lost"].includes(e.status))
    .slice(0, 5);

  const myJobs = isTechnician
    ? fJobs.filter((j) => j.assigned_technician === user?.email && ["scheduled", "dispatched", "in_progress"].includes(j.status))
    : [];

  // ── Technician view ──
  if (isTechnician) {
    return <TechDashboard user={user} />;
  }

  // ── Admin / Manager view ──
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        </div>
        <Link to="/Enquiries?new=1">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New Enquiry
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile icon={Inbox} label="Active Leads" value={activeLeads.length} sub={newLeads.length > 0 ? `${newLeads.length} new` : undefined} to="/Enquiries" accent="blue" />
        <StatTile icon={Briefcase} label="Active Jobs" value={activeJobs.length} sub={`${todayJobs.length} today`} to="/Jobs" accent="amber" />
        <StatTile icon={FileText} label="Open Quotes" value={pendingQuotes.length} to="/Quotes" accent="purple" />
        <StatTile icon={Receipt} label="Unpaid Invoices" value={unpaidInvoices.length} to="/Invoices" accent="emerald" />
      </div>

      {/* Two-column feed */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's jobs */}
        <FeedCard icon={CalendarDays} title="Today's Jobs" cta="View schedule" ctaTo="/Schedule" empty="No jobs scheduled today">
          {todayJobs.length > 0 && (
            <div className="space-y-0.5">
              {todayJobs.slice(0, 6).map((j) => (
                <FeedRow
                  key={j.id}
                  to={`/JobDetail?id=${j.id}`}
                  primary={`${j.job_number || "Job"} — ${j.contact_name}`}
                  secondary={`${j.scheduled_time_start || "TBC"} · ${j.site_suburb || j.site_address}`}
                  right={<StatusBadge status={j.status} />}
                />
              ))}
            </div>
          )}
        </FeedCard>

        {/* Overdue follow-ups */}
        <FeedCard icon={AlertTriangle} title="Overdue Follow-ups" cta="View leads" ctaTo="/Enquiries" empty="No overdue follow-ups">
          {overdueFollowUps.length > 0 && (
            <div className="space-y-0.5">
              {overdueFollowUps.map((e) => (
                <FeedRow
                  key={e.id}
                  to={`/EnquiryDetail?id=${e.id}`}
                  primary={e.contact_name}
                  secondary={`${e.service_type?.replace(/_/g, " ")} · Due ${e.follow_up_date}`}
                  right={<StatusBadge status={e.status} />}
                />
              ))}
            </div>
          )}
        </FeedCard>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}