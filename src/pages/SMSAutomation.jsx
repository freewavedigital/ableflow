import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SMS_TRIGGERS, SMS_TRIGGER_CONDITIONS } from "@/lib/smsService";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

const TRIGGER_LABELS = {
  enquiry_acknowledgement: "Enquiry Acknowledgement",
  tentative_booking: "Tentative Booking Message",
  booking_confirmation: "Booking Confirmation",
  job_reminder: "Job Reminder",
  technician_on_the_way: "Technician On The Way",
  job_completion: "Job Completion",
  follow_up_request: "Follow Up / Review Request",
};

const TRIGGER_DESCRIPTIONS = {
  enquiry_acknowledgement: "Send acknowledgement when enquiry is created",
  tentative_booking: "Send confirmation when booking window is set",
  booking_confirmation: "Send confirmation when job is booked",
  job_reminder: "Send reminder 24 hours before scheduled job",
  technician_on_the_way: "Notify when technician is dispatched",
  job_completion: "Notify when job is completed",
  follow_up_request: "Request review or follow-up",
};

export default function SMSAutomation() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    trigger: "",
    template_id: "",
    enabled: true,
  });
  const queryClient = useQueryClient();

  // Fetch triggers
  const { data: triggers, isLoading } = useQuery({
    queryKey: ["sms-triggers"],
    queryFn: async () => {
      return base44.entities.CommunicationTrigger.filter(
        { communication_channel: "sms" },
        "-created_date",
        100
      );
    },
  });

  // Fetch templates for dropdown
  const { data: templates } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      return base44.entities.CommunicationTemplate.filter(
        { template_type: "sms", status: "active" },
        "-created_date",
        100
      );
    },
  });

  // Save trigger mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const triggerConfig = SMS_TRIGGER_CONDITIONS[data.trigger];
      const payload = {
        name: TRIGGER_LABELS[data.trigger],
        description: TRIGGER_DESCRIPTIONS[data.trigger],
        trigger_event: triggerConfig.trigger,
        trigger_conditions: triggerConfig.condition
          ? [
              {
                field: triggerConfig.condition.field,
                operator: "equals",
                value: triggerConfig.condition.value,
              },
            ]
          : [],
        communication_channel: "sms",
        template_id: data.template_id,
        recipient_type: "client",
        status: data.enabled ? "active" : "paused",
        delay_minutes: triggerConfig.delay_minutes || 0,
      };

      if (editingId) {
        return base44.entities.CommunicationTrigger.update(editingId, payload);
      }
      return base44.entities.CommunicationTrigger.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-triggers"] });
      setOpen(false);
      setEditingId(null);
      setFormData({ trigger: "", template_id: "", enabled: true });
    },
  });

  // Delete trigger mutation
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.CommunicationTrigger.update(id, { status: "disabled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-triggers"] });
    },
  });

  const handleOpen = (trigger = null) => {
    if (trigger) {
      setEditingId(trigger.id);
      const triggerKey = Object.keys(TRIGGER_LABELS).find(
        (key) => TRIGGER_LABELS[key] === trigger.name
      );
      setFormData({
        trigger: triggerKey,
        template_id: trigger.template_id,
        enabled: trigger.status === "active",
      });
    } else {
      setEditingId(null);
      setFormData({ trigger: "", template_id: "", enabled: true });
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!formData.trigger || !formData.template_id) {
      alert("Please select a trigger and template");
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading automation rules...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="SMS Automation"
        subtitle="Set up automatic SMS messages for workflow events"
      >
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </PageHeader>

      {!triggers?.length ? (
        <EmptyState icon={AlertCircle} title="No automation rules yet">
          <Button onClick={() => handleOpen()} variant="outline" size="sm">
            Create First Rule
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {triggers.map((trigger) => (
            <Card key={trigger.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{trigger.name}</h3>
                    {trigger.status === "active" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Paused</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{trigger.description}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <span className="font-medium">Trigger:</span> {trigger.trigger_event}
                    </div>
                    {trigger.delay_minutes > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">Delay:</span>{" "}
                        {trigger.delay_minutes / 60} hour
                        {trigger.delay_minutes / 60 > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpen(trigger)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(trigger.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Automation Rule" : "Create SMS Automation Rule"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Trigger Event</label>
              <Select value={formData.trigger} onValueChange={(t) => setFormData({ ...formData, trigger: t })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a trigger" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.trigger && (
                <p className="text-xs text-muted-foreground mt-1">
                  {TRIGGER_DESCRIPTIONS[formData.trigger]}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">SMS Template</label>
              <Select
                value={formData.template_id}
                onValueChange={(id) => setFormData({ ...formData, template_id: id })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              />
              <label htmlFor="enabled" className="text-sm font-medium cursor-pointer">
                Enable this rule
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {editingId ? "Update" : "Create"} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}