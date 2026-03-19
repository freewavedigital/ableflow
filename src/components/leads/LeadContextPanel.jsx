import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight, Bell } from "lucide-react";
import { format } from "date-fns";

/**
 * Renders context-specific action panels depending on the current lead stage.
 */
export default function LeadContextPanel({ enquiry, onUpdate }) {
  const { status, id } = enquiry;

  return (
    <div className="space-y-4">
      {/* Tentative Dates — shown from tentative_dates stage onwards */}
      {["tentative_dates", "agreement_sent", "ready_to_schedule", "scheduled"].includes(status) && (
        <TentativeDatesPanel enquiry={enquiry} onUpdate={onUpdate} />
      )}

      {/* Future Lead — follow-up reminder */}
      {status === "future_lead" && (
        <FutureLeadPanel enquiry={enquiry} onUpdate={onUpdate} />
      )}

      {/* Agreement — shown when agreement_sent or beyond */}
      {["agreement_sent", "ready_to_schedule", "scheduled"].includes(status) && (
        <AgreementPanel enquiry={enquiry} onUpdate={onUpdate} />
      )}

      {/* Scheduled — show confirmed booking window */}
      {status === "scheduled" && (
        <ScheduledPanel enquiry={enquiry} onUpdate={onUpdate} />
      )}

      {/* Convert to Job — ready_to_schedule or scheduled */}
      {["ready_to_schedule", "scheduled"].includes(status) && (
        <ConvertToJobPanel enquiryId={id} />
      )}

      {/* Lost */}
      {status === "lost" && (
        <LostReasonPanel enquiry={enquiry} onUpdate={onUpdate} />
      )}
    </div>
  );
}

function TentativeDatesPanel({ enquiry, onUpdate }) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
          <Calendar className="w-4 h-4" />
          Tentative Booking Window
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={enquiry.tentative_date_from || ""}
              onChange={(e) => onUpdate("tentative_date_from", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={enquiry.tentative_date_to || ""}
              onChange={(e) => onUpdate("tentative_date_to", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Scheduling Notes</Label>
          <Textarea
            value={enquiry.tentative_notes || ""}
            onChange={(e) => onUpdate("tentative_notes", e.target.value)}
            rows={2}
            placeholder="e.g. Prefers mornings, avoid Fridays"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FutureLeadPanel({ enquiry, onUpdate }) {
  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
          <Bell className="w-4 h-4" />
          Follow-up Reminder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Follow-up Date</Label>
          <Input
            type="date"
            value={enquiry.follow_up_date || ""}
            onChange={(e) => onUpdate("follow_up_date", e.target.value)}
          />
        </div>
        <p className="text-xs text-purple-700">
          Set a reminder date to check back in with this client. A task will be created automatically.
        </p>
      </CardContent>
    </Card>
  );
}

function AgreementPanel({ enquiry, onUpdate }) {
  const statusColors = {
    not_sent: "text-slate-500",
    sent: "text-blue-600",
    viewed: "text-amber-600",
    signed: "text-green-600",
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
          <CheckCircle2 className="w-4 h-4" />
          Service Agreement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Agreement Status</Label>
          <Select
            value={enquiry.agreement_status || "not_sent"}
            onValueChange={(v) => onUpdate("agreement_status", v)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_sent">Not Sent</SelectItem>
              <SelectItem value="sent">Sent to Client</SelectItem>
              <SelectItem value="viewed">Viewed by Client</SelectItem>
              <SelectItem value="signed">Signed ✓</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {enquiry.agreement_status === "signed" && (
          <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Agreement signed — ready to proceed
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduledPanel({ enquiry, onUpdate }) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-green-800">
          <Clock className="w-4 h-4" />
          Confirmed Booking Window
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enquiry.tentative_date_from ? (
          <p className="text-sm text-green-800 font-medium">
            {format(new Date(enquiry.tentative_date_from), "d MMM yyyy")}
            {enquiry.tentative_date_to && enquiry.tentative_date_to !== enquiry.tentative_date_from
              ? ` – ${format(new Date(enquiry.tentative_date_to), "d MMM yyyy")}`
              : ""}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No dates set — go back to Tentative Dates stage to add.</p>
        )}
        {enquiry.tentative_notes && (
          <p className="text-xs text-muted-foreground mt-1">{enquiry.tentative_notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ConvertToJobPanel({ enquiryId }) {
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">Convert to a Job</p>
        <p className="text-xs text-muted-foreground">
          This lead is ready. Converting will create a confirmed Job record and lock this lead.
        </p>
        <Link to={`/CreateJob?enquiry_id=${enquiryId}`}>
          <Button size="sm" className="w-full mt-1">
            Convert to Job <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function LostReasonPanel({ enquiry, onUpdate }) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-red-800">
          <AlertTriangle className="w-4 h-4" />
          Lost Reason
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={enquiry.lost_reason || ""}
          onChange={(e) => onUpdate("lost_reason", e.target.value)}
          placeholder="Why was this lead lost? (e.g. price, timing, chose competitor)"
          rows={3}
        />
        <p className="text-xs text-red-600">
          Please record the reason before closing this record.
        </p>
      </CardContent>
    </Card>
  );
}