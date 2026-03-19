import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JOB_TEMPLATES } from "@/lib/jobTemplates";
import { CheckCircle2, AlertCircle, Loader2, Upload, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FIELD_TYPE_COLORS = {
  text:       "bg-slate-100 text-slate-700",
  textarea:   "bg-blue-50 text-blue-700",
  number:     "bg-indigo-50 text-indigo-700",
  yes_no:     "bg-green-50 text-green-700",
  pass_fail:  "bg-emerald-50 text-emerald-700",
  select:     "bg-purple-50 text-purple-700",
  checkbox:   "bg-amber-50 text-amber-700",
  photo:      "bg-orange-50 text-orange-700",
  date:       "bg-cyan-50 text-cyan-700",
  result:     "bg-rose-50 text-rose-700",
  materials:  "bg-teal-50 text-teal-700",
};

function SectionPreview({ section }) {
  const [open, setOpen] = useState(false);
  const isMaterials = section.section_type === "materials";

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <span className="font-medium text-sm">{section.title}</span>
          {isMaterials && <Badge variant="outline" className="text-xs">Materials Table</Badge>}
          {!isMaterials && <span className="text-xs text-muted-foreground">({section.fields?.length || 0} fields)</span>}
        </div>
        <span className="text-xs text-muted-foreground">§{section.order}</span>
      </button>

      {open && !isMaterials && (
        <div className="divide-y divide-border">
          {section.fields?.map((field) => (
            <div key={field.field_id} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FIELD_TYPE_COLORS[field.type] || "bg-muted text-muted-foreground"}`}>
                {field.type}
              </span>
              <span className="flex-1 text-sm">{field.label}</span>
              <div className="flex items-center gap-2">
                {field.required && <span className="text-xs text-destructive font-medium">required</span>}
                {field.visible_client ? (
                  <Eye className="w-3.5 h-3.5 text-green-600" title="Visible in client report" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-muted-foreground" title="Internal only" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && isMaterials && (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          Renders a materials-used table with item name, quantity, and cost per line.
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, isSeeded, onSeed, seeding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${isSeeded ? "border-green-300 bg-green-50/30" : "border-border bg-card"}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-semibold text-base">{template.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
          </div>
          {isSeeded ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Seeded
            </span>
          ) : (
            <Button
              size="sm"
              onClick={onSeed}
              disabled={seeding}
              className="flex-shrink-0"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Seed
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded-lg">
            🕐 {template.estimated_duration_hours}h
          </span>
          {template.default_price > 0 && (
            <span className="px-2 py-1 bg-muted rounded-lg">
              💲{template.default_price}
            </span>
          )}
          <span className="px-2 py-1 bg-muted rounded-lg">
            {template.sections?.length} sections
          </span>
          <span className="px-2 py-1 bg-muted rounded-lg">
            {template.sections?.reduce((n, s) => n + (s.fields?.length || 0), 0)} fields
          </span>
          <span className="px-2 py-1 bg-muted rounded-lg font-mono">
            {template.job_type_key}
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-xs text-primary font-medium flex items-center gap-1"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {expanded ? "Hide" : "Preview"} form structure
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-2 bg-background">
          {template.sections?.map((section) => (
            <SectionPreview key={section.section_id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function JobTemplates() {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(null);
  const [seedAllLoading, setSeedAllLoading] = useState(false);

  const { data: existingTemplates = [] } = useQuery({
    queryKey: ["job-templates-all"],
    queryFn: () => base44.entities.JobTypeTemplate.list(),
  });

  const seedMutation = useMutation({
    mutationFn: (template) => base44.entities.JobTypeTemplate.create(template),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-templates-all"] }),
  });

  const handleSeed = async (template) => {
    setSeeding(template.name);
    await seedMutation.mutateAsync(template);
    setSeeding(null);
  };

  const handleSeedAll = async () => {
    setSeedAllLoading(true);
    for (const t of JOB_TEMPLATES) {
      const already = existingTemplates.find((e) => e.name === t.name);
      if (!already) {
        await seedMutation.mutateAsync(t);
      }
    }
    setSeedAllLoading(false);
  };

  const unseededCount = JOB_TEMPLATES.filter(
    (t) => !existingTemplates.find((e) => e.name === t.name)
  ).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Job Type Templates</h1>
        <p className="text-muted-foreground mt-1">
          Define the dynamic form structure for each job type. Seed templates once to activate them.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-muted/40 rounded-xl text-xs space-y-2">
        <p className="font-semibold text-foreground">Field type legend</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(FIELD_TYPE_COLORS).map(([type, cls]) => (
            <span key={type} className={`px-2 py-0.5 rounded-full font-medium ${cls}`}>{type}</span>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-1">
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-green-600" /> Visible in client report</span>
          <span className="flex items-center gap-1"><EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> Internal only</span>
        </div>
      </div>

      {/* Seed All */}
      {unseededCount > 0 && (
        <div className="mb-6 flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div>
            <p className="font-medium text-sm">{unseededCount} template{unseededCount > 1 ? "s" : ""} not yet seeded</p>
            <p className="text-xs text-muted-foreground mt-0.5">Seed all to activate the full form system</p>
          </div>
          <Button onClick={handleSeedAll} disabled={seedAllLoading}>
            {seedAllLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Upload className="w-4 h-4 mr-1.5" />}
            Seed All
          </Button>
        </div>
      )}

      {unseededCount === 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" />
          All templates seeded — form system is active
        </div>
      )}

      {/* Template cards */}
      <div className="space-y-4">
        {JOB_TEMPLATES.map((template) => {
          const isSeeded = !!existingTemplates.find((e) => e.name === template.name);
          return (
            <TemplateCard
              key={template.name}
              template={template}
              isSeeded={isSeeded}
              onSeed={() => handleSeed(template)}
              seeding={seeding === template.name}
            />
          );
        })}
      </div>

      {/* Note about duplicate job_type_key */}
      <div className="mt-8 p-4 border border-border rounded-xl text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Note: repair has two templates</p>
        <p>
          "Repair Quote" and "Repair Job" both use the <code className="bg-muted px-1 rounded">repair</code> job_type_key.
          The form renderer picks the <strong>first active match</strong>. In future, jobs can carry a <code className="bg-muted px-1 rounded">template_id</code> to resolve this directly.
        </p>
      </div>
    </div>
  );
}