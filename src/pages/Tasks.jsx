import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isToday, isBefore, parseISO } from "date-fns";
import { CheckCircle2, Circle, AlertCircle, Plus, Search } from "lucide-react";
import NewTaskDialog from "@/components/tasks/NewTaskDialog";

const STATUS_COLORS = {
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-slate-50 text-slate-500 border-slate-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

const TYPE_LABELS = {
  follow_up_call: "Follow-up Call",
  send_email: "Send Email",
  send_agreement: "Send Agreement",
  confirm_booking: "Confirm Booking",
  chase_payment: "Chase Payment",
  internal_action: "Internal Action",
  other: "Other",
};

export default function Tasks() {
  const { user } = useAuth();
  const perms = usePermissions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showNew, setShowNew] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", perms.userBranchId],
    queryFn: () => {
      const filter = perms.canManageAllTasks
        ? perms.branchFilter()
        : { assigned_to: user?.email };
      return Object.keys(filter).length
        ? base44.entities.TaskReminder.filter(filter, "due_date", 100)
        : base44.entities.TaskReminder.list("due_date", 100);
    },
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

  // Auto-flag overdue
  const enriched = tasks.map((t) => {
    if (t.status === "pending" && t.due_date && isBefore(parseISO(t.due_date), new Date()) && !isToday(parseISO(t.due_date))) {
      return { ...t, status: "overdue" };
    }
    return t;
  });

  const filtered = enriched.filter((t) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? ["pending", "in_progress", "overdue"].includes(t.status)
        : t.status === statusFilter;
    const matchesSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const overdue = filtered.filter((t) => t.status === "overdue").length;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <PageHeader title="Tasks & Reminders" subtitle={overdue > 0 ? `${overdue} overdue` : undefined}>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No tasks found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
            >
              <button
                onClick={() => task.status !== "completed" && completeMutation.mutate(task)}
                className="mt-0.5 flex-shrink-0"
              >
                {task.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : task.status === "overdue" ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-medium text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[task.status] || STATUS_COLORS.pending}`}>
                    {task.status}
                  </span>
                  {task.task_type && (
                    <span className="text-xs text-muted-foreground">{TYPE_LABELS[task.task_type] || task.task_type}</span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  {task.due_date && (
                    <span className={task.status === "overdue" ? "text-red-600 font-medium" : ""}>
                      Due {format(parseISO(task.due_date), "d MMM yyyy")}
                    </span>
                  )}
                  {task.assigned_to && <span>→ {task.assigned_to}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewTaskDialog onClose={() => setShowNew(false)} />}
    </div>
  );
}