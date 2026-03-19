import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useBranch } from "@/hooks/useBranch";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from "date-fns";

export default function Schedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { selectedBranchId } = useBranch();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list("-scheduled_date", 500),
  });

  const filteredJobs = jobs.filter((j) =>
    selectedBranchId === "all" ? true : j.branch_id === selectedBranchId
  );

  const getJobsForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return filteredJobs.filter((j) => j.scheduled_date === dateStr);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Schedule" subtitle="Weekly dispatch board">
        <Link to="/CreateJob">
          <Button size="sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </PageHeader>

      {/* Week navigator */}
      <div className="flex items-center gap-3 mb-5">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(new Date())}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">
          {format(weekStart, "d MMM")} — {format(weekEnd, "d MMM yyyy")}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const dayJobs = getJobsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={day.toISOString()} className="min-h-[180px]">
                <div
                  className={`text-center py-2 rounded-t-lg ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-xs font-medium uppercase">
                    {format(day, "EEE")}
                  </p>
                  <p className="text-lg font-semibold">{format(day, "d")}</p>
                </div>
                <div className="border border-t-0 border-border rounded-b-lg p-2 space-y-2 bg-card min-h-[140px]">
                  {dayJobs.map((job) => (
                    <Link
                      key={job.id}
                      to={`/JobDetail?id=${job.id}`}
                      className="block p-2 rounded-lg bg-muted/60 hover:bg-muted transition-colors border border-border/50"
                    >
                      <p className="text-xs font-medium truncate">
                        {job.contact_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {job.scheduled_time_start || ""}{" "}
                        {job.job_type?.replace(/_/g, " ")}
                      </p>
                      {job.assigned_technician && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {job.assigned_technician}
                        </p>
                      )}
                    </Link>
                  ))}
                  {dayJobs.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      —
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}