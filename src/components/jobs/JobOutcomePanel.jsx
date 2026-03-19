import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, FileText, Receipt, RefreshCw, ChevronRight } from "lucide-react";

const OUTCOMES = [
  { value: "pending", label: "Pending" },
  { value: "no_leak_found", label: "No Leak Found" },
  { value: "leak_identified", label: "Leak Identified" },
  { value: "repair_quoted", label: "Repair Quoted" },
  { value: "repair_approved", label: "Repair Approved" },
  { value: "further_testing", label: "Further Testing Required" },
  { value: "client_declined", label: "Client Declined" },
  { value: "monitoring_advised", label: "Monitoring Advised" },
  { value: "completed_closed", label: "Completed & Closed" },
];

// Which outcomes suggest which follow-on actions
const OUTCOME_ACTIONS = {
  leak_identified: ["quote"],
  repair_quoted: ["quote"],
  repair_approved: ["quote", "followup_job"],
  further_testing: ["followup_job"],
  no_leak_found: ["invoice"],
  monitoring_advised: ["invoice"],
  client_declined: [],
  completed_closed: ["invoice"],
};

export default function JobOutcomePanel({ job, onUpdate }) {
  const actions = OUTCOME_ACTIONS[job.outcome] || [];
  const showPanel = ["completed", "awaiting_review", "follow_up_required", "quote_required", "invoiced", "closed"].includes(job.status);

  return (
    <Card className={showPanel ? "border-primary/20" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Outcome
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Result</Label>
          <Select value={job.outcome || "pending"} onValueChange={(v) => onUpdate("outcome", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OUTCOMES.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Outcome Notes</Label>
          <Textarea
            className="mt-1"
            value={job.outcome_notes || ""}
            onChange={(e) => onUpdate("outcome_notes", e.target.value)}
            placeholder="Detail findings, recommendations, or next steps..."
            rows={3}
          />
        </div>

        {/* Contextual follow-on actions */}
        {actions.length > 0 && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Suggested next actions:</p>
            <div className="flex flex-wrap gap-2">
              {actions.includes("quote") && !job.linked_quote_id && (
                <Link to={`/Quotes?create=1&job_id=${job.id}`}>
                  <Button size="sm" variant="outline" className="h-8">
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Create Quote
                  </Button>
                </Link>
              )}
              {actions.includes("invoice") && !job.linked_invoice_id && (
                <Link to={`/Invoices?create=1&job_id=${job.id}`}>
                  <Button size="sm" variant="outline" className="h-8">
                    <Receipt className="w-3.5 h-3.5 mr-1.5" />
                    Create Invoice
                  </Button>
                </Link>
              )}
              {actions.includes("followup_job") && !job.follow_up_job_id && (
                <Link to={`/CreateJob?follow_up_from=${job.id}`}>
                  <Button size="sm" variant="outline" className="h-8">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Create Follow-up Job
                  </Button>
                </Link>
              )}
            </div>
            {job.linked_quote_id && (
              <Link to={`/Quotes?id=${job.linked_quote_id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <FileText className="w-3 h-3" /> View linked quote <ChevronRight className="w-3 h-3" />
              </Link>
            )}
            {job.linked_invoice_id && (
              <Link to={`/Invoices?id=${job.linked_invoice_id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Receipt className="w-3 h-3" /> View linked invoice <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}