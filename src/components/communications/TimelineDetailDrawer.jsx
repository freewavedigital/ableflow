import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import {
  Phone,
  MessageSquare,
  Mail,
  FileText,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Paperclip,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CallAudioPlayer from "./CallAudioPlayer";
import CallTranscriptViewer from "./CallTranscriptViewer";

const CHANNEL_COLORS = {
  call: "text-green-600",
  sms: "text-purple-600",
  email: "text-orange-600",
  note: "text-blue-600",
};

const CHANNEL_ICONS = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  note: FileText,
};

const CHANNEL_LABELS = {
  call: "Phone Call",
  sms: "SMS Message",
  email: "Email",
  note: "Note",
};

function CallDetail({ entry }) {
  const [activeTab, setActiveTab] = useState("details");

  const { data: recording } = useQuery({
    queryKey: ["recording", entry.recording_id],
    queryFn: () =>
      base44.entities.CallRecording.filter({ id: entry.recording_id }).then((r) => r[0]),
    enabled: !!entry.recording_id,
  });

  const { data: transcript } = useQuery({
    queryKey: ["transcript", entry.transcript_id],
    queryFn: () =>
      base44.entities.CallTranscript.filter({ id: entry.transcript_id }).then((r) => r[0]),
    enabled: !!entry.transcript_id,
  });

  const tabs = [
    { key: "details", label: "Details" },
    ...(recording ? [{ key: "audio", label: "Recording" }] : []),
    ...(transcript ? [{ key: "transcript", label: "Transcript" }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "details" && (
        <div className="space-y-3">
          <MetaGrid
            items={[
              { label: "Phone", value: entry.contact },
              { label: "Status", value: entry.call_status },
              {
                label: "Duration",
                value: entry.duration_seconds
                  ? `${Math.round(entry.duration_seconds / 60)} min`
                  : null,
              },
              { label: "Outcome", value: entry.outcome?.replace(/_/g, " ") },
            ]}
          />
          {entry.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Summary</p>
              <p className="text-sm bg-muted/30 rounded-lg p-3">{entry.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "audio" && recording && (
        <CallAudioPlayer recordingUrl={recording.file_url} fileName={recording.file_name} />
      )}

      {activeTab === "transcript" && transcript && (
        <CallTranscriptViewer
          transcript={transcript}
          callRecord={entry.callRecord}
          commRecord={entry.commRecord}
        />
      )}
    </div>
  );
}

function SMSDetail({ entry }) {
  return (
    <div className="space-y-3">
      <MetaGrid
        items={[
          { label: "Phone", value: entry.contact },
          { label: "Status", value: entry.delivery_status },
          { label: "Type", value: entry.message_type },
        ]}
      />
      {entry.content && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Message</p>
          <div className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{entry.content}</div>
        </div>
      )}
    </div>
  );
}

function EmailDetail({ entry }) {
  const [showBody, setShowBody] = useState(false);
  return (
    <div className="space-y-3">
      <MetaGrid
        items={[
          { label: "To", value: entry.contact },
          { label: "Subject", value: entry.subject },
          { label: "Status", value: entry.delivery_status },
        ]}
      />

      <div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setShowBody(!showBody)}
        >
          <span className="text-xs font-semibold text-muted-foreground">Message Body</span>
          <span className="text-xs">{showBody ? "Hide" : "Show"}</span>
        </Button>
        {showBody && (
          <div className="mt-2 text-sm bg-muted/30 rounded-lg p-3 max-h-64 overflow-y-auto">
            {entry.body_html ? (
              <div dangerouslySetInnerHTML={{ __html: entry.body_html }} className="prose prose-sm max-w-none" />
            ) : (
              <pre className="whitespace-pre-wrap font-sans">{entry.body_plain || "—"}</pre>
            )}
          </div>
        )}
      </div>

      {entry.attachments?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Attachments</p>
          <div className="space-y-1">
            {entry.attachments.map((att, i) => (
              <a
                key={i}
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Paperclip className="w-3 h-3" />
                {att.file_name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NoteDetail({ entry }) {
  return (
    <div className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">
      {entry.notes || "—"}
    </div>
  );
}

function MetaGrid({ items }) {
  const visible = items.filter((i) => i.value);
  if (!visible.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {visible.map((item) => (
        <div key={item.label} className="bg-card border border-border rounded-lg p-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">{item.label}</p>
          <p className="text-sm font-medium capitalize">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Drawer ─────────────────────────────────────────────────────────────────
export default function TimelineDetailDrawer({ entry, onClose }) {
  if (!entry) return null;

  const Icon = CHANNEL_ICONS[entry.channel] || FileText;
  const colorClass = CHANNEL_COLORS[entry.channel] || "text-muted-foreground";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-background shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colorClass} bg-muted/30`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{CHANNEL_LABELS[entry.channel]}</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.timestamp), "MMM d, yyyy · HH:mm")}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Direction + user */}
        <div className="px-5 py-2.5 border-b border-border bg-muted/20 flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {entry.direction === "inbound" ? (
              <><ArrowDownLeft className="w-3.5 h-3.5" /> Inbound</>
            ) : (
              <><ArrowUpRight className="w-3.5 h-3.5" /> Outbound</>
            )}
          </div>
          {entry.initiated_by && (
            <span className="text-xs text-muted-foreground">· {entry.initiated_by}</span>
          )}
          {entry.callRecord?.recording_id && (
            <Badge variant="outline" className="text-[10px] gap-1 ml-auto">
              <Mic className="w-3 h-3" /> Recorded
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {entry.channel === "call" && <CallDetail entry={entry} />}
          {entry.channel === "sms" && <SMSDetail entry={entry} />}
          {entry.channel === "email" && <EmailDetail entry={entry} />}
          {entry.channel === "note" && <NoteDetail entry={entry} />}
        </div>
      </div>
    </>
  );
}