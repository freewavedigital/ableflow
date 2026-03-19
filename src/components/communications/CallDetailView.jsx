import React, { useState } from "react";
import { Phone, Edit2, Link2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import CallLinkPanel from "./CallLinkPanel";
import CallNoteEditor from "./CallNoteEditor";

export default function CallDetailView({ callRecord, commRecord, onClose }) {
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSummary, setEditingSummary] = useState(commRecord?.notes || "");
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.CommunicationRecord.update(commRecord.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communications"] });
      toast.success("Call updated");
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.CallRecord.delete(callRecord.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communications"] });
      toast.success("Call deleted");
      onClose();
    },
  });

  if (!callRecord || !commRecord) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{callRecord.phone_number}</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(commRecord.timestamp), "MMM d, yyyy HH:mm")}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setShowLinkPanel(true)}>
            <Link2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowNoteEditor(true)}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Call Details */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Direction</p>
            <p className="text-sm font-medium capitalize">{commRecord.direction}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Status</p>
            <p className="text-sm font-medium capitalize">{callRecord.call_status}</p>
          </div>
          {callRecord.duration_seconds > 0 && (
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Duration</p>
              <p className="text-sm font-medium">{Math.round(callRecord.duration_seconds / 60)} min</p>
            </div>
          )}
          {callRecord.outcome && (
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Outcome</p>
              <p className="text-sm font-medium capitalize">{callRecord.outcome}</p>
            </div>
          )}
        </div>

        {/* Linking Info */}
        {commRecord.entity_id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-900 mb-1">Linked To</p>
            <p className="text-sm text-blue-800 capitalize">
              {commRecord.entity_type}: {commRecord.entity_id}
            </p>
          </div>
        )}

        {/* Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Summary</p>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editingSummary}
                onChange={(e) => setEditingSummary(e.target.value)}
                className="h-20"
                placeholder="Add call notes..."
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    updateMutation.mutate({ notes: editingSummary });
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              {commRecord.notes ? commRecord.notes : <span className="text-muted-foreground italic">No summary</span>}
            </div>
          )}
        </div>

        {/* Recordings/Transcripts */}
        {callRecord.recording_id && (
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-semibold mb-2">Recording</p>
            <p className="text-xs text-muted-foreground">Recording ID: {callRecord.recording_id}</p>
          </div>
        )}

        {callRecord.transcript_id && (
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-semibold mb-2">Transcript</p>
            <p className="text-xs text-muted-foreground">Transcript ID: {callRecord.transcript_id}</p>
          </div>
        )}

        {/* Tags */}
        {commRecord.tags?.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {commRecord.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Panels */}
      <CallLinkPanel
        open={showLinkPanel}
        onOpenChange={setShowLinkPanel}
        callRecord={callRecord}
        onLinked={() => setShowLinkPanel(false)}
      />

      <CallNoteEditor
        open={showNoteEditor}
        onOpenChange={setShowNoteEditor}
        commRecord={commRecord}
        onSuccess={() => setShowNoteEditor(false)}
      />
    </div>
  );
}