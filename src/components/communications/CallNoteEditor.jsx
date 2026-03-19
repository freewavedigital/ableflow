import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CallNoteEditor({ open, onOpenChange, commRecord, onSuccess }) {
  const [noteText, setNoteText] = useState("");
  const [createTask, setCreateTask] = useState(false);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const qc = useQueryClient();

  const addNoteMutation = useMutation({
    mutationFn: async (data) => {
      // Add note to communication record
      const currentNotes = (commRecord?.notes || "") + (commRecord?.notes ? "\n\n" : "") + `[${new Date().toLocaleString()}]: ${data.noteText}`;
      
      await base44.entities.CommunicationRecord.update(commRecord.id, {
        notes: currentNotes,
      });

      // Optionally create follow-up task
      if (data.createTask && data.taskDueDate) {
        await base44.entities.TaskReminder.create({
          entity_type: commRecord.entity_type,
          entity_id: commRecord.entity_id,
          entity_label: `Follow-up from call`,
          branch_id: commRecord.branch_id,
          title: "Call follow-up",
          description: data.noteText,
          task_type: "follow_up_call",
          priority: "normal",
          status: "pending",
          due_date: data.taskDueDate,
          assigned_to: data.taskAssignee || "",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communications"] });
      toast.success("Note added");
      onOpenChange(false);
      setNoteText("");
      setCreateTask(false);
      setTaskDueDate("");
      setTaskAssignee("");
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    addNoteMutation.mutate({
      noteText,
      createTask,
      taskDueDate,
      taskAssignee,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note & Create Follow-up</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Note</label>
            <Textarea
              placeholder="Add notes from this call..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="h-24"
            />
          </div>

          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={createTask}
                onChange={(e) => setCreateTask(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Create follow-up task</span>
            </label>

            {createTask && (
              <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Due Date</label>
                  <Input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Assign To (optional)</label>
                  <Input
                    placeholder="Email or name"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addNoteMutation.isPending}>
              {addNoteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Note
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}