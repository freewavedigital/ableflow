import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, isYesterday } from "date-fns";
import {
  Phone, PhoneMissed, ArrowDownLeft, ArrowUpRight,
  Plus, Search, Filter, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import CallLogger from "@/components/communications/CallLogger";
import TimelineDetailDrawer from "@/components/communications/TimelineDetailDrawer";

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

const STATUS_STYLES = {
  answered:   { label: "Answered",   color: "bg-green-100 text-green-700" },
  missed:     { label: "Missed",     color: "bg-red-100 text-red-700" },
  voicemail:  { label: "Voicemail",  color: "bg-violet-100 text-violet-700" },
  no_answer:  { label: "No Answer",  color: "bg-amber-100 text-amber-700" },
  rejected:   { label: "Rejected",   color: "bg-slate-100 text-slate-700" },
  busy:       { label: "Busy",       color: "bg-orange-100 text-orange-700" },
};

export default function CommsCalls() {
  const [showLogger, setShowLogger] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");

  const { data: callRecords = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["call-records"],
    queryFn: () => base44.entities.CallRecord.list("-started_at", 200),
  });
  const { data: commRecords = [], isLoading: loadingComm } = useQuery({
    queryKey: ["communications"],
    queryFn: () => base44.entities.CommunicationRecord.list("-timestamp", 200),
  });

  const loading = loadingCalls || loadingComm;

  const filtered = useMemo(() => {
    return callRecords
      .map(call => ({ call, commRecord: commRecords.find(c => c.id === call.communication_record_id) }))
      .filter(({ call, commRecord }) => {
        if (statusFilter !== "all" && call.call_status !== statusFilter) return false;
        if (directionFilter !== "all" && commRecord?.direction !== directionFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const name = (commRecord?.contact_name || "").toLowerCase();
          const phone = (call.phone_number || "").toLowerCase();
          if (!name.includes(q) && !phone.includes(q)) return false;
        }
        return true;
      });
  }, [callRecords, commRecords, search, statusFilter, directionFilter]);

  function toEntry(call, commRecord) {
    return { id: commRecord?.id, channel: "call", timestamp: call.started_at, direction: commRecord?.direction, contact: call.phone_number, duration_seconds: call.duration_seconds, call_status: call.call_status, outcome: call.outcome, recording_id: call.recording_id, transcript_id: call.transcript_id, callRecord: call, commRecord, notes: commRecord?.notes };
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title="Calls" subtitle="All inbound and outbound phone calls">
        <Button size="sm" className="gap-1" onClick={() => setShowLogger(true)}>
          <Plus className="w-4 h-4" /> Log Call
        </Button>
      </PageHeader>

      <div className="px-6 pb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or number…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
            <SelectItem value="no_answer">No Answer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directions</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No calls match your filters</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {filtered.map(({ call, commRecord }) => {
              const missed = call.call_status === "missed" || call.call_status === "no_answer";
              const st = STATUS_STYLES[call.call_status] || { label: call.call_status, color: "bg-slate-100 text-slate-700" };
              return (
                <button
                  key={call.id}
                  onClick={() => setSelectedEntry(toEntry(call, commRecord))}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${missed ? "bg-red-100" : "bg-primary/10"}`}>
                    {missed ? <PhoneMissed className="w-4 h-4 text-red-500" />
                      : commRecord?.direction === "inbound"
                        ? <ArrowDownLeft className="w-4 h-4 text-primary" />
                        : <ArrowUpRight className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{commRecord?.contact_name || call.phone_number}</p>
                    <p className="text-xs text-muted-foreground">{call.phone_number}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-xs ${st.color} border-0`}>{st.label}</Badge>
                    {commRecord?.direction && (
                      <Badge variant="outline" className="text-xs capitalize">{commRecord.direction}</Badge>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 hidden md:block">
                    <p className="text-xs font-medium text-muted-foreground">{fmtDuration(call.duration_seconds)}</p>
                    {call.outcome && <p className="text-[10px] text-muted-foreground capitalize">{call.outcome.replace(/_/g, " ")}</p>}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex-shrink-0">{fmtTime(call.started_at)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CallLogger open={showLogger} onOpenChange={setShowLogger} />
      <TimelineDetailDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}