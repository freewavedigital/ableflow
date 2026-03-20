import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import {
  Phone, MessageSquare, Mail, PhoneMissed, Clock, ArrowDownLeft, ArrowUpRight,
  ChevronRight, CheckCircle2, AlertCircle, Loader2, Plus, RefreshCw, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import CallLogger from "@/components/communications/CallLogger";
import TimelineDetailDrawer from "@/components/communications/TimelineDetailDrawer";

// ── helpers ────────────────────────────────────────────────────────────────

function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm");
}

function fmtAgo(ts) {
  if (!ts) return "—";
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

function fmtDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ icon: Icon, iconColor, title, count, emptyText, loading, viewAllTo, children }) {
  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sm flex-1">{title}</span>
        {count != null && (
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        )}
        {viewAllTo && (
          <Link to={viewAllTo} className="text-xs text-primary hover:underline flex items-center gap-0.5">
            View all <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border max-h-72">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : React.Children.count(children) === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <CheckCircle2 className="w-6 h-6 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">{emptyText}</p>
          </div>
        ) : children}
      </div>
    </div>
  );
}

// ── Row components ─────────────────────────────────────────────────────────

function CallRow({ call, commRecord, onClick }) {
  const missed = call.call_status === "missed" || call.call_status === "no_answer";
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${missed ? "bg-red-100" : "bg-primary/10"}`}>
        {missed
          ? <PhoneMissed className="w-4 h-4 text-red-500" />
          : commRecord?.direction === "inbound"
            ? <ArrowDownLeft className="w-4 h-4 text-primary" />
            : <ArrowUpRight className="w-4 h-4 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{commRecord?.contact_name || call.phone_number}</p>
        <p className="text-xs text-muted-foreground">{call.phone_number}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {fmtDuration(call.duration_seconds) && (
          <p className="text-xs font-medium text-muted-foreground">{fmtDuration(call.duration_seconds)}</p>
        )}
        <p className="text-[10px] text-muted-foreground">{fmtTime(call.started_at)}</p>
      </div>
    </button>
  );
}

function SMSRow({ sms, commRecord, onClick }) {
  const unread = sms.delivery_status !== "read" && commRecord?.direction === "inbound";
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors">
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm truncate ${unread ? "font-semibold" : "font-medium"}`}>
            {commRecord?.contact_name || sms.phone_number}
          </p>
          {unread && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{sms.content}</p>
      </div>
      <p className="text-[10px] text-muted-foreground flex-shrink-0">{fmtTime(sms.sent_at)}</p>
    </button>
  );
}

function EmailRow({ email, commRecord, onClick }) {
  const unread = email.delivery_status !== "opened";
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm truncate ${unread ? "font-semibold" : "font-medium"}`}>
            {commRecord?.contact_name || email.recipient_name || email.recipient_email}
          </p>
          {unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{email.subject}</p>
      </div>
      <p className="text-[10px] text-muted-foreground flex-shrink-0">{fmtTime(email.sent_at)}</p>
    </button>
  );
}

function FollowUpRow({ task, onClick }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${overdue ? "bg-red-100" : "bg-amber-100"}`}>
        <Clock className={`w-4 h-4 ${overdue ? "text-red-500" : "text-amber-600"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        {task.description && <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        {task.due_date && (
          <p className={`text-xs font-medium ${overdue ? "text-red-500" : "text-amber-600"}`}>
            {overdue ? "Overdue" : fmtAgo(task.due_date)}
          </p>
        )}
        <Badge variant="outline" className="text-[10px] mt-0.5">{task.priority || "normal"}</Badge>
      </div>
    </button>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function CommsDashboard() {
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const { data: commRecords = [], isLoading: loadingComm, refetch } = useQuery({
    queryKey: ["communications"],
    queryFn: () => base44.entities.CommunicationRecord.list("-timestamp", 200),
  });
  const { data: callRecords = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["call-records"],
    queryFn: () => base44.entities.CallRecord.list("-started_at", 100),
  });
  const { data: smsRecords = [], isLoading: loadingSMS } = useQuery({
    queryKey: ["sms-messages"],
    queryFn: () => base44.entities.SMSRecord.list("-sent_at", 100),
  });
  const { data: emailRecords = [], isLoading: loadingEmails } = useQuery({
    queryKey: ["email-messages"],
    queryFn: () => base44.entities.EmailRecord.list("-sent_at", 100),
  });
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.TaskReminder.list("-created_date", 100),
  });

  const loading = loadingComm || loadingCalls || loadingSMS || loadingEmails || loadingTasks;

  // Derived lists
  const recentCalls = useMemo(() => {
    return callRecords
      .filter((c) => c.call_status !== "missed" && c.call_status !== "no_answer")
      .slice(0, 10)
      .map((call) => ({
        call,
        commRecord: commRecords.find((c) => c.id === call.communication_record_id),
      }));
  }, [callRecords, commRecords]);

  const missedCalls = useMemo(() => {
    return callRecords
      .filter((c) => c.call_status === "missed" || c.call_status === "no_answer" || c.call_status === "voicemail")
      .slice(0, 10)
      .map((call) => ({
        call,
        commRecord: commRecords.find((c) => c.id === call.communication_record_id),
      }));
  }, [callRecords, commRecords]);

  const unreadSMS = useMemo(() => {
    return smsRecords
      .filter((s) => {
        const comm = commRecords.find((c) => c.id === s.communication_record_id);
        return comm?.direction === "inbound" && s.delivery_status !== "read";
      })
      .slice(0, 10)
      .map((sms) => ({
        sms,
        commRecord: commRecords.find((c) => c.id === sms.communication_record_id),
      }));
  }, [smsRecords, commRecords]);

  const recentEmails = useMemo(() => {
    return emailRecords.slice(0, 10).map((email) => ({
      email,
      commRecord: commRecords.find((c) => c.id === email.communication_record_id),
    }));
  }, [emailRecords, commRecords]);

  const pendingFollowUps = useMemo(() => {
    return tasks
      .filter((t) => t.status === "pending" && t.source === "call")
      .slice(0, 10);
  }, [tasks]);

  // Build timeline entry for drawer
  function toEntry(type, record, commRecord) {
    if (type === "call") {
      return {
        id: commRecord?.id,
        channel: "call",
        timestamp: record.started_at,
        direction: commRecord?.direction,
        contact: record.phone_number,
        duration_seconds: record.duration_seconds,
        call_status: record.call_status,
        outcome: record.outcome,
        recording_id: record.recording_id,
        transcript_id: record.transcript_id,
        callRecord: record,
        commRecord,
        notes: commRecord?.notes,
      };
    }
    if (type === "sms") {
      return {
        id: commRecord?.id,
        channel: "sms",
        timestamp: record.sent_at,
        direction: commRecord?.direction,
        contact: record.phone_number,
        content: record.content,
        delivery_status: record.delivery_status,
        smsRecord: record,
        commRecord,
      };
    }
    if (type === "email") {
      return {
        id: commRecord?.id,
        channel: "email",
        timestamp: record.sent_at,
        direction: commRecord?.direction,
        contact: record.recipient_email,
        subject: record.subject,
        body_html: record.body_html,
        body_plain: record.body_plain,
        delivery_status: record.delivery_status,
        emailRecord: record,
        commRecord,
      };
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <PageHeader
        title="Communications"
        subtitle="Live overview of calls, messages, and follow-ups"
      >
        <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
        <Button size="sm" className="gap-1" onClick={() => setShowCallLogger(true)}>
          <Plus className="w-4 h-4" /> Log Call
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={PhoneMissed}
            label="Missed Calls"
            value={missedCalls.length}
            color="bg-red-100 text-red-600"
            sub="need callback"
          />
          <StatCard
            icon={MessageSquare}
            label="Unread SMS"
            value={unreadSMS.length}
            color="bg-green-100 text-green-700"
            sub="inbound, unread"
          />
          <StatCard
            icon={Mail}
            label="Recent Emails"
            value={recentEmails.length}
            color="bg-blue-100 text-blue-600"
            sub="last 100"
          />
          <StatCard
            icon={Clock}
            label="Pending Follow-ups"
            value={pendingFollowUps.length}
            color="bg-amber-100 text-amber-700"
            sub="from calls"
          />
        </div>

        {/* Top row: missed calls + unread SMS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section
            icon={PhoneMissed}
            iconColor="bg-red-100 text-red-600"
            title="Missed Calls"
            count={missedCalls.length}
            emptyText="No missed calls — all good!"
            loading={loadingCalls || loadingComm}
            viewAllTo="/Communications"
          >
            {missedCalls.map(({ call, commRecord }) => (
              <CallRow
                key={call.id}
                call={call}
                commRecord={commRecord}
                onClick={() => setSelectedEntry(toEntry("call", call, commRecord))}
              />
            ))}
          </Section>

          <Section
            icon={MessageSquare}
            iconColor="bg-green-100 text-green-600"
            title="Unread SMS"
            count={unreadSMS.length}
            emptyText="No unread SMS messages"
            loading={loadingSMS || loadingComm}
            viewAllTo="/Communications"
          >
            {unreadSMS.map(({ sms, commRecord }) => (
              <SMSRow
                key={sms.id}
                sms={sms}
                commRecord={commRecord}
                onClick={() => setSelectedEntry(toEntry("sms", sms, commRecord))}
              />
            ))}
          </Section>
        </div>

        {/* Bottom row: recent calls + recent emails + follow-ups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section
            icon={Phone}
            iconColor="bg-primary/10 text-primary"
            title="Recent Calls"
            count={recentCalls.length}
            emptyText="No answered calls yet"
            loading={loadingCalls || loadingComm}
            viewAllTo="/Communications"
          >
            {recentCalls.map(({ call, commRecord }) => (
              <CallRow
                key={call.id}
                call={call}
                commRecord={commRecord}
                onClick={() => setSelectedEntry(toEntry("call", call, commRecord))}
              />
            ))}
          </Section>

          <Section
            icon={Mail}
            iconColor="bg-blue-100 text-blue-600"
            title="Recent Emails"
            count={recentEmails.length}
            emptyText="No emails logged"
            loading={loadingEmails || loadingComm}
            viewAllTo="/Communications"
          >
            {recentEmails.map(({ email, commRecord }) => (
              <EmailRow
                key={email.id}
                email={email}
                commRecord={commRecord}
                onClick={() => setSelectedEntry(toEntry("email", email, commRecord))}
              />
            ))}
          </Section>

          <Section
            icon={Clock}
            iconColor="bg-amber-100 text-amber-700"
            title="Pending Follow-ups"
            count={pendingFollowUps.length}
            emptyText="No pending follow-ups"
            loading={loadingTasks}
            viewAllTo="/Tasks"
          >
            {pendingFollowUps.map((task) => (
              <FollowUpRow
                key={task.id}
                task={task}
                onClick={() => {/* navigate to task if needed */}}
              />
            ))}
          </Section>
        </div>
      </div>

      <CallLogger open={showCallLogger} onOpenChange={setShowCallLogger} />
      <TimelineDetailDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
}