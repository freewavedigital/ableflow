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

  // Fetch all communication records
  const { data: phoneCalls = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["phone-calls"],
    queryFn: () => base44.entities.PhoneCall.list("-started_at", 100),
  });

  const { data: smsMessages = [], isLoading: loadingSMS } = useQuery({
    queryKey: ["sms-messages"],
    queryFn: () => base44.entities.SMSMessage.list("-sent_at", 100),
  });

  const { data: emailMessages = [], isLoading: loadingEmails } = useQuery({
    queryKey: ["email-messages"],
    queryFn: () => base44.entities.EmailMessage.list("-sent_at", 100),
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
    const comms = [
      ...phoneCalls.map((call) => ({
        ...call,
        channel: "phone",
        timestamp: call.started_at,
        contact: call.phone_number,
      })),
      ...smsMessages.map((msg) => ({
        ...msg,
        channel: "sms",
        timestamp: msg.sent_at,
        contact: msg.phone_number,
      })),
      ...emailMessages.map((msg) => ({
        ...msg,
        channel: "email",
        timestamp: msg.sent_at,
        contact: msg.recipient_email,
      })),
    ];

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
  }, [phoneCalls, smsMessages, emailMessages, filterChannel, filterEntity, searchQuery, sortBy]);

  const isLoading = loadingCalls || loadingSMS || loadingEmails;

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
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Log Communication
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
        {allCommunications.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No communications found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Communications will appear here as you log calls, send SMS, and emails
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {allCommunications.map((comm) => {
              const Icon = CHANNEL_ICONS[comm.channel];
              return (
                <div
                  key={`${comm.channel}-${comm.id}`}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">
                          {comm.channel === "phone" && `Call with ${comm.phone_number}`}
                          {comm.channel === "sms" && `SMS to ${comm.phone_number}`}
                          {comm.channel === "email" && `Email: ${comm.subject}`}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {comm.direction === "inbound" ? "↓ Received" : "↑ Sent"}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">{getEntityLabel(comm)}</p>

                      {comm.channel === "phone" && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {comm.duration_seconds && (
                            <p>Duration: {Math.round(comm.duration_seconds / 60)} min</p>
                          )}
                          {comm.status !== "completed" && <p>Status: {comm.status}</p>}
                          {comm.outcome && <p>Outcome: {comm.outcome}</p>}
                          {comm.notes && <p className="text-foreground/70">{comm.notes}</p>}
                        </div>
                      )}

                      {comm.channel === "sms" && (
                        <div className="mt-2 text-sm text-foreground/80 bg-muted/30 rounded px-2 py-1.5">
                          {comm.content}
                        </div>
                      )}

                      {comm.channel === "email" && (
                        <div className="mt-2 text-xs space-y-1">
                          <p className="text-muted-foreground">To: {comm.recipient_email}</p>
                          {comm.status !== "sent" && (
                            <p className="text-muted-foreground">Status: {comm.status}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{format(new Date(comm.timestamp), "MMM d, yyyy HH:mm")}</span>
                        {comm.tags?.length > 0 && (
                          <div className="flex gap-1">
                            {comm.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}