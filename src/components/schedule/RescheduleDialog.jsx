import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Clock, User } from "lucide-react";

export default function RescheduleDialog({ job, technicians, onClose }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(job.scheduled_date || "");
  const [timeStart, setTimeStart] = useState(job.scheduled_time_start || "");
  const [timeEnd, setTimeEnd] = useState(job.scheduled_time_end || "");
  const [tech, setTech] = useState(job.assigned_technician || "unassigned");

  const mutation = useMutation({
    mutationFn: () =>
      base44.entities.Job.update(job.id, {
        scheduled_date: date,
        scheduled_time_start: timeStart || null,
        scheduled_time_end: timeEnd || null,
        assigned_technician: tech === "unassigned" ? null : tech,
        status: job.status === "draft" ? "scheduled" : job.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-jobs"] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Reschedule Job</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground mb-3">
          {job.contact_name} — {job.job_type?.replace(/_/g, " ")}
          {job.site_suburb && ` · ${job.site_suburb}`}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" /> Date
            </Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Start
              </Label>
              <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <User className="w-3 h-3" /> Technician
            </Label>
            <Select value={tech} onValueChange={setTech}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Assign technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {technicians.map((t) => (
                  <SelectItem key={t.email} value={t.email}>
                    {t.full_name || t.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={!date || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}