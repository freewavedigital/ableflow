import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useBranch } from "@/hooks/useBranch";
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, subDays,
  isSameDay, parseISO,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

import ScheduleFilters from "@/components/schedule/ScheduleFilters";
import WeekView from "@/components/schedule/WeekView";
import DayView from "@/components/schedule/DayView";
import UnassignedPanel from "@/components/schedule/UnassignedPanel";
import RescheduleDialog from "@/components/schedule/RescheduleDialog";
import MapView from "@/components/schedule/MapView";

export default function Schedule() {
  const queryClient = useQueryClient();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();

  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterTechnician, setFilterTechnician] = useState("all");
  const [filterJobType, setFilterJobType] = useState("all");
  const [rescheduleJob, setRescheduleJob] = useState(null);

  // Compute week start for week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  // Fetch all jobs (broad date window)
  const { data: allJobs = [], isLoading } = useQuery({
    queryKey: ["schedule-jobs"],
    queryFn: () =>
      base44.entities.Job.list("-scheduled_date", 1000),
    staleTime: 30_000,
  });

  // Fetch users to get technician list
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const technicians = useMemo(
    () => allUsers.filter((u) => ["technician", "admin", "branch_manager"].includes(u.role)),
    [allUsers]
  );

  // Apply filters
  const filteredJobs = useMemo(() => {
    return allJobs.filter((j) => {
      if (selectedBranchId !== "all" && j.branch_id !== selectedBranchId) return false;
      if (filterTechnician === "unassigned" && j.assigned_technician) return false;
      if (filterTechnician !== "all" && filterTechnician !== "unassigned" && j.assigned_technician !== filterTechnician) return false;
      if (filterJobType !== "all" && j.job_type !== filterJobType) return false;
      return true;
    });
  }, [allJobs, selectedBranchId, filterTechnician, filterJobType]);

  // Unassigned & scheduled (has a date but no technician)
  const unassignedJobs = useMemo(
    () => filteredJobs.filter((j) => !j.assigned_technician && j.scheduled_date && !["cancelled", "closed", "completed"].includes(j.status)),
    [filteredJobs]
  );

  // Conflict count for header badge
  const conflictCount = useMemo(() => {
    const byDayTech = {};
    filteredJobs.forEach((j) => {
      if (!j.scheduled_date || !j.assigned_technician || !j.scheduled_time_start) return;
      const key = `${j.scheduled_date}__${j.assigned_technician}`;
      if (!byDayTech[key]) byDayTech[key] = [];
      byDayTech[key].push(j);
    });
    let conflicts = 0;
    Object.values(byDayTech).forEach((jobs) => {
      for (let i = 0; i < jobs.length; i++) {
        for (let k = i + 1; k < jobs.length; k++) {
          const aStart = jobs[i].scheduled_time_start;
          const aEnd = jobs[i].scheduled_time_end || aStart;
          const bStart = jobs[k].scheduled_time_start;
          const bEnd = jobs[k].scheduled_time_end || bStart;
          if (aStart < bEnd && aEnd > bStart) conflicts++;
        }
      }
    });
    return conflicts;
  }, [filteredJobs]);

  // Drag-drop reschedule
  const rescheduleMutation = useMutation({
    mutationFn: ({ jobId, newDate }) =>
      base44.entities.Job.update(jobId, { scheduled_date: newDate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-jobs"] }),
  });

  const handleDrop = (jobId, newDate) => {
    rescheduleMutation.mutate({ jobId, newDate });
  };

  // Navigation
  const goBack = () =>
    view === "week" ? setCurrentDate(subWeeks(currentDate, 1)) : setCurrentDate(subDays(currentDate, 1));
  const goForward = () =>
    view === "week" ? setCurrentDate(addWeeks(currentDate, 1)) : setCurrentDate(addDays(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  const dateLabel =
    view === "week"
      ? `${format(weekStart, "d MMM")} — ${format(addDays(weekStart, 6), "d MMM yyyy")}`
      : format(currentDate, "EEEE, d MMMM yyyy");

  return (
    <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <PageHeader title="Dispatch Board" subtitle="Schedule & manage jobs by date and technician">
        <div className="flex items-center gap-2">
          {conflictCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {conflictCount} conflict{conflictCount !== 1 ? "s" : ""}
            </div>
          )}
          {unassignedJobs.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
              ⚡ {unassignedJobs.length} unassigned
            </div>
          )}
          <Link to="/CreateJob">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Job
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Filters */}
      <ScheduleFilters
        view={view}
        setView={(v) => { setView(v); setCurrentDate(new Date()); }}
        branches={branches}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        technicians={technicians}
        filterTechnician={filterTechnician}
        setFilterTechnician={setFilterTechnician}
        filterJobType={filterJobType}
        setFilterJobType={setFilterJobType}
      />

      {/* Date navigator */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={goBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={goToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={goForward}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground">{dateLabel}</span>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />
        )}
      </div>

      {view === "map" ? (
        <MapView
          jobs={filteredJobs}
          technicians={technicians}
          selectedDate={currentDate}
        />
      ) : (
        <div className="flex gap-5 items-start">
          {/* Main calendar view */}
          <div className="flex-1 min-w-0">
            {view === "week" ? (
              <WeekView
                weekStart={weekStart}
                jobs={filteredJobs}
                technicians={technicians}
                onDrop={handleDrop}
              />
            ) : (
              <DayView
                selectedDay={currentDate}
                jobs={filteredJobs}
                technicians={technicians}
              />
            )}
          </div>

          {/* Unassigned sidebar */}
          <div className="w-64 flex-shrink-0">
            <UnassignedPanel jobs={unassignedJobs} onJobClick={setRescheduleJob} />
          </div>
        </div>
      )}

      {/* Global reschedule dialog (from unassigned panel) */}
      {rescheduleJob && (
        <RescheduleDialog
          job={rescheduleJob}
          technicians={technicians}
          onClose={() => setRescheduleJob(null)}
        />
      )}
    </div>
  );
}