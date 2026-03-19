import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useBranch } from "@/hooks/useBranch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const SOURCES = [
  { value: "phone", label: "Phone Call" },
  { value: "website", label: "Website Form" },
  { value: "email", label: "Email" },
  { value: "referral", label: "Referral" },
  { value: "repeat_customer", label: "Repeat Customer" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

export default function NewEnquiryDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { branches } = useBranch();

  const [form, setForm] = useState({
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    service_type: "leak_inspection",
    source: "phone",
    branch_id: "",
    site_address: "",
    site_suburb: "",
    pool_type: "none",
    issue_summary: "",
    priority: "normal",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Enquiry.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      onOpenChange(false);
      setForm({
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        service_type: "leak_inspection",
        source: "phone",
        branch_id: "",
        site_address: "",
        site_suburb: "",
        pool_type: "none",
        issue_summary: "",
        priority: "normal",
      });
      if (result?.id) {
        navigate(`/EnquiryDetail?id=${result.id}`);
      }
    },
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const refNum = `ENQ-${Date.now().toString().slice(-6)}`;
    createMutation.mutate({
      ...form,
      reference_number: refNum,
      status: "new_lead",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Enquiry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Contact Name *</Label>
              <Input
                required
                value={form.contact_name}
                onChange={(e) => update("contact_name", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone *</Label>
              <Input
                required
                value={form.contact_phone}
                onChange={(e) => update("contact_phone", e.target.value)}
                placeholder="04XX XXX XXX"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Type</Label>
              <Select
                value={form.service_type}
                onValueChange={(v) => update("service_type", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Source</Label>
              <Select
                value={form.source}
                onValueChange={(v) => update("source", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Branch</Label>
              <Select
                value={form.branch_id}
                onValueChange={(v) => update("branch_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pool Type</Label>
              <Select
                value={form.pool_type}
                onValueChange={(v) => update("pool_type", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / N/A</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="fibreglass">Fibreglass</SelectItem>
                  <SelectItem value="vinyl">Vinyl</SelectItem>
                  <SelectItem value="above_ground">Above Ground</SelectItem>
                  <SelectItem value="spa">Spa</SelectItem>
                  <SelectItem value="pond">Pond</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Site Address</Label>
              <Input
                value={form.site_address}
                onChange={(e) => update("site_address", e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Suburb</Label>
              <Input
                value={form.site_suburb}
                onChange={(e) => update("site_suburb", e.target.value)}
                placeholder="Suburb"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Issue Summary</Label>
            <Textarea
              value={form.issue_summary}
              onChange={(e) => update("issue_summary", e.target.value)}
              placeholder="Brief description of the issue..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => update("priority", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Enquiry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}