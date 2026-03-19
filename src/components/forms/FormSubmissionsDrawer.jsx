import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock, User, Calendar, Link2 } from "lucide-react";

const STATUS_COLORS = {
  signed: "bg-green-100 text-green-700",
  submitted: "bg-blue-100 text-blue-700",
  draft: "bg-muted text-muted-foreground",
  reviewed: "bg-purple-100 text-purple-700",
  converted: "bg-emerald-100 text-emerald-700",
};

export default function FormSubmissionsDrawer({ template, submissions, onClose }) {
  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">{template.name} — Submissions</SheetTitle>
          <p className="text-sm text-muted-foreground">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>
        </SheetHeader>

        {submissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No submissions yet</div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status] || "bg-muted text-muted-foreground"}`}>
                    {sub.status}
                  </span>
                  {sub.submitted_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(sub.submitted_date), "d MMM yyyy, h:mm a")}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {sub.submitted_by && sub.submitted_by !== "anonymous" && (
                    <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                      <User className="w-3 h-3" /> {sub.submitted_by}
                    </div>
                  )}
                  {sub.signer_name && (
                    <div className="col-span-2 text-muted-foreground">Signed by: <span className="text-foreground font-medium">{sub.signer_name}</span></div>
                  )}
                  {sub.linked_entity_type && sub.linked_entity_type !== "none" && (
                    <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                      <Link2 className="w-3 h-3" /> Linked to {sub.linked_entity_type} {sub.linked_entity_id}
                    </div>
                  )}
                  {sub.converted_lead_id && (
                    <div className="col-span-2 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Converted to Lead
                    </div>
                  )}
                </div>

                {sub.field_values && Object.keys(sub.field_values).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-primary cursor-pointer font-medium">View field values</summary>
                    <div className="mt-2 space-y-1">
                      {Object.entries(sub.field_values).map(([key, val]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="text-muted-foreground min-w-[100px] font-medium">{key}:</span>
                          <span className="text-foreground break-all">
                            {Array.isArray(val) ? val.join(", ") : String(val ?? "—")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {sub.signature_url && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Signature</p>
                    <img src={sub.signature_url} alt="Signature" className="border border-border rounded-lg max-h-20 bg-white" />
                  </div>
                )}

                {sub.reviewer_notes && (
                  <div className="mt-2 text-xs bg-muted/40 rounded-lg px-3 py-2 text-muted-foreground italic">
                    {sub.reviewer_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}