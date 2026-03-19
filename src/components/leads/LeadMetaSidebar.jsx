import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/shared/StatusBadge";
import { Building2, Briefcase, Calendar, User } from "lucide-react";
import { format } from "date-fns";

export default function LeadMetaSidebar({ enquiry, branchName, users, onUpdate }) {
  const admins = (users || []).filter((u) => ["admin", "branch_manager", "head_office"].includes(u.role));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Lead Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Row label="Branch" value={
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            {branchName || "—"}
          </span>
        } />
        <Row label="Reference" value={<span className="font-mono text-xs">{enquiry.reference_number || "—"}</span>} />
        <Row label="Created" value={enquiry.created_date ? format(new Date(enquiry.created_date), "d MMM yyyy") : "—"} />
        <Row label="Priority" value={<StatusBadge status={enquiry.priority || "normal"} />} />

        {enquiry.converted_job_id && (
          <div className="pt-2 border-t border-border">
            <Link
              to={`/JobDetail?id=${enquiry.converted_job_id}`}
              className="flex items-center gap-2 text-xs text-primary hover:underline font-medium"
            >
              <Briefcase className="w-3.5 h-3.5" />
              View Converted Job →
            </Link>
          </div>
        )}

        {/* Assign to */}
        <div className="pt-2 border-t border-border space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" /> Assigned To
          </Label>
          <Select
            value={enquiry.assigned_to || "unassigned"}
            onValueChange={(v) => onUpdate("assigned_to", v === "unassigned" ? "" : v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {admins.map((u) => (
                <SelectItem key={u.id} value={u.email}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Follow-up date */}
        {enquiry.follow_up_date && (
          <div className="pt-2 border-t border-border">
            <Row
              label="Follow-up"
              value={
                <span className="flex items-center gap-1 text-xs text-amber-700">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(enquiry.follow_up_date), "d MMM yyyy")}
                </span>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs flex-shrink-0">{label}</span>
      <span className="font-medium text-right text-xs">{value}</span>
    </div>
  );
}