import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, isYesterday } from "date-fns";
import { Mail, ArrowDownLeft, ArrowUpRight, Search, Filter, Loader2, CheckCircle2, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import TimelineDetailDrawer from "@/components/communications/TimelineDetailDrawer";

function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm");
}

const STATUS_STYLES = {
  delivered: "bg-green-100 text-green-700",
  sent:      "bg-blue-100 text-blue-700",
  opened:    "bg-primary/10 text-primary",
  bounced:   "bg-red-100 text-red-700",
  failed:    "bg-red-100 text-red-700",
  pending:   "bg-amber-100 text-amber-700",
};

export default function CommsEmail() {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: emailRecords = [], isLoading: loadingEmails } = useQuery({
    queryKey: ["email-messages"],
    queryFn: () => base44.entities.EmailRecord.list("-sent_at", 200),
  });
  const { data: commRecords = [], isLoading: loadingComm } = useQuery({
    queryKey: ["communications"],
    queryFn: () => base44.entities.CommunicationRecord.list("-timestamp", 200),
  });

  const loading = loadingEmails || loadingComm;

  const filtered = useMemo(() => {
    return emailRecords
      .map(email => ({ email, commRecord: commRecords.find(c => c.id === email.communication_record_id) }))
      .filter(({ email }) => {
        if (statusFilter !== "all" && email.delivery_status !== statusFilter) return false;
        if (typeFilter !== "all" && email.message_type !== typeFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const name = (email.recipient_name || "").toLowerCase();
          const addr = (email.recipient_email || "").toLowerCase();
          const subj = (email.subject || "").toLowerCase();
          if (!name.includes(q) && !addr.includes(q) && !subj.includes(q)) return false;
        }
        return true;
      });
  }, [emailRecords, commRecords, search, statusFilter, typeFilter]);

  function toEntry(email, commRecord) {
    return { id: commRecord?.id, channel: "email", timestamp: email.sent_at, direction: commRecord?.direction || "outbound", contact: email.recipient_email, subject: email.subject, body_html: email.body_html, body_plain: email.body_plain, delivery_status: email.delivery_status, emailRecord: email, commRecord };
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title="Email" subtitle="All sent and received email messages" />

      <div className="px-6 pb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email or subject…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="quote">Quote</SelectItem>
            <SelectItem value="agreement">Agreement</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="reminder">Reminder</SelectItem>
            <SelectItem value="confirmation">Confirmation</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="general">General</SelectItem>
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
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No emails match your filters</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {filtered.map(({ email, commRecord }) => {
              const isInbound = commRecord?.direction === "inbound";
              const unread = email.delivery_status !== "opened";
              const stColor = STATUS_STYLES[email.delivery_status] || "bg-slate-100 text-slate-700";
              return (
                <button
                  key={email.id}
                  onClick={() => setSelectedEntry(toEntry(email, commRecord))}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {isInbound ? <ArrowDownLeft className="w-4 h-4 text-blue-600" /> : <ArrowUpRight className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm truncate ${unread ? "font-semibold" : "font-medium"}`}>{email.recipient_name || email.recipient_email}</p>
                      {unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{email.subject}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    {email.attachments?.length > 0 && <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />}
                    <Badge className={`text-xs border-0 ${stColor}`}>{email.delivery_status || "sent"}</Badge>
                    {email.message_type && email.message_type !== "general" && (
                      <Badge variant="outline" className="text-xs capitalize">{email.message_type.replace(/_/g, " ")}</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex-shrink-0">{fmtTime(email.sent_at)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <TimelineDetailDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}