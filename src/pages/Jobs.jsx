import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/hooks/useBranch";
import { Link } from "react-router-dom";
import { Search, Filter, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { selectedBranchId } = useBranch();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-created_date", 200),
  });

  const filtered = jobs
    .filter((j) =>
      selectedBranchId === "all" ? true : j.branch_id === selectedBranchId
    )
    .filter((j) => (statusFilter === "all" ? true : j.status === statusFilter))
    .filter(
      (j) =>
        !search ||
        j.job_number?.toLowerCase().includes(search.toLowerCase()) ||
        j.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        j.site_address?.toLowerCase().includes(search.toLowerCase())
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Jobs" subtitle="Active and completed jobs">
        <Link to="/CreateJob">
          <Button size="sm">
            <Briefcase className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="awaiting_review">Awaiting Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
            <SelectItem value="quote_required">Quote Required</SelectItem>
            <SelectItem value="invoiced">Invoiced</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={search ? "Try a different search." : "No jobs have been created yet."}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Job #</TableHead>
                <TableHead className="text-xs">Client</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Type</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Technician</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <Link
                      to={`/JobDetail?id=${job.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {job.job_number || job.id?.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{job.contact_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {job.site_address}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">
                    {job.job_type?.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {job.scheduled_date
                      ? format(new Date(job.scheduled_date), "d MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {job.assigned_technician || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}