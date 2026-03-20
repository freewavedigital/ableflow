import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, isYesterday } from "date-fns";
import { MessageSquare, ArrowDownLeft, ArrowUpRight, Search, Filter, Loader2, CheckCircle2 } from "lucide-react";
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
  read:      "bg-slate-100 text-slate-700",
  failed:    "bg-red-100 text-red-700",
  pending:   "bg-amber-100 text-amber-700",
};

export default function CommsSMS() {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");

  const { data: smsRecords = [], isLoading: loadingSMS } = useQuery({
    queryKey: ["sms-messages"],
    queryFn: () => base44.entities.SMSRecord.list("-sent_at", 200),
  });
  const { data: commRecords = [], isLoading: loadingComm } = useQuery({
    queryKey: ["communications"],
    queryFn: () => base44.entities.CommunicationRecord.list("-timestamp", 200),
  });

  const loading = loadingSMS || loadingComm;

  const filtered = useMemo(() => {
    return smsRecords
      .map(sms => ({ sms, commRecord: commRecords.find(c => c.id === sms.communication_record_id) }))
      .filter(({ sms, commRecord }) => {
        if (statusFilter !== "all" && sms.delivery_status !== statusFilter) return false;
        if (directionFilter !== "all" && commRecord?.direction !== directionFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const name = (commRecord?.contact_name || "").toLowerCase();
          const phone = (sms.phone_number || "").toLowerCase();
          const body = (sms.content || "").toLowerCase();
          if (!name.includes(q) && !phone.includes(q) && !body.includes(q)) return false;
        }
        return true;
      });
  }, [smsRecords, commRecords, search, statusFilter, directionFilter]);

  function toEntry(sms, commRecord) {
    return { id: commRecord?.id, channel: "sms", timestamp: sms.sent_at, direction: commRecord?.direction, contact: sms.phone_number, content: sms.content, delivery_status: sms.delivery_status, smsRecord: sms, commRecord };
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title="SMS" subtitle="All inbound and outbound text messages" />

      <div className="px-6 pb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} />
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
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
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
          <div className="flex flex-col items-center justify-center py-20">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No messages match your filters</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {filtered.map(({ sms, commRecord }) => {
              const isInbound = commRecord?.direction === "inbound";
              const unread = sms.delivery_status !== "read" && isInbound;
              const stColor = STATUS_STYLES[sms.delivery_status] || "bg-slate-100 text-slate-700";
              return (
                <button
                  key={sms.id}
                  onClick={() => setSelectedEntry(toEntry(sms, commRecord))}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    {isInbound ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm truncate ${unread ? "font-semibold" : "font-medium"}`}>{commRecord?.contact_name || sms.phone_number}</p>
                      {unread && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{sms.content}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-xs border-0 ${stColor}`}>{sms.delivery_status || "sent"}</Badge>
                    {sms.message_type && sms.message_type !== "general" && (
                      <Badge variant="outline" className="text-xs capitalize">{sms.message_type.replace(/_/g, " ")}</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex-shrink-0">{fmtTime(sms.sent_at)}</p>
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