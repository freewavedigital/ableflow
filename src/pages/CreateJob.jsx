import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useBranch } from "@/hooks/useBranch";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";

const JOB_TYPES = [
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

export default function CreateJob() {
  const params = new URLSearchParams(window.location.search);
  const enquiryId = params.get("enquiry_id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { branches } = useBranch();

  const [form, setForm] = useState({
    job_type: "leak_inspection",
    branch_id: "",
    contact_name: "",
    contact_phone: "",
    site_address: "",
    site_suburb: "",
    scheduled_date: "",
    scheduled_time_start: "",
    scheduled_time_end: "",
    estimated_duration_hours: 2,
    assigned_technician: "",
    job_notes: "",
    technician_notes: "",
    access_notes: "",
    priority: "normal",
  });

  // Pre-fill from enquiry
  const { data: enquiry } = useQuery({
    queryKey: ["enquiry", enquiryId],
    queryFn: () => base44.entities.Enquiry.filter({ id: enquiryId }),
    select: (d) => d[0],
    enabled: !!enquiryId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const technicians = users.filter((u) => u.role === "technician");

  useEffect(() => {
    if (enquiry) {
      setForm((f) => ({
        ...f,
        job_type: enquiry.service_type || f.job_type,
        branch_id: enquiry.branch_id || f.branch_id,
        contact_name: enquiry.contact_name || f.contact_name,
        contact_phone: enquiry.contact_phone || f.contact_phone,
        site_address: enquiry.site_address || f.site_address,
        site_suburb: enquiry.site_suburb || f.site_suburb,
      }));
    }
  }, [enquiry]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.create(data),
    onSuccess: async (result) => {
      if (enquiryId) {
        await base44.entities.Enquiry.update(enquiryId, {
          status: "converted_to_job",
          converted_job_id: result.id,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      navigate(`/JobDetail?id=${result.id}`);
    },
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const jobNum = `JOB-${Date.now().toString().slice(-6)}`;
    createMutation.mutate({
      ...form,
      job_number: jobNum,
      status: "scheduled",
      outcome: "pending",
      enquiry_id: enquiryId || undefined,
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link
          to={enquiryId ? `/EnquiryDetail?id=${enquiryId}` : "/Jobs"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <PageHeader
        title="Create Job"
        subtitle={
          enquiry
            ? `Converting from ${enquiry.reference_number}`
            : "Create a new scheduled job"
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Job Type *</Label>
                <Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Branch *</Label>
                <Select value={form.branch_id} onValueChange={(v) => update("branch_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Contact Name *</Label>
                <Input required value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone *</Label>
                <Input required value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Site Address</Label>
                <Input value={form.site_address} onChange={(e) => update("site_address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Suburb</Label>
                <Input value={form.site_suburb} onChange={(e) => update("site_suburb", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date *</Label>
                <Input required type="date" value={form.scheduled_date} onChange={(e) => update("scheduled_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={form.scheduled_time_start} onChange={(e) => update("scheduled_time_start", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Time</Label>
                <Input type="time" value={form.scheduled_time_end} onChange={(e) => update("scheduled_time_end", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Technician</Label>
                <Select value={form.assigned_technician} onValueChange={(v) => update("assigned_technician", v)}>
                  <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                  <SelectContent>
                    {technicians.length === 0 ? (
                      <SelectItem value="unassigned" disabled>No technicians found</SelectItem>
                    ) : (
                      technicians.map((t) => (
                        <SelectItem key={t.id} value={t.email}>{t.full_name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Job Notes (Internal)</Label>
              <Textarea value={form.job_notes} onChange={(e) => update("job_notes", e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Technician Instructions</Label>
              <Textarea value={form.technician_notes} onChange={(e) => update("technician_notes", e.target.value)} rows={2} placeholder="Instructions for the tech on site..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Access Notes</Label>
              <Input value={form.access_notes} onChange={(e) => update("access_notes", e.target.value)} placeholder="Gate codes, parking info..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}