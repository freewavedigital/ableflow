import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageSquare, Mail, X, Plus, ArrowUpRight, ArrowDownLeft, Play, Mic } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import CommunicationStats from "@/components/communications/CommunicationStats";
import CallLogger from "@/components/communications/CallLogger";
import TimelineDetailDrawer from "@/components/communications/TimelineDetailDrawer";

const CHANNEL_ICONS = {
  call: Phone,
  phone: Phone,
  sms: MessageSquare,
  email: Mail,
};

const CHANNEL_LABELS = {
  call: "Call", phone: "Call", sms: "SMS", email: "Email",
};

// Inline hub timeline — uses pre-fetched data and applies hub filters
function HubTimeline({ commRecords, callRecords, smsMessages, emailMessages, filterChannel, filterEntity, searchQuery, sortBy, getEntityLabel }) {
  const [selectedEntry, setSelectedEntry] = useState(null);

  const timeline = useMemo(() => {
    const entries = [];
    commRecords.forEach((comm) => {
      const channel = comm.communication_type === "call" ? "call" : comm.communication_type;
      const call = channel === "call" ? callRecords.find((c) => c.communication_record_id === comm.id) : null;
      const sms = channel === "sms" ? smsMessages.find((s) => s.communication_record_id === comm.id) : null;
      const email = channel === "email" ? emailMessages.find((e) => e.communication_record_id === comm.id) : null;

      entries.push({
        id: comm.id,
        channel,
        timestamp: comm.timestamp,
        direction: comm.direction,
        contact: comm.contact_phone || comm.contact_email,
        initiated_by: comm.initiated_by,
        notes: comm.notes,
        commRecord: comm,
        // call fields
        duration_seconds: call?.duration_seconds,
        call_status: call?.call_status,
        outcome: call?.outcome,
        recording_id: call?.recording_id,
        transcript_id: call?.transcript_id,
        callRecord: call,
        // sms fields
        content: sms?.content,
        delivery_status: sms?.delivery_status || email?.delivery_status,
        message_type: sms?.message_type,
        smsRecord: sms,
        // email fields
        subject: email?.subject,
        body_html: email?.body_html,
        body_plain: email?.body_plain,
        attachments: email?.attachments,
        emailRecord: email,
      });
    });

    let filtered = entries;

    if (filterChannel !== "all") {
      filtered = filtered.filter((e) => e.channel === filterChannel || (filterChannel === "phone" && e.channel === "call"));
    }
    if (filterEntity !== "all") {
      filtered = filtered.filter((e) => e.commRecord?.entity_type === filterEntity);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.contact?.toLowerCase().includes(q) ||
          e.subject?.toLowerCase().includes(q) ||
          e.content?.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.timestamp) - new Date(b.timestamp)
        : new Date(b.timestamp) - new Date(a.timestamp)
    );

    return filtered;
  }, [commRecords, callRecords, smsMessages, emailMessages, filterChannel, filterEntity, searchQuery, sortBy]);

  if (!timeline.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-muted-foreground">No communications found</p>
        <p className="text-xs text-muted-foreground mt-1">Log a call or send an SMS or email to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {timeline.map((entry) => {
          const Icon = CHANNEL_ICONS[entry.channel] || MessageSquare;
          const entityLabel = getEntityLabel(entry.commRecord || {});
          const summary =
            entry.channel === "call"
              ? [entry.duration_seconds && `${Math.round(entry.duration_seconds / 60)} min`, entry.outcome?.replace(/_/g, " ")].filter(Boolean).join(" · ") || entry.notes
              : entry.channel === "sms" ? entry.content
              : entry.channel === "email" ? entry.subject
              : entry.notes;

          return (
            <button
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="w-full text-left bg-card border border-border rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-semibold">{CHANNEL_LABELS[entry.channel]}</span>
                    {entry.direction === "inbound"
                      ? <ArrowDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    {entry.contact && <span className="text-xs text-muted-foreground truncate">{entry.contact}</span>}
                    {entry.recording_id && <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><Play className="w-3 h-3" />Recording</span>}
                    {entry.transcript_id && <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5"><Mic className="w-3 h-3" />Transcript</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{entityLabel}</p>
                  {summary && <p className="text-xs text-foreground/70 line-clamp-1">{summary}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1.5">{format(new Date(entry.timestamp), "MMM d, yyyy · HH:mm")}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <TimelineDetailDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </>
  );
}

export default function Communications() {
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);

  // Fetch all communication records
  const { data: commRecords = [], isLoading: loadingComm } = useQuery({
    queryKey: ["communications"],
    queryFn: () => base44.entities.CommunicationRecord.list("-timestamp", 100),
  });

  const { data: callRecords = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["call-records"],
    queryFn: () => base44.entities.CallRecord.list("-started_at", 100),
  });

  const { data: smsMessages = [], isLoading: loadingSMS } = useQuery({
    queryKey: ["sms-messages"],
    queryFn: () => base44.entities.SMSRecord.list("-sent_at", 100),
  });

  const { data: emailMessages = [], isLoading: loadingEmails } = useQuery({
    queryKey: ["email-messages"],
    queryFn: () => base44.entities.EmailRecord.list("-sent_at", 100),
  });

  // Fetch related records for context
  const { data: enquiries = [] } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => base44.entities.Enquiry.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  // Normalize all communications into a unified format
  const allCommunications = useMemo(() => {
    // Build call details from records
    const callDetails = callRecords.map((call) => {
      const comm = commRecords.find((c) => c.id === call.communication_record_id);
      return {
        ...call,
        ...comm,
        channel: "phone",
        timestamp: call.started_at,
        contact: call.phone_number,
        commRecord: comm,
      };
    });

    const smsDetails = smsMessages.map((msg) => {
      const comm = commRecords.find((c) => c.id === msg.communication_record_id);
      return {
        ...msg,
        ...comm,
        channel: "sms",
        timestamp: msg.sent_at,
        contact: msg.phone_number,
        commRecord: comm,
      };
    });

    const emailDetails = emailMessages.map((msg) => {
      const comm = commRecords.find((c) => c.id === msg.communication_record_id);
      return {
        ...msg,
        ...comm,
        channel: "email",
        timestamp: msg.sent_at,
        contact: msg.recipient_email,
        commRecord: comm,
      };
    });

    const comms = [...callDetails, ...smsDetails, ...emailDetails];

    // Apply filters
    let filtered = comms;

    if (filterChannel !== "all") {
      filtered = filtered.filter((c) => c.channel === filterChannel);
    }

    if (filterEntity !== "all") {
      filtered = filtered.filter((c) => c.entity_type === filterEntity);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.contact?.toLowerCase().includes(q) ||
          c.subject?.toLowerCase().includes(q) ||
          c.content?.toLowerCase().includes(q) ||
          c.notes?.toLowerCase().includes(q) ||
          c.phone_number?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    return filtered;
  }, [callRecords, commRecords, smsMessages, emailMessages, filterChannel, filterEntity, searchQuery, sortBy]);

  const isLoading = loadingComm || loadingCalls || loadingSMS || loadingEmails;

  const getEntityLabel = (comm) => {
    if (comm.entity_type === "lead") {
      const lead = enquiries.find((l) => l.id === comm.entity_id);
      return lead ? `Lead: ${lead.contact_name}` : "Unknown Lead";
    }
    if (comm.entity_type === "job") {
      const job = jobs.find((j) => j.id === comm.entity_id);
      return job ? `Job: ${job.job_number}` : "Unknown Job";
    }
    if (comm.entity_type === "client") {
      const client = clients.find((c) => c.id === comm.entity_id);
      return client ? `Client: ${client.first_name} ${client.last_name}` : "Unknown Client";
    }
    return "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <PageHeader
        title="Communications Hub"
        subtitle="Track all calls, SMS, and emails across leads, jobs, and clients"
      >
        <Button size="sm" className="gap-1" onClick={() => setShowCallLogger(true)}>
          <Plus className="w-4 h-4" /> Log Call
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <CommunicationStats communications={allCommunications} />
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-border bg-card/50 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5">Search by contact or content</label>
            <Input
              placeholder="Phone, email, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium mb-1.5">Channel</label>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="phone">Phone Calls</SelectItem>
                <SelectItem value="sms">SMS Messages</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium mb-1.5">Record Type</label>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="job">Jobs</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium mb-1.5">Sort</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(filterChannel !== "all" || filterEntity !== "all" || searchQuery) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFilterChannel("all");
                setFilterEntity("all");
                setSearchQuery("");
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <HubTimeline
            commRecords={commRecords}
            callRecords={callRecords}
            smsMessages={smsMessages}
            emailMessages={emailMessages}
            filterChannel={filterChannel}
            filterEntity={filterEntity}
            searchQuery={searchQuery}
            sortBy={sortBy}
            getEntityLabel={getEntityLabel}
          />
        </div>
      </div>

      {/* Dialogs */}
      <CallLogger open={showCallLogger} onOpenChange={setShowCallLogger} />
    </div>
  );
}