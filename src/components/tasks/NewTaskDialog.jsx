import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TASK_TYPES = [
  { value: "follow_up_call", label: "Follow-up Call" },
  { value: "send_email", label: "Send Email" },
  { value: "send_agreement", label: "Send Agreement" },
  { value: "confirm_booking", label: "Confirm Booking" },
  { value: "chase_payment", label: "Chase Payment" },
  { value: "schedule_job", label: "Schedule Job" },
  { value: "internal_action", label: "Internal Action" },
  { value: "other", label: "Other" },
];

export default function NewTaskDialog({ onClose, entityType, entityId, entityLabel }) {
  const { user } = useAuth();
  const perms = usePermissions();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    task_type: "follow_up_call",
    priority: "normal",
    due_date: "",
    reminder_date: "",
    assigned_to: user?.email || "",
    entity_type: entityType || "lead",
    entity_id: entityId || "",
    entity_label: entityLabel || "",
    branch_id: perms.userBranchId || "",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => base44.entities.User.list(),
  });

  const staffUsers = users.filter((u) => ["admin", "branch_manager", "head_office"].includes(u.role));

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.TaskReminder.create({ ...data, status: "pending" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
    },
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Task / Reminder</DialogTitle>
          {entityLabel && (
            <p className="text-xs text-muted-foreground mt-1">
              Linked to: <span className="font-medium text-foreground">{entityLabel}</span>
            </p>
          )}
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Follow up with Sarah re: booking"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.task_type} onValueChange={(v) => set("task_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due Date *</Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
            <div>
              <Label>Remind Me On</Label>
              <Input
                type="date"
                value={form.reminder_date}
                onChange={(e) => set("reminder_date", e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label>Assign To</Label>
            <Select value={form.assigned_to} onValueChange={(v) => set("assigned_to", v)}>
              <SelectTrigger><SelectValue placeholder="Select person..." /></SelectTrigger>
              <SelectContent>
                {staffUsers.length > 0 ? (
                  staffUsers.map((u) => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={user?.email}>{user?.full_name || user?.email}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {!entityType && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Related To</Label>
                <Select value={form.entity_type} onValueChange={(v) => set("entity_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead / Enquiry</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Record ID</Label>
                <Input value={form.entity_id} onChange={(e) => set("entity_id", e.target.value)} placeholder="optional" />
              </div>
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Any context or instructions..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => mutation.mutate(form)}
              disabled={!form.title || !form.due_date || mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Create Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}