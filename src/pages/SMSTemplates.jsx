import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SMSService } from "@/lib/smsService";
import PageHeader from "@/components/shared/PageHeader";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, MessageCircle, Trash2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

const CATEGORIES = [
  { value: "appointment", label: "Appointment" },
  { value: "reminder", label: "Reminder" },
  { value: "confirmation", label: "Confirmation" },
  { value: "quote", label: "Quote" },
  { value: "agreement", label: "Agreement" },
  { value: "invoice", label: "Invoice" },
  { value: "follow_up", label: "Follow Up" },
  { value: "emergency", label: "Emergency" },
  { value: "satisfaction", label: "Satisfaction" },
  { value: "other", label: "Other" },
];

export default function SMSTemplates() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "general",
    content: "",
    variables: [],
  });
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["sms-templates-all"],
    queryFn: async () => {
      const templates = await base44.entities.CommunicationTemplate.filter(
        { template_type: "sms", status: "active" },
        "-created_date",
        100
      );
      return templates;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        return base44.entities.CommunicationTemplate.update(editingId, data);
      }
      return base44.entities.CommunicationTemplate.create({
        ...data,
        template_type: "sms",
        status: "active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates-all"] });
      setOpen(false);
      setEditingId(null);
      setFormData({ name: "", category: "general", content: "", variables: [] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.CommunicationTemplate.update(id, { status: "archived" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates-all"] });
    },
  });

  const handleOpen = (template = null) => {
    if (template) {
      setEditingId(template.id);
      setFormData({
        name: template.name,
        category: template.category,
        content: template.content,
        variables: template.variables || [],
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", category: "general", content: "", variables: [] });
    }
    setOpen(true);
  };

  const extractVariables = (text) => {
    const regex = /\{\{(\w+)\}\}/g;
    const found = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
      found.add(match[1]);
    }
    return Array.from(found).map((name) => ({ name, description: "", example: "" }));
  };

  const handleSave = () => {
    const variables = extractVariables(formData.content);
    saveMutation.mutate({ ...formData, variables });
  };

  const categoryLabel = (cat) => CATEGORIES.find((c) => c.value === cat)?.label || cat;

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading templates...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="SMS Templates"
        subtitle="Manage reusable SMS message templates"
      >
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </PageHeader>

      {!templates?.length ? (
        <EmptyState icon={MessageCircle} title="No SMS templates yet">
          <Button onClick={() => handleOpen()} variant="outline" size="sm">
            Create First Template
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabel(template.category)}
                    </Badge>
                    {template.variables?.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {template.variables.length} variable{template.variables.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpen(template)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{template.content}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Template" : "Create SMS Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Job Reminder"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={formData.category}
                onValueChange={(cat) => setFormData({ ...formData, category: cat })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Message Template</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Use {{variable_name}} for dynamic content&#10;e.g., Hi {{customer_name}}, your appointment is on {{date}}"
                className="mt-1 h-24"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {{variable_name}} syntax for dynamic content
              </p>
            </div>

            {extractVariables(formData.content).length > 0 && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs font-semibold mb-2">Variables detected:</p>
                <div className="flex flex-wrap gap-1">
                  {extractVariables(formData.content).map((v) => (
                    <Badge key={v.name} variant="secondary" className="text-xs">
                      {v.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {editingId ? "Update" : "Create"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}