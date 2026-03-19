import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isBefore, isToday, parseISO, isAfter, startOfToday } from "date-fns";
import { AlertCircle, Plus, Search, CheckCircle2, CalendarDays, Bell } from "lucide-react";
import NewTaskDialog from "@/components/tasks/NewTaskDialog";
import TaskCard from "@/components/tasks/TaskCard";

function groupByDueDate(tasks) {
  const today = startOfToday();
  const groups = { overdue: [], today: [], upcoming: [], someday: [] };
  for (const t of tasks) {
    if (t._overdue) { groups.overdue.push(t); continue; }
    if (!t.due_date) { groups.someday.push(t); continue; }
    const d = parseISO(t.due_date);
    if (isToday(d)) groups.today.push(t);
    else groups.upcoming.push(t);
  }
  // Sort upcoming by date ascending
  groups.upcoming.sort((a, b) => a.due_date?.localeCompare(b.due_date));
  return groups;
}

function SectionHeader({ label, count, color }) {
  return (
    <div className={`flex items-center gap-2 mb-2 mt-5 first:mt-0`}>
      <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${color} bg-opacity-10`}>
        {count}
      </span>
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const perms = usePermissions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", perms.userBranchId, assignedFilter],
    queryFn: () => {
      const filter = perms.canManageAllTasks
        ? { ...perms.branchFilter(), ...(assignedFilter !== "all" ? { assigned_to: assignedFilter } : {}) }
        : { assigned_to: user?.email };
      return Object.keys(filter).length
        ? base44.entities.TaskReminder.filter(filter, "due_date", 200)
        : base44.entities.TaskReminder.list("due_date", 200);
    },
  });

  const { data: staffUsers = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => base44.entities.User.list(),
    enabled: perms.canManageAllTasks,
  });

  const completeMutation = useMutation({
    mutationFn: (task) =>
      base44.entities.TaskReminder.update(task.id, {
        status: "completed",
        completed_date: new Date().toISOString().split("T")[0],
        completed_by: user?.email,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // Enrich with overdue flag
  const enriched = tasks.map((t) => ({
    ...t,
    _overdue:
      t.status === "pending" &&
      t.due_date &&
      isBefore(parseISO(t.due_date), startOfToday()),
  }));

  // Filter
  const filtered = enriched.filter((t) => {
    const matchesStatus =
      statusFilter === "all" ? true
      : statusFilter === "active" ? ["pending", "in_progress"].includes(t.status)
      : statusFilter === "overdue" ? t._overdue
      : t.status === statusFilter;
    const matchesSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.entity_label?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || t.task_type === typeFilter;
    return matchesStatus && matchesSearch && matchesType;
  });

  const grouped = groupByDueDate(filtered.filter((t) => t.status !== "completed" && t.status !== "cancelled"));
  const completedFiltered = filtered.filter((t) => t.status === "completed");

  const overdueCount = enriched.filter((t) => t._overdue).length;
  const todayCount = enriched.filter((t) => t.status === "pending" && t.due_date && isToday(parseISO(t.due_date))).length;
  const reminderDueCount = enriched.filter((t) => t.status === "pending" && t.reminder_date && !isAfter(parseISO(t.reminder_date), startOfToday())).length;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <PageHeader title="Tasks & Reminders" subtitle={`Manage follow-ups, reminders and actions`}>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </PageHeader>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className={`p-3 rounded-xl border ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-card border-border"}`}>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : "text-foreground"}`}>{overdueCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Overdue
          </p>
        </div>
        <div className="p-3 rounded-xl border bg-card border-border">
          <p className="text-2xl font-bold text-foreground">{todayCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Due Today
          </p>
        </div>
        <div className={`p-3 rounded-xl border ${reminderDueCount > 0 ? "bg-amber-50 border-amber-200" : "bg-card border-border"}`}>
          <p className={`text-2xl font-bold ${reminderDueCount > 0 ? "text-amber-600" : "text-foreground"}`}>{reminderDueCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Bell className="w-3 h-3" /> Reminders Due
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="follow_up_call">Follow-up Call</SelectItem>
            <SelectItem value="send_email">Send Email</SelectItem>
            <SelectItem value="send_agreement">Send Agreement</SelectItem>
            <SelectItem value="confirm_booking">Confirm Booking</SelectItem>
            <SelectItem value="chase_payment">Chase Payment</SelectItem>
            <SelectItem value="schedule_job">Schedule Job</SelectItem>
            <SelectItem value="internal_action">Internal</SelectItem>
          </SelectContent>
        </Select>
        {perms.canManageAllTasks && (
          <Select value={assignedFilter} onValueChange={setAssignedFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value={user?.email}>Mine</SelectItem>
              {staffUsers.map((u) => (
                <SelectItem key={u.id} value={u.email}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      ) : statusFilter === "completed" ? (
        <div className="space-y-2">
          {completedFiltered.length === 0
            ? <p className="text-center py-12 text-sm text-muted-foreground">No completed tasks</p>
            : completedFiltered.map((t) => (
                <TaskCard key={t.id} task={t} onComplete={completeMutation.mutate} />
              ))}
        </div>
      ) : (
        <div>
          {grouped.overdue.length > 0 && (
            <div>
              <SectionHeader label="Overdue" count={grouped.overdue.length} color="text-red-600" />
              <div className="space-y-2">
                {grouped.overdue.map((t) => <TaskCard key={t.id} task={t} onComplete={completeMutation.mutate} />)}
              </div>
            </div>
          )}
          {grouped.today.length > 0 && (
            <div>
              <SectionHeader label="Due Today" count={grouped.today.length} color="text-amber-600" />
              <div className="space-y-2">
                {grouped.today.map((t) => <TaskCard key={t.id} task={t} onComplete={completeMutation.mutate} />)}
              </div>
            </div>
          )}
          {grouped.upcoming.length > 0 && (
            <div>
              <SectionHeader label="Upcoming" count={grouped.upcoming.length} color="text-blue-600" />
              <div className="space-y-2">
                {grouped.upcoming.map((t) => <TaskCard key={t.id} task={t} onComplete={completeMutation.mutate} />)}
              </div>
            </div>
          )}
          {grouped.someday.length > 0 && (
            <div>
              <SectionHeader label="No Due Date" count={grouped.someday.length} color="text-muted-foreground" />
              <div className="space-y-2">
                {grouped.someday.map((t) => <TaskCard key={t.id} task={t} onComplete={completeMutation.mutate} />)}
              </div>
            </div>
          )}
          {filtered.filter((t) => t.status !== "completed").length === 0 && (
            <div className="text-center py-16">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground/60 mt-1">No active tasks match your filters</p>
            </div>
          )}
        </div>
      )}

      {showNew && <NewTaskDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}