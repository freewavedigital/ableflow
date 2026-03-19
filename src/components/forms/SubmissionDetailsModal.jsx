import React from "react";
import { Button } from "@/components/ui/button";
import { X, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import SubmissionPdfExport from "./SubmissionPdfExport";

export default function SubmissionDetailsModal({ submission, template, linkedRecord, onClose }) {
  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    reviewed: "bg-purple-100 text-purple-800",
    signed: "bg-green-100 text-green-800",
    converted: "bg-emerald-100 text-emerald-800",
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(submission, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `submission-${submission.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col border border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">{template?.name || "Form Submission"}</h2>
            <p className="text-xs text-muted-foreground mt-1">ID: {submission.id}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Status & Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <p className={`text-sm font-medium px-2 py-1 rounded inline-block mt-1 ${statusColors[submission.status]}`}>
                  {submission.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Form Type</p>
                <p className="text-sm font-medium mt-1 capitalize">{submission.form_type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Source</p>
                <p className="text-sm font-medium mt-1 capitalize">{submission.source || "internal"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Submitted By</p>
                <p className="text-sm font-medium mt-1">{submission.submitted_by || "Anonymous"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Submitted At</p>
                <p className="text-sm font-medium mt-1">
                  {submission.submitted_at ? format(new Date(submission.submitted_at), "MMM d, yyyy HH:mm") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Template Version</p>
                <p className="text-sm font-medium mt-1">v{submission.template_version || 1}</p>
              </div>
            </div>

            {/* Linked Records */}
            {linkedRecord && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-2">Linked Record</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">{linkedRecord.type}</p>
                    <p className="text-xs text-blue-700">{linkedRecord.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Field Values */}
            {submission.field_values && Object.keys(submission.field_values).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Submitted Data</h3>
                <div className="space-y-3">
                  {Object.entries(submission.field_values).map(([key, value]) => (
                    <div key={key} className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{key}</p>
                      <p className="text-sm break-words">
                        {Array.isArray(value) ? value.join(", ") : String(value) || "(empty)"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {(submission.photo_urls?.length > 0 || submission.signature_record_id) && (
              <div>
                <h3 className="font-semibold mb-3">Attachments</h3>
                <div className="space-y-2">
                  {submission.photo_urls?.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-muted/30 hover:bg-muted rounded-lg text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Photo {idx + 1}
                    </a>
                  ))}
                  {submission.signature_record_id && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-sm text-foreground">
                      <FileText className="w-4 h-4" />
                      Signature captured
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Notes */}
            {submission.reviewer_notes && (
              <div>
                <h3 className="font-semibold mb-2">Review Notes</h3>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">{submission.reviewer_notes}</p>
                  {submission.reviewed_by && (
                    <p className="text-xs text-amber-700 mt-2">
                      Reviewed by {submission.reviewed_by} on{" "}
                      {submission.reviewed_at ? format(new Date(submission.reviewed_at), "MMM d, yyyy") : "N/A"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30 flex-shrink-0">
          <SubmissionPdfExport
            submission={submission}
            template={template}
            linkedRecord={linkedRecord}
          />
          <Button size="sm" variant="outline" onClick={downloadJSON}>
            <Download className="w-4 h-4 mr-1" />
            Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}