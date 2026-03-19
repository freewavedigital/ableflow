import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewTaskDialog({ onClose, entityType, entityId }) {
  const { user } = useAuth();
  const perms = usePermissions();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    task_type: "follow_up_call",
    due_date: "",
    assigned_to: user?.email || "",
    entity_type: entityType || "lead",
    entity_id: entityId || "",
    branch_id: perms.userBranchId || "",
  });

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
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Follow up with Sarah re: booking" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.task_type} onValueChange={(v) => set("task_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up_call">Follow-up Call</SelectItem>
                  <SelectItem value="send_email">Send Email</SelectItem>
                  <SelectItem value="send_agreement">Send Agreement</SelectItem>
                  <SelectItem value="confirm_booking">Confirm Booking</SelectItem>
                  <SelectItem value="chase_payment">Chase Payment</SelectItem>
                  <SelectItem value="internal_action">Internal Action</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date *</Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Assign To</Label>
            <Input value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} placeholder="user@email.com" />
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
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => mutation.mutate(form)} disabled={!form.title || !form.due_date || mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Create Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}