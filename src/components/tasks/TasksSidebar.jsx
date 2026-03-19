/**
 * Reusable task sidebar — pass entityType + entityId + entityLabel.
 * Used in EnquiryDetail (lead), JobDetail (job), ClientDetail (client).
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, AlertCircle, AlarmClock } from "lucide-react";
import { format, isBefore, parseISO, isToday } from "date-fns";
import NewTaskDialog from "@/components/tasks/NewTaskDialog";

export default function TasksSidebar({ entityType, entityId, entityLabel }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const qKey = ["tasks", entityType, entityId];

  const { data: tasks = [] } = useQuery({
    queryKey: qKey,
    queryFn: () =>
      base44.entities.TaskReminder.filter(
        { entity_type: entityType, entity_id: entityId },
        "due_date",
        30
      ),
    enabled: !!entityId,
  });

  const completeTask = async (task) => {
    await base44.entities.TaskReminder.update(task.id, {
      status: "completed",
      completed_date: new Date().toISOString().split("T")[0],
      completed_by: user?.email,
    });
    queryClient.invalidateQueries({ queryKey: qKey });
  };

  const enriched = tasks.map((t) => ({
    ...t,
    _overdue:
      t.status === "pending" &&
      t.due_date &&
      isBefore(parseISO(t.due_date), new Date()) &&
      !isToday(parseISO(t.due_date)),
  }));

  const active = enriched.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const done = enriched.filter((t) => t.status === "completed");
  const overdueCount = active.filter((t) => t._overdue).length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              Tasks & Reminders
              {overdueCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">
                  {overdueCount} overdue
                </span>
              )}
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowNew(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {enriched.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No tasks yet — add one to track follow-ups.</p>
          ) : (
            <>
              {active.map((task) => (
                <div key={task.id} className="flex items-start gap-2">
                  <button onClick={() => completeTask(task)} className="mt-0.5 flex-shrink-0">
                    {task._overdue ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight">{task.title}</p>
                    {task.due_date && (
                      <p className={`text-xs mt-0.5 flex items-center gap-1 ${task._overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        <AlarmClock className="w-3 h-3" />
                        {task._overdue ? "Overdue · " : "Due "}
                        {format(parseISO(task.due_date), "d MMM")}
                        {task.assigned_to && <span className="ml-1 opacity-60">→ {task.assigned_to.split("@")[0]}</span>}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {done.length > 0 && (
                <div className="pt-2 border-t border-border space-y-1.5">
                  {done.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 opacity-50">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <p className="text-xs line-through truncate">{task.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showNew && (
        <NewTaskDialog
          entityType={entityType}
          entityId={entityId}
          entityLabel={entityLabel}
          onClose={() => {
            setShowNew(false);
            queryClient.invalidateQueries({ queryKey: qKey });
          }}
        />
      )}
    </>
  );
}