import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/hooks/useBranch";
import { Link } from "react-router-dom";
import {
  MessageSquarePlus,
  Briefcase,
  FileText,
  Receipt,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-3xl font-semibold mt-1 tracking-tight">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { selectedBranchId } = useBranch();

  const { data: enquiries = [] } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => base44.entities.Enquiry.list("-created_date", 100),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 100),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => base44.entities.Quote.list("-created_date", 50),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 50),
  });

  const filterByBranch = (items) =>
    selectedBranchId === "all"
      ? items
      : items.filter((i) => i.branch_id === selectedBranchId);

  const filteredEnquiries = filterByBranch(enquiries);
  const filteredJobs = filterByBranch(jobs);
  const filteredQuotes = filterByBranch(quotes);
  const filteredInvoices = filterByBranch(invoices);

  const activeEnquiries = filteredEnquiries.filter(
    (e) => !["converted_to_job", "lost"].includes(e.status)
  );
  const activeJobs = filteredJobs.filter(
    (j) => !["completed", "cancelled"].includes(j.status)
  );
  const pendingQuotes = filteredQuotes.filter(
    (q) => ["draft", "sent", "viewed"].includes(q.status)
  );
  const unpaidInvoices = filteredInvoices.filter(
    (i) => ["sent", "overdue"].includes(i.status)
  );

  const todayJobs = filteredJobs.filter(
    (j) => j.scheduled_date === format(new Date(), "yyyy-MM-dd")
  );

  const followUps = filteredEnquiries
    .filter((e) => e.follow_up_date && new Date(e.follow_up_date) <= new Date())
    .slice(0, 5);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview"
      >
        <Link to="/Enquiries">
          <Button size="sm">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            New Enquiry
          </Button>
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={MessageSquarePlus}
          label="Active Enquiries"
          value={activeEnquiries.length}
          color="blue"
          to="/Enquiries"
        />
        <StatCard
          icon={Briefcase}
          label="Active Jobs"
          value={activeJobs.length}
          color="amber"
          to="/Jobs"
        />
        <StatCard
          icon={FileText}
          label="Pending Quotes"
          value={pendingQuotes.length}
          color="purple"
          to="/Quotes"
        />
        <StatCard
          icon={Receipt}
          label="Unpaid Invoices"
          value={unpaidInvoices.length}
          color="green"
          to="/Invoices"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Today's Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No jobs scheduled for today
              </p>
            ) : (
              <div className="space-y-3">
                {todayJobs.slice(0, 6).map((job) => (
                  <Link
                    key={job.id}
                    to={`/JobDetail?id=${job.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {job.job_number || "Job"} — {job.contact_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.scheduled_time_start} · {job.site_address}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-ups Due */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              Follow-ups Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No overdue follow-ups
              </p>
            ) : (
              <div className="space-y-3">
                {followUps.map((enq) => (
                  <Link
                    key={enq.id}
                    to={`/EnquiryDetail?id=${enq.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {enq.contact_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {enq.service_type?.replace(/_/g, " ")} · Follow up{" "}
                        {enq.follow_up_date}
                      </p>
                    </div>
                    <StatusBadge status={enq.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}