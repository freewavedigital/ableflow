import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";

export default function JobScheduleCard({ job, users, onUpdate, readOnly }) {
  const technicians = (users || []).filter((u) =>
    ["technician", "admin"].includes(u.role)
  );

  if (readOnly) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span>
              {job.scheduled_date
                ? format(new Date(job.scheduled_date), "EEEE, d MMMM yyyy")
                : "Not scheduled"}
            </span>
          </div>
          {job.scheduled_time_start && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>
                {job.scheduled_time_start}
                {job.scheduled_time_end && ` — ${job.scheduled_time_end}`}
              </span>
            </div>
          )}
          {job.assigned_technician && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{job.assigned_technician}</span>
            </div>
          )}
          {job.estimated_duration_hours && (
            <div className="text-xs text-muted-foreground">
              Est. duration: {job.estimated_duration_hours}h
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={job.scheduled_date || ""}
            onChange={(e) => onUpdate("scheduled_date", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Start</Label>
            <Input
              type="time"
              value={job.scheduled_time_start || ""}
              onChange={(e) => onUpdate("scheduled_time_start", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">End</Label>
            <Input
              type="time"
              value={job.scheduled_time_end || ""}
              onChange={(e) => onUpdate("scheduled_time_end", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Technician</Label>
          <Select
            value={job.assigned_technician || ""}
            onValueChange={(v) => onUpdate("assigned_technician", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assign technician" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((u) => (
                <SelectItem key={u.id} value={u.email}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}