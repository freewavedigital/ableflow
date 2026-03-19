import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CallLogger({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    direction: "outbound",
    phone_number: "",
    call_status: "answered",
    duration_seconds: 0,
    summary: "",
  });
  const [durationMins, setDurationMins] = useState(0);
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Create CommunicationRecord
      const commRecord = await base44.entities.CommunicationRecord.create({
        communication_type: "call",
        entity_type: data.entityType || "client",
        entity_id: data.entityId || "",
        direction: data.direction,
        contact_phone: data.phone_number,
        timestamp: new Date().toISOString(),
        initiated_by: "", // Would be set from auth context
        status: "completed",
        notes: data.summary,
      });

      // Create CallRecord
      const callRecord = await base44.entities.CallRecord.create({
        communication_record_id: commRecord.id,
        phone_number: data.phone_number,
        duration_seconds: durationMins * 60,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        call_status: data.call_status,
        summary: data.summary,
      });

      return { commRecord, callRecord };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communications"] });
      toast.success("Call logged");
      onOpenChange(false);
      setFormData({
        direction: "outbound",
        phone_number: "",
        call_status: "answered",
        duration_seconds: 0,
        summary: "",
      });
      setDurationMins(0);
      onSuccess?.();
    },
    onError: () => toast.error("Failed to log call"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.phone_number.trim()) {
      toast.error("Phone number is required");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Call</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Direction</label>
            <Select value={formData.direction} onValueChange={(v) => setFormData({ ...formData, direction: v })}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Phone Number</label>
            <Input
              placeholder="+1 (555) 123-4567"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <Select value={formData.call_status} onValueChange={(v) => setFormData({ ...formData, call_status: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
              <Input
                type="number"
                min="0"
                value={durationMins}
                onChange={(e) => setDurationMins(parseInt(e.target.value) || 0)}
                className="h-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <Textarea
              placeholder="What was discussed..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="h-20"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Log Call
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}