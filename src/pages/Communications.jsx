import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageSquare, Mail, Filter, X, Plus } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "@/components/shared/PageHeader";
import CommunicationTimeline from "@/components/communications/CommunicationTimeline";
import CommunicationStats from "@/components/communications/CommunicationStats";
import CallLogger from "@/components/communications/CallLogger";
import CallDetailView from "@/components/communications/CallDetailView";

const CHANNEL_ICONS = {
  phone: Phone,
  sms: MessageSquare,
  email: Mail,
};

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