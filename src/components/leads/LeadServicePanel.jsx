import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Waves, Wrench } from "lucide-react";

const SERVICE_TYPES = [
  { value: "leak_inspection", label: "Leak Inspection" },
  { value: "structural_inspection", label: "Structural Inspection" },
  { value: "pressure_test", label: "Pressure Test" },
  { value: "scuba_dive_test", label: "Scuba Dive Test" },
  { value: "pipe_blockage", label: "Pipe Blockage" },
  { value: "repair", label: "Repair" },
  { value: "domestic_inspection", label: "Domestic Inspection" },
  { value: "service_call", label: "Service Call" },
  { value: "follow_up", label: "Follow-up" },
  { value: "other", label: "Other" },
];

const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "unit", label: "Unit / Apartment" },
  { value: "townhouse", label: "Townhouse" },
  { value: "commercial", label: "Commercial" },
  { value: "pool_complex", label: "Pool Complex" },
  { value: "resort", label: "Resort" },
  { value: "other", label: "Other" },
];

const POOL_TYPES = [
  { value: "none", label: "No Pool" },
  { value: "concrete", label: "Concrete" },
  { value: "fibreglass", label: "Fibreglass" },
  { value: "vinyl", label: "Vinyl Liner" },
  { value: "above_ground", label: "Above Ground" },
  { value: "spa", label: "Spa / Hot Tub" },
  { value: "pond", label: "Pond / Water Feature" },
  { value: "other", label: "Other" },
];

const SOURCES = [
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "referral", label: "Referral" },
  { value: "repeat_customer", label: "Repeat Customer" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function LeadServicePanel({ enquiry, onUpdate }) {
  const hasPool = enquiry.pool_type && enquiry.pool_type !== "none";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" />
          Service & Issue Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service row */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Service Type</Label>
            <Select value={enquiry.service_type || "leak_inspection"} onValueChange={(v) => onUpdate("service_type", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Priority</Label>
            <Select value={enquiry.priority || "normal"} onValueChange={(v) => onUpdate("priority", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Enquiry Source</Label>
            <Select value={enquiry.source || "phone"} onValueChange={(v) => onUpdate("source", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Property & Pool */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Property Type</Label>
            <Select value={enquiry.property_type || "house"} onValueChange={(v) => onUpdate("property_type", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <Waves className="w-3 h-3" /> Pool / Spa / Water Feature
            </Label>
            <Select value={enquiry.pool_type || "none"} onValueChange={(v) => onUpdate("pool_type", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {POOL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Issue summary */}
        <div className="space-y-1">
          <Label className="text-xs">Issue Summary</Label>
          <Textarea
            value={enquiry.issue_summary || ""}
            onChange={(e) => onUpdate("issue_summary", e.target.value)}
            placeholder="Brief description of the problem as reported by the client..."
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Additional notes */}
        <div className="space-y-1">
          <Label className="text-xs">Additional Details</Label>
          <Textarea
            value={enquiry.additional_notes || ""}
            onChange={(e) => onUpdate("additional_notes", e.target.value)}
            placeholder="Any other relevant information, access details, client concerns..."
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Returning customer toggle */}
        <div className="flex items-center justify-between py-1">
          <Label className="text-xs text-muted-foreground cursor-pointer">Previous / returning customer</Label>
          <Switch
            checked={!!enquiry.previous_customer}
            onCheckedChange={(v) => onUpdate("previous_customer", v)}
          />
        </div>
      </CardContent>
    </Card>
  );
}