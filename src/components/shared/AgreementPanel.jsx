import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  FileSignature,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Bell,
} from "lucide-react";

/**
 * STATUS FLOW:
 *   draft → sent → viewed → signed
 *                          ↘ declined / expired
 *
 * entityType: "lead" | "job"
 * entityId:   the enquiry or job id
 * context:    pre-filled snapshot data { clientName, siteAddress, serviceType, branchId, clientId, siteId }
 */

const STATUS_CONFIG = {
  draft:    { label: "Draft",    color: "bg-slate-100 text-slate-700 border-slate-300",   dot: "bg-slate-400" },
  sent:     { label: "Sent",     color: "bg-blue-50 text-blue-700 border-blue-300",       dot: "bg-blue-500" },
  viewed:   { label: "Viewed",   color: "bg-amber-50 text-amber-700 border-amber-300",    dot: "bg-amber-500" },
  signed:   { label: "Signed ✓", color: "bg-green-50 text-green-700 border-green-300",   dot: "bg-green-500" },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border-red-300",         dot: "bg-red-500" },
  expired:  { label: "Expired",  color: "bg-slate-50 text-slate-500 border-slate-200",   dot: "bg-slate-400" },
};

const AGREEMENT_TYPES = [
  { value: "service_agreement",    label: "Service Agreement" },
  { value: "inspection_agreement", label: "Inspection Agreement" },
  { value: "repair_agreement",     label: "Repair Agreement" },
  { value: "other",                label: "Other" },
];

const STATUS_SEQUENCE = ["draft", "sent", "viewed", "signed"];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function AgreementRecord({ agreement, onStatusChange, saving }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[agreement.status] || STATUS_CONFIG.draft;
  const isSigned = agreement.status === "signed";
  const isTerminal = ["signed", "declined", "expired"].includes(agreement.status);

  const nextStatuses = {
    draft:    [{ value: "sent",     label: "Mark as Sent",    icon: Send }],
    sent:     [{ value: "viewed",   label: "Mark as Viewed",  icon: Eye },
               { value: "signed",   label: "Mark as Signed",  icon: CheckCircle2 }],
    viewed:   [{ value: "signed",   label: "Mark as Signed",  icon: CheckCircle2 },
               { value: "declined", label: "Mark Declined",   icon: null }],
  };

  const actions = nextStatuses[agreement.status] || [];

  return (
    <div className={`border-2 rounded-xl overflow-hidden transition-all ${isSigned ? "border-green-300" : "border-border"}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <FileSignature className={`w-4 h-4 flex-shrink-0 ${isSigned ? "text-green-600" : "text-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {AGREEMENT_TYPES.find(t => t.value === agreement.agreement_type)?.label || "Agreement"}
          </p>
          {agreement.created_date && (
            <p className="text-xs text-muted-foreground">
              Created {format(new Date(agreement.created_date), "d MMM yyyy")}
            </p>
          )}
        </div>
        <StatusBadge status={agreement.status} />
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/20">

          {/* Snapshot info */}
          {(agreement.client_name_snapshot || agreement.site_address_snapshot) && (
            <div className="space-y-1 text-sm">
              {agreement.client_name_snapshot && (
                <div className="flex gap-2 text-xs">
                  <span className="text-muted-foreground w-16 flex-shrink-0">Client</span>
                  <span className="font-medium">{agreement.client_name_snapshot}</span>
                </div>
              )}
              {agreement.site_address_snapshot && (
                <div className="flex gap-2 text-xs">
                  <span className="text-muted-foreground w-16 flex-shrink-0">Site</span>
                  <span>{agreement.site_address_snapshot}</span>
                </div>
              )}
              {agreement.service_type_snapshot && (
                <div className="flex gap-2 text-xs">
                  <span className="text-muted-foreground w-16 flex-shrink-0">Service</span>
                  <span className="capitalize">{agreement.service_type_snapshot.replace(/_/g, " ")}</span>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {agreement.sent_date && (
              <p className="flex items-center gap-2"><Send className="w-3 h-3" /> Sent {format(new Date(agreement.sent_date), "d MMM yyyy, h:mm a")}</p>
            )}
            {agreement.viewed_date && (
              <p className="flex items-center gap-2"><Eye className="w-3 h-3" /> Viewed {format(new Date(agreement.viewed_date), "d MMM yyyy, h:mm a")}</p>
            )}
            {agreement.signed_date && (
              <p className="flex items-center gap-2 text-green-700 font-medium"><CheckCircle2 className="w-3 h-3" /> Signed {format(new Date(agreement.signed_date), "d MMM yyyy, h:mm a")}</p>
            )}
            {agreement.expiry_date && (
              <p className="flex items-center gap-2"><Clock className="w-3 h-3" /> Expires {format(new Date(agreement.expiry_date), "d MMM yyyy")}</p>
            )}
          </div>

          {agreement.notes && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">{agreement.notes}</p>
          )}

          {/* Document link */}
          {agreement.document_url && (
            <a href={agreement.document_url} target="_blank" rel="noopener noreferrer"
               className="text-xs text-primary underline">
              View Document
            </a>
          )}

          {/* Actions */}
          {!isTerminal && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {actions.map((action) => (
                <Button
                  key={action.value}
                  size="sm"
                  variant={action.value === "signed" ? "default" : "outline"}
                  disabled={saving}
                  onClick={() => onStatusChange(agreement.id, action.value, agreement)}
                  className="text-xs h-8"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : action.icon ? <action.icon className="w-3 h-3" /> : null}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {isSigned && (
            <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Agreement signed — ready to proceed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgreementPanel({ entityType, entityId, context = {} }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState("service_agreement");
  const [newNotes, setNewNotes] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [savingId, setSavingId] = useState(null);

  const queryKey = ["agreements", entityType, entityId];

  const { data: agreements = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      const field = entityType === "lead" ? "lead_id" : "job_id";
      return base44.entities.Agreement.filter({ [field]: entityId });
    },
    enabled: !!entityId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Agreement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setShowCreate(false);
      setNewNotes("");
      setNewExpiry("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agreement.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleCreate = () => {
    const payload = {
      agreement_type: newType,
      status: "draft",
      notes: newNotes || undefined,
      expiry_date: newExpiry || undefined,
      // Link to parent
      ...(entityType === "lead" ? { lead_id: entityId } : { job_id: entityId }),
      // Pre-filled snapshots
      client_id: context.clientId || undefined,
      branch_id: context.branchId || undefined,
      site_id: context.siteId || undefined,
      client_name_snapshot: context.clientName || undefined,
      site_address_snapshot: context.siteAddress || undefined,
      service_type_snapshot: context.serviceType || undefined,
    };
    createMutation.mutate(payload);
  };

  const handleStatusChange = async (agreementId, newStatus, agreement) => {
    setSavingId(agreementId);
    const now = new Date().toISOString();
    const patch = { status: newStatus };

    if (newStatus === "sent")   patch.sent_date   = now;
    if (newStatus === "viewed") patch.viewed_date  = now;
    if (newStatus === "signed") {
      patch.signed_date = now;
      // Internal notification via email
      if (user?.email) {
        base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Agreement Signed — ${agreement.client_name_snapshot || "Client"}`,
          body: `A service agreement has been signed.\n\nClient: ${agreement.client_name_snapshot || "—"}\nSite: ${agreement.site_address_snapshot || "—"}\nService: ${agreement.service_type_snapshot?.replace(/_/g, " ") || "—"}\n\nPlease log in to review and proceed.`,
        });
      }
      // Activity log
      base44.entities.ActivityLog.create({
        entity_type: entityType === "lead" ? "enquiry" : "job",
        entity_id: entityId,
        activity_type: "system",
        title: "Agreement Signed",
        content: `Service agreement signed by client${agreement.client_name_snapshot ? ` (${agreement.client_name_snapshot})` : ""}.`,
        metadata: { agreement_id: agreementId },
      });
    }

    await updateMutation.mutateAsync({ id: agreementId, data: patch });
    setSavingId(null);
  };

  const hasSignedAgreement = agreements.some((a) => a.status === "signed");

  return (
    <Card className={`${hasSignedAgreement ? "border-green-200" : "border-blue-200 bg-blue-50/30"}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className={`flex items-center gap-2 ${hasSignedAgreement ? "text-green-800" : "text-blue-800"}`}>
            <FileSignature className="w-4 h-4" />
            Service Agreement
            {hasSignedAgreement && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          </span>
          {!showCreate && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="border border-border rounded-xl p-4 space-y-3 bg-background">
            <p className="text-xs font-semibold text-foreground">New Agreement</p>

            <div className="space-y-1">
              <Label className="text-xs">Agreement Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGREEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pre-filled snapshot preview */}
            {(context.clientName || context.siteAddress) && (
              <div className="px-3 py-2 bg-muted rounded-lg text-xs space-y-0.5 text-muted-foreground">
                {context.clientName && <p><span className="font-medium">Client:</span> {context.clientName}</p>}
                {context.siteAddress && <p><span className="font-medium">Site:</span> {context.siteAddress}</p>}
                {context.serviceType && <p><span className="font-medium">Service:</span> {context.serviceType.replace(/_/g, " ")}</p>}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Expiry Date (optional)</Label>
              <Input type="date" className="h-9" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea rows={2} className="resize-none text-sm" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Any special terms or notes…" />
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" className="flex-1" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Draft"}
              </Button>
            </div>
          </div>
        )}

        {/* Existing agreements */}
        {agreements.length === 0 && !showCreate && (
          <p className="text-xs text-muted-foreground py-2 text-center">No agreements yet</p>
        )}

        {agreements.map((agreement) => (
          <AgreementRecord
            key={agreement.id}
            agreement={agreement}
            onStatusChange={handleStatusChange}
            saving={savingId === agreement.id}
          />
        ))}

        {/* Signed notification hint */}
        {hasSignedAgreement && (
          <div className="flex items-center gap-2 text-xs text-green-700 pt-1">
            <Bell className="w-3.5 h-3.5" />
            Internal notification sent when agreement was signed.
          </div>
        )}
      </CardContent>
    </Card>
  );
}