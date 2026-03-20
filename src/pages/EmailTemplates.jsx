import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
import { Plus, Edit2, Trash2, Mail } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

const CATEGORIES = [
  { value: "appointment", label: "Appointment" },
  { value: "reminder", label: "Reminder" },
  { value: "confirmation", label: "Confirmation" },
  { value: "quote", label: "Quote" },
  { value: "agreement", label: "Agreement" },
  { value: "invoice", label: "Invoice" },
  { value: "follow_up", label: "Follow Up" },
  { value: "satisfaction", label: "Satisfaction" },
  { value: "other", label: "Other" },
];

const DEFAULT_FORM = {
  name: "",
  category: "other",
  content: "",
  subject: "",
  body_html: "",
};

function extractVariables(text) {
  const regex = /\{\{(\w+)\}\}/g;
  const found = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) found.add(match[1]);
  return Array.from(found).map((name) => ({ name, description: "", example: "" }));
}

export default function EmailTemplates() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates-all"],
    queryFn: () =>
      base44.entities.CommunicationTemplate.filter(
        { template_type: "email", status: "active" },
        "-created_date",
        100
      ),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        template_type: "email",
        status: "active",
        for_email_only: { subject: data.subject, body_html: data.body_html },
        variables: extractVariables(`${data.subject} ${data.body_html}`),
      };
      return editingId
        ? base44.entities.CommunicationTemplate.update(editingId, payload)
        : base44.entities.CommunicationTemplate.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates-all"] });
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setOpen(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.CommunicationTemplate.update(id, { status: "archived" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-templates-all"] }),
  });

  const handleOpen = (template = null) => {
    if (template) {
      setEditingId(template.id);
      setForm({
        name: template.name,
        category: template.category,
        content: template.content || "",
        subject: template.for_email_only?.subject || "",
        body_html: template.for_email_only?.body_html || template.content || "",
      });
    } else {
      setEditingId(null);
      setForm(DEFAULT_FORM);
    }
    setOpen(true);
  };

  const categoryLabel = (cat) => CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Email Templates" subtitle="Manage reusable email templates">
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : !templates?.length ? (
        <EmptyState icon={Mail} title="No email templates yet">
          <Button onClick={() => handleOpen()} variant="outline" size="sm">
            Create First Template
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabel(t.category)}
                    </Badge>
                    {t.variables?.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t.variables.length} variable{t.variables.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleOpen(t)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {t.for_email_only?.subject && (
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Subject: {t.for_email_only.subject}
                </p>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {t.for_email_only?.body_html?.replace(/<[^>]*>/g, "") || t.content}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "New Email Template"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Booking Confirmation"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={form.category} onValueChange={(cat) => setForm({ ...form, category: cat })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Subject Line</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g., Your Booking is Confirmed – {{date}}"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email Body</label>
              <Textarea
                value={form.body_html}
                onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                placeholder={`Hi {{customer_name}},\n\nYour appointment is confirmed for {{date}} at {{time}}.\n\nKind regards,\nAble Leak Detection`}
                className="mt-1 h-40"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {"{{variable_name}}"} for dynamic content
              </p>
            </div>

            {extractVariables(`${form.subject} ${form.body_html}`).length > 0 && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs font-semibold mb-2">Variables detected:</p>
                <div className="flex flex-wrap gap-1">
                  {extractVariables(`${form.subject} ${form.body_html}`).map((v) => (
                    <Badge key={v.name} variant="secondary" className="text-xs">
                      {v.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {editingId ? "Update" : "Create"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}