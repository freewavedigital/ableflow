import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, AlertCircle } from "lucide-react";
import { format, isBefore, parseISO, isToday } from "date-fns";
import NewTaskDialog from "@/components/tasks/NewTaskDialog";

export default function LeadTasksSidebar({ enquiryId }) {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", "lead", enquiryId],
    queryFn: () =>
      base44.entities.TaskReminder.filter(
        { entity_type: "lead", entity_id: enquiryId },
        "due_date",
        20
      ),
    enabled: !!enquiryId,
  });

  const completeTask = async (task) => {
    await base44.entities.TaskReminder.update(task.id, {
      status: "completed",
      completed_date: new Date().toISOString().split("T")[0],
    });
    queryClient.invalidateQueries({ queryKey: ["tasks", "lead", enquiryId] });
  };

  const enriched = tasks.map((t) => {
    if (
      t.status === "pending" &&
      t.due_date &&
      isBefore(parseISO(t.due_date), new Date()) &&
      !isToday(parseISO(t.due_date))
    ) {
      return { ...t, _overdue: true };
    }
    return t;
  });

  const active = enriched.filter((t) => t.status !== "completed");
  const done = enriched.filter((t) => t.status === "completed");

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Tasks & Reminders</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowNew(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {enriched.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No tasks yet</p>
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
                      <p className={`text-xs mt-0.5 ${task._overdue ? "text-red-600" : "text-muted-foreground"}`}>
                        {task._overdue ? "Overdue · " : "Due "}
                        {format(parseISO(task.due_date), "d MMM")}
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
          entityType="lead"
          entityId={enquiryId}
          onClose={() => {
            setShowNew(false);
            queryClient.invalidateQueries({ queryKey: ["tasks", "lead", enquiryId] });
          }}
        />
      )}
    </>
  );
}