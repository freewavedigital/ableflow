import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, isYesterday } from "date-fns";
import { Mic, Play, Search, Filter, Loader2, CheckCircle2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import CallAudioPlayer from "@/components/communications/CallAudioPlayer";

function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm");
}

function fmtDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CommsRecordings() {
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [search, setSearch] = useState("");
  const [transcriptionFilter, setTranscriptionFilter] = useState("all");

  const { data: recordings = [], isLoading: loadingRec } = useQuery({
    queryKey: ["call-recordings"],
    queryFn: () => base44.entities.CallRecording.list("-recording_started_at", 200),
  });
  const { data: callRecords = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["call-records"],
    queryFn: () => base44.entities.CallRecord.list("-started_at", 200),
  });

  const loading = loadingRec || loadingCalls;

  const filtered = useMemo(() => {
    return recordings
      .map(rec => ({ rec, callRecord: callRecords.find(c => c.id === rec.call_record_id) }))
      .filter(({ rec }) => {
        if (transcriptionFilter !== "all" && rec.transcription_status !== transcriptionFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!(rec.file_name || "").toLowerCase().includes(q)) return false;
        }
        return true;
      });
  }, [recordings, callRecords, search, transcriptionFilter]);

  const TRANSCRIPTION_BADGE = {
    completed: "bg-green-100 text-green-700",
    processing: "bg-amber-100 text-amber-700",
    pending: "bg-slate-100 text-slate-600",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title="Call Recordings" subtitle="Audio recordings from phone calls" />

      <div className="px-6 pb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search recordings…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={transcriptionFilter} onValueChange={setTranscriptionFilter}>
          <SelectTrigger className="w-44">
            <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Transcription" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All recordings</SelectItem>
            <SelectItem value="completed">Transcribed</SelectItem>
            <SelectItem value="pending">Pending transcription</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Mic className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No call recordings found</p>
            <p className="text-xs text-muted-foreground mt-1">Recordings are attached to call records automatically</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ rec, callRecord }) => {
              const tBadge = TRANSCRIPTION_BADGE[rec.transcription_status] || "bg-slate-100 text-slate-600";
              const isSelected = selectedRecording?.id === rec.id;
              return (
                <div key={rec.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-4 px-4 py-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Mic className="w-5 h-5 text-violet-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec.file_name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{fmtDuration(rec.duration_seconds)}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground">{fmtSize(rec.file_size_bytes)}</span>
                        {rec.file_format && <span className="text-xs text-muted-foreground uppercase">{rec.file_format}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-xs border-0 ${tBadge}`}>{rec.transcription_status || "pending"}</Badge>
                      {rec.quality_score && (
                        <Badge variant="outline" className="text-xs">Q: {rec.quality_score}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setSelectedRecording(isSelected ? null : rec)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="Play recording"
                      >
                        <Play className="w-4 h-4 text-primary" />
                      </button>
                      {rec.file_url && (
                        <a href={rec.file_url} download className="p-2 rounded-lg hover:bg-muted transition-colors" title="Download">
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground hidden md:block flex-shrink-0">
                      {fmtTime(rec.recording_started_at)}
                    </p>
                  </div>
                  {isSelected && rec.file_url && (
                    <div className="border-t border-border px-4 py-3 bg-muted/30">
                      <CallAudioPlayer recordingId={rec.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}