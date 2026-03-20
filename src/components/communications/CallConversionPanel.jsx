import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Briefcase, ClipboardList, Link2, ChevronRight, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// ── Conversion action definitions ─────────────────────────────────────────
const ACTIONS = [
  {
    key: "new_lead",
    icon: UserPlus,
    label: "Create New Lead",
    description: "Log this caller as a new enquiry",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    key: "attach_client",
    icon: Link2,
    label: "Attach to Client",
    description: "Link call to an existing client record",
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    key: "create_job",
    icon: Briefcase,
    label: "Create Job",
    description: "Schedule a job from this call",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    key: "create_task",
    icon: ClipboardList,
    label: "Create Follow-up Task",
    description: "Remind staff to follow up",
    color: "text-green-600 bg-green-50 border-green-200",
  },
];

// ── Sub-forms ─────────────────────────────────────────────────────────────

function NewLeadForm({ callRecord, commRecord, onDone, onCancel }) {
  const [form, setForm] = useState({
    contact_name: commRecord?.contact_name || "",
    contact_phone: callRecord?.phone_number || "",
    contact_email: commRecord?.contact_email || "",
    service_type: "leak_inspection",
    issue_summary: commRecord?.notes || "",
  });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const lead = await base44.entities.Enquiry.create({
        ...form,
        source: "phone",
        status: "contact_made",
      });
      // Link call to this lead
      await base44.entities.CommunicationRecord.update(commRecord.id, {
        entity_type: "lead",
        entity_id: lead.id,
        contact_name: form.contact_name,
      });
      return lead;
    },
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ["enquiries", "communications"] });
      toast.success("Lead created and call linked");
      onDone({ type: "lead", record: lead });
    },
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
          <Input
            placeholder="Jane Smith"
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
          <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
        <Input placeholder="jane@example.com" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Service Required</label>
        <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="leak_inspection">Leak Inspection</SelectItem>
            <SelectItem value="structural_inspection">Structural Inspection</SelectItem>
            <SelectItem value="pressure_test">Pressure Test</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="domestic_inspection">Domestic Inspection</SelectItem>
            <SelectItem value="service_call">Service Call</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Issue Summary</label>
        <Textarea
          placeholder="What did the caller describe?"
          className="h-20 resize-none"
          value={form.issue_summary}
          onChange={(e) => setForm({ ...form, issue_summary: e.target.value })}
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!form.contact_name || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Create Lead
        </Button>
      </div>
    </div>
  );
}

function AttachClientForm({ callRecord, commRecord, onDone, onCancel }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CommunicationRecord.update(commRecord.id, {
        entity_type: "client",
        entity_id: selectedId,
        client_id: selectedId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communications"] });
      toast.success("Call attached to client");
      onDone({ type: "client" });
    },
  });

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No clients found</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors ${
                selectedId === c.id
                  ? "bg-primary/10 border-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {(c.first_name?.[0] || "?").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{c.first_name} {c.last_name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </div>
              {selectedId === c.id && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />}
            </button>
          ))
        )}
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!selectedId || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Attach Client
        </Button>
      </div>
    </div>
  );
}

function CreateJobForm({ callRecord, commRecord, onDone, onCancel }) {
  const [form, setForm] = useState({
    contact_name: commRecord?.contact_name || "",
    contact_phone: callRecord?.phone_number || "",
    site_address: "",
    job_type: "leak_inspection",
    scheduled_date: "",
    job_notes: commRecord?.notes || "",
  });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const job = await base44.entities.Job.create({
        ...form,
        status: "scheduled",
        priority: "normal",
      });
      // Link call to job
      await base44.entities.CommunicationRecord.update(commRecord.id, {
        entity_type: "job",
        entity_id: job.id,
      });
      return job;
    },
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ["jobs", "communications"] });
      toast.success("Job created and call linked");
      onDone({ type: "job", record: job });
    },
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Name *</label>
          <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
          <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Site Address *</label>
        <Input placeholder="123 Main St, Suburb" value={form.site_address} onChange={(e) => setForm({ ...form, site_address: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Type</label>
          <Select value={form.job_type} onValueChange={(v) => setForm({ ...form, job_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="leak_inspection">Leak Inspection</SelectItem>
              <SelectItem value="structural_inspection">Structural Inspection</SelectItem>
              <SelectItem value="pressure_test">Pressure Test</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="domestic_inspection">Domestic Inspection</SelectItem>
              <SelectItem value="service_call">Service Call</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Scheduled Date</label>
          <Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Job Notes</label>
        <Textarea className="h-16 resize-none" value={form.job_notes} onChange={(e) => setForm({ ...form, job_notes: e.target.value })} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!form.contact_name || !form.site_address || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Create Job
        </Button>
      </div>
    </div>
  );
}

function CreateTaskForm({ callRecord, commRecord, onDone, onCancel }) {
  const [form, setForm] = useState({
    title: `Follow up: ${commRecord?.contact_name || callRecord?.phone_number || "Unknown caller"}`,
    description: commRecord?.notes || "",
    due_date: "",
    priority: "normal",
  });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await base44.entities.TaskReminder.create({
        ...form,
        status: "pending",
        related_entity_type: commRecord?.entity_type || "call",
        related_entity_id: commRecord?.entity_id || commRecord?.id,
        source: "call",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Follow-up task created");
      onDone({ type: "task" });
    },
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Task Title *</label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
        <Textarea
          className="h-16 resize-none"
          placeholder="What needs to be done?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
          <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
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
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!form.title || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Create Task
        </Button>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────
export default function CallConversionPanel({ open, onOpenChange, callRecord, commRecord, isUnknownCaller = false }) {
  const [activeAction, setActiveAction] = useState(isUnknownCaller ? "new_lead" : null);
  const [completedActions, setCompletedActions] = useState([]);

  const handleDone = (result) => {
    setCompletedActions((prev) => [...prev, result.type]);
    setActiveAction(null);
  };

  const handleClose = () => {
    setActiveAction(null);
    setCompletedActions([]);
    onOpenChange(false);
  };

  if (!callRecord || !commRecord) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Call</DialogTitle>
          <DialogDescription>
            {isUnknownCaller
              ? "Unknown caller — create a lead or attach to an existing client."
              : `${commRecord.contact_name || callRecord.phone_number} · Choose an action`}
          </DialogDescription>
        </DialogHeader>

        {/* Unknown caller warning */}
        {isUnknownCaller && !activeAction && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <span>This caller isn't linked to any record. Create a new lead or attach to a client before logging their work.</span>
          </div>
        )}

        {/* Action picker */}
        {!activeAction && (
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const done = completedActions.includes(action.key.replace("new_", "").replace("attach_", "").replace("create_", ""));
              return (
                <button
                  key={action.key}
                  onClick={() => setActiveAction(action.key)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all hover:shadow-sm ${action.color}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold flex-1">{action.label}</span>
                    {done ? <Check className="w-4 h-4 text-green-600" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                  </div>
                  <p className="text-xs opacity-70">{action.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-forms */}
        {activeAction === "new_lead" && (
          <NewLeadForm
            callRecord={callRecord}
            commRecord={commRecord}
            onDone={handleDone}
            onCancel={() => setActiveAction(null)}
          />
        )}
        {activeAction === "attach_client" && (
          <AttachClientForm
            callRecord={callRecord}
            commRecord={commRecord}
            onDone={handleDone}
            onCancel={() => setActiveAction(null)}
          />
        )}
        {activeAction === "create_job" && (
          <CreateJobForm
            callRecord={callRecord}
            commRecord={commRecord}
            onDone={handleDone}
            onCancel={() => setActiveAction(null)}
          />
        )}
        {activeAction === "create_task" && (
          <CreateTaskForm
            callRecord={callRecord}
            commRecord={commRecord}
            onDone={handleDone}
            onCancel={() => setActiveAction(null)}
          />
        )}

        {/* Completed summary */}
        {completedActions.length > 0 && !activeAction && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <Check className="w-3.5 h-3.5" />
            Completed: {completedActions.join(", ")}
          </div>
        )}

        {!activeAction && (
          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}