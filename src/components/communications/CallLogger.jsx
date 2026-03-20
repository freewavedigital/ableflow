import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, Search, X, Upload, Music } from "lucide-react";
import { toast } from "sonner";

// ── Entity search for linking ─────────────────────────────────────────────
function EntitySearch({ value, onChange }) {
  const [query, setQuery] = useState("");

  const { data: leads = [] } = useQuery({
    queryKey: ["enquiries-search"],
    queryFn: () => base44.entities.Enquiry.list("-created_date", 50),
  });
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs-search"],
    queryFn: () => base44.entities.Job.list("-created_date", 50),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-search"],
    queryFn: () => base44.entities.Client.list("-created_date", 50),
  });

  const q = query.toLowerCase();
  const results = q.length < 2 ? [] : [
    ...leads
      .filter(l => (l.contact_name || "").toLowerCase().includes(q) || (l.contact_phone || "").includes(q))
      .slice(0, 4)
      .map(l => ({ type: "lead", id: l.id, label: l.contact_name || "Lead", sub: l.reference_number || l.service_type })),
    ...jobs
      .filter(j => (j.contact_name || "").toLowerCase().includes(q) || (j.job_number || "").toLowerCase().includes(q))
      .slice(0, 4)
      .map(j => ({ type: "job", id: j.id, label: j.contact_name || "Job", sub: j.job_number || j.job_type })),
    ...clients
      .filter(c => (`${c.first_name} ${c.last_name}`).toLowerCase().includes(q) || (c.phone || "").includes(q))
      .slice(0, 4)
      .map(c => ({ type: "client", id: c.id, label: `${c.first_name} ${c.last_name}`, sub: c.phone })),
  ];

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-muted/40">
        <span className="text-xs font-semibold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">{value.type}</span>
        <span className="flex-1 text-sm truncate">{value.label}</span>
        <button onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <Input
        className="pl-8 h-9"
        placeholder="Search lead, job or client…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {results.map(r => (
            <button
              key={`${r.type}-${r.id}`}
              type="button"
              onClick={() => { onChange(r); setQuery(""); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sm"
            >
              <span className="text-[10px] font-semibold uppercase text-muted-foreground w-10 flex-shrink-0">{r.type}</span>
              <span className="flex-1 truncate font-medium">{r.label}</span>
              <span className="text-xs text-muted-foreground truncate">{r.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline audio file picker (no callRecord needed yet) ───────────────────
function AudioFilePicker({ file, onChange }) {
  if (file) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-muted/40">
        <Music className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="flex-1 text-sm truncate">{file.name}</span>
        <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  return (
    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 transition-colors">
      <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm text-muted-foreground">Attach recording (optional)</span>
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={e => onChange(e.target.files[0] || null)}
      />
    </label>
  );
}

// ── Main CallLogger ────────────────────────────────────────────────────────
export default function CallLogger({ open, onOpenChange, onSuccess, defaultEntity }) {
  const [linkedEntity, setLinkedEntity] = useState(defaultEntity || null);
  const [direction, setDirection] = useState("outbound");
  const [phone, setPhone] = useState("");
  const [callStatus, setCallStatus] = useState("answered");
  const [durationMins, setDurationMins] = useState(0);
  const [summary, setSummary] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!linkedEntity) throw new Error("Please link this call to a lead, job, or client.");
      if (!phone.trim()) throw new Error("Phone number is required.");

      // 1. Create CommunicationRecord (the anchor)
      const commRecord = await base44.entities.CommunicationRecord.create({
        communication_type: "call",
        entity_type: linkedEntity.type,
        entity_id: linkedEntity.id,
        direction,
        contact_phone: phone,
        contact_name: linkedEntity.label,
        timestamp: new Date().toISOString(),
        status: "completed",
        notes: summary,
      });

      // 2. Create CallRecord
      const callRecord = await base44.entities.CallRecord.create({
        communication_record_id: commRecord.id,
        phone_number: phone,
        duration_seconds: durationMins * 60,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        call_status: callStatus,
        summary,
      });

      // 3. Upload recording if provided
      if (audioFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
        const recording = await base44.entities.CallRecording.create({
          call_record_id: callRecord.id,
          file_url,
          file_name: audioFile.name,
          file_format: audioFile.name.split(".").pop().toLowerCase(),
          file_size_bytes: audioFile.size,
          transcription_status: "pending",
        });
        await base44.entities.CallRecord.update(callRecord.id, { recording_id: recording.id });
      }

      return { commRecord, callRecord };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communications"] });
      qc.invalidateQueries({ queryKey: ["call-records"] });
      qc.invalidateQueries({ queryKey: ["comm-records", linkedEntity?.type, linkedEntity?.id] });
      toast.success("Call logged");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message || "Failed to log call"),
  });

  function resetForm() {
    setLinkedEntity(defaultEntity || null);
    setDirection("outbound");
    setPhone("");
    setCallStatus("answered");
    setDurationMins(0);
    setSummary("");
    setAudioFile(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Call</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">

          {/* Entity link — required */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Link to <span className="text-destructive">*</span>
            </label>
            <EntitySearch value={linkedEntity} onChange={setLinkedEntity} />
            {!linkedEntity && (
              <p className="text-xs text-muted-foreground mt-1">Required — select the lead, job, or client this call relates to.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Direction</label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <Select value={callStatus} onValueChange={setCallStatus}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone Number</label>
              <Input className="h-9" placeholder="+61 4xx xxx xxx" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
              <Input type="number" min="0" className="h-9" value={durationMins} onChange={e => setDurationMins(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <Textarea placeholder="What was discussed…" value={summary} onChange={e => setSummary(e.target.value)} className="h-20 resize-none" />
          </div>

          {/* Recording upload — Fix B */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Recording</label>
            <AudioFilePicker file={audioFile} onChange={setAudioFile} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Log Call
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}