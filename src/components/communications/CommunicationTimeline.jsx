import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, isYesterday } from "date-fns";
import {
  Phone,
  MessageSquare,
  Mail,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Play,
  Mic,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TimelineDetailDrawer from "./TimelineDetailDrawer";

// ── Channel config ─────────────────────────────────────────────────────────
const CHANNEL = {
  call: {
    icon: Phone,
    label: "Call",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border-green-200",
  },
  sms: {
    icon: MessageSquare,
    label: "SMS",
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  email: {
    icon: Mail,
    label: "Email",
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
  },
  note: {
    icon: FileText,
    label: "Note",
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

function formatTimestamp(ts) {
  const d = new Date(ts);
  if (isToday(d)) return `Today · ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday · ${format(d, "HH:mm")}`;
  return format(d, "MMM d, yyyy · HH:mm");
}

function groupByDate(items) {
  const groups = {};
  items.forEach((item) => {
    const key = format(new Date(item.timestamp), "yyyy-MM-dd");
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.entries(groups).sort(([a], [b]) => (a < b ? 1 : -1));
}

function dateLabel(dateKey) {
  const d = new Date(dateKey + "T12:00:00");
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

// ── Single timeline entry ──────────────────────────────────────────────────
function TimelineEntry({ entry, onSelect }) {
  const cfg = CHANNEL[entry.channel] || CHANNEL.note;
  const Icon = cfg.icon;

  const summary = useMemo(() => {
    if (entry.channel === "call") {
      const parts = [];
      if (entry.duration_seconds) parts.push(`${Math.round(entry.duration_seconds / 60)} min`);
      if (entry.call_status && entry.call_status !== "answered") parts.push(entry.call_status);
      if (entry.outcome) parts.push(entry.outcome.replace(/_/g, " "));
      return parts.join(" · ") || entry.notes || "Call logged";
    }
    if (entry.channel === "sms") return entry.content || "SMS";
    if (entry.channel === "email") return entry.subject || "Email";
    if (entry.channel === "note") return entry.notes || "Note";
    return "";
  }, [entry]);

  const hasRecording = entry.channel === "call" && entry.recording_id;
  const hasTranscript = entry.channel === "call" && entry.transcript_id;

  return (
    <button
      onClick={() => onSelect(entry)}
      className="w-full text-left group"
    >
      <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-muted/40 transition-colors">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.badge} border`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-medium">{cfg.label}</span>

            {entry.direction === "inbound" ? (
              <ArrowDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}

            {entry.contact && (
              <span className="text-xs text-muted-foreground truncate">{entry.contact}</span>
            )}

            {hasRecording && (
              <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                <Play className="w-3 h-3" />
                Recording
              </span>
            )}
            {hasTranscript && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                <Mic className="w-3 h-3" />
                Transcript
              </span>
            )}
          </div>

          {summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">{summary}</p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">
              {formatTimestamp(entry.timestamp)}
            </span>
            {entry.initiated_by && (
              <span className="text-[10px] text-muted-foreground">· {entry.initiated_by}</span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5" />
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CommunicationTimeline({ entity_type, entity_id, compact = false }) {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Fetch comm records for this entity
  const { data: commRecords = [], isLoading: loadingComm } = useQuery({
    queryKey: ["comm-records", entity_type, entity_id],
    queryFn: () =>
      base44.entities.CommunicationRecord.filter(
        { entity_type, entity_id },
        "-timestamp",
        200
      ),
    enabled: !!entity_type && !!entity_id,
  });

  // Fetch type-specific records
  const { data: callRecords = [] } = useQuery({
    queryKey: ["call-records-all"],
    queryFn: () => base44.entities.CallRecord.list("-started_at", 200),
  });

  const { data: smsRecords = [] } = useQuery({
    queryKey: ["sms-records-all"],
    queryFn: () => base44.entities.SMSRecord.list("-sent_at", 200),
  });

  const { data: emailRecords = [] } = useQuery({
    queryKey: ["email-records-all"],
    queryFn: () => base44.entities.EmailRecord.list("-sent_at", 200),
  });

  // Normalize into a unified timeline
  const timeline = useMemo(() => {
    const entries = [];

    commRecords.forEach((comm) => {
      if (comm.communication_type === "call") {
        const call = callRecords.find((c) => c.communication_record_id === comm.id);
        entries.push({
          id: comm.id,
          channel: "call",
          timestamp: comm.timestamp,
          direction: comm.direction,
          contact: comm.contact_phone,
          initiated_by: comm.initiated_by,
          notes: comm.notes,
          commRecord: comm,
          // call-specific
          duration_seconds: call?.duration_seconds,
          call_status: call?.call_status,
          outcome: call?.outcome,
          recording_id: call?.recording_id,
          transcript_id: call?.transcript_id,
          callRecord: call,
        });
      } else if (comm.communication_type === "sms") {
        const sms = smsRecords.find((s) => s.communication_record_id === comm.id);
        entries.push({
          id: comm.id,
          channel: "sms",
          timestamp: comm.timestamp,
          direction: comm.direction,
          contact: comm.contact_phone,
          initiated_by: comm.initiated_by,
          content: sms?.content,
          delivery_status: sms?.delivery_status,
          message_type: sms?.message_type,
          commRecord: comm,
          smsRecord: sms,
        });
      } else if (comm.communication_type === "email") {
        const email = emailRecords.find((e) => e.communication_record_id === comm.id);
        entries.push({
          id: comm.id,
          channel: "email",
          timestamp: comm.timestamp,
          direction: comm.direction,
          contact: comm.contact_email,
          initiated_by: comm.initiated_by,
          subject: email?.subject,
          body_html: email?.body_html,
          body_plain: email?.body_plain,
          delivery_status: email?.delivery_status,
          attachments: email?.attachments,
          commRecord: comm,
          emailRecord: email,
        });
      } else {
        // notes / other
        entries.push({
          id: comm.id,
          channel: "note",
          timestamp: comm.timestamp,
          direction: comm.direction,
          initiated_by: comm.initiated_by,
          notes: comm.notes,
          commRecord: comm,
        });
      }
    });

    return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [commRecords, callRecords, smsRecords, emailRecords]);

  const COMPACT_LIMIT = 5;
  const displayTimeline = compact && !showAll ? timeline.slice(0, COMPACT_LIMIT) : timeline;
  const grouped = groupByDate(displayTimeline);

  if (loadingComm) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!timeline.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground/20 mb-2" />
        <p className="text-sm text-muted-foreground">No communications yet</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Calls, SMS, and emails will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {grouped.map(([dateKey, entries]) => (
          <div key={dateKey}>
            {/* Date group header */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {dateLabel(dateKey)}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground">{entries.length}</span>
            </div>

            {/* Entries */}
            <div className="space-y-0.5">
              {entries.map((entry) => (
                <TimelineEntry key={entry.id} entry={entry} onSelect={setSelectedEntry} />
              ))}
            </div>
          </div>
        ))}

        {/* Show more / less */}
        {compact && timeline.length > COMPACT_LIMIT && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowAll(!showAll)}
          >
            <ChevronDown
              className={`w-4 h-4 mr-1 transition-transform ${showAll ? "rotate-180" : ""}`}
            />
            {showAll
              ? "Show less"
              : `Show ${timeline.length - COMPACT_LIMIT} more`}
          </Button>
        )}
      </div>

      {/* Detail drawer */}
      <TimelineDetailDrawer
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </>
  );
}