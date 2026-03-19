import React, { useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SubmissionPdfExport({ submission, template, linkedRecord, trigger = true }) {
  const [showDialog, setShowDialog] = useState(false);
  const [attachToRecord, setAttachToRecord] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Header
      doc.setFillColor(33, 150, 243);
      doc.rect(0, 0, pageWidth, 35, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.text("Form Submission", margin, yPosition + 15);
      
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(`${template?.name || "Form"}`, margin, yPosition + 25);

      yPosition += 40;

      // Metadata Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Submission Details", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      const metadata = [
        [`Submission ID:`, submission.id],
        [`Status:`, submission.status],
        [`Form Type:`, submission.form_type],
        [`Submitted By:`, submission.submitted_by || "Anonymous"],
        [`Submitted At:`, submission.submitted_date ? new Date(submission.submitted_date).toLocaleString() : "N/A"],
        [`Template Version:`, `v${submission.template_version || 1}`],
      ];

      metadata.forEach(([key, value]) => {
        doc.text(key, margin, yPosition);
        doc.text(String(value), margin + 50, yPosition);
        yPosition += 6;
      });

      // Linked Record
      if (linkedRecord) {
        yPosition += 4;
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 1, "F");
        yPosition += 6;
        
        doc.setFont(undefined, "bold");
        doc.text("Linked Record", margin, yPosition);
        yPosition += 6;
        
        doc.setFont(undefined, "normal");
        doc.text(`${linkedRecord.type}: ${linkedRecord.name}`, margin, yPosition);
        yPosition += 8;
      }

      // Form Data Section
      if (submission.field_values && Object.keys(submission.field_values).length > 0) {
        yPosition += 4;
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 1, "F");
        yPosition += 6;

        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.text("Submitted Data", margin, yPosition);
        yPosition += 8;

        doc.setFontSize(9);
        doc.setFont(undefined, "normal");

        Object.entries(submission.field_values).forEach(([key, value]) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          const displayValue = Array.isArray(value) ? value.join(", ") : String(value || "(empty)");
          const fieldLabel = key.replace(/_/g, " ");

          // Field label in bold
          doc.setFont(undefined, "bold");
          doc.text(fieldLabel + ":", margin, yPosition);
          yPosition += 5;

          // Field value wrapped
          doc.setFont(undefined, "normal");
          const splitValue = doc.splitTextToSize(displayValue, pageWidth - margin * 2 - 10);
          doc.text(splitValue, margin + 5, yPosition);
          yPosition += splitValue.length * 5 + 3;
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);

      // Save PDF
      const filename = `submission-${submission.id}.pdf`;
      doc.save(filename);

      // Optionally attach to linked record
      if (attachToRecord && linkedRecord) {
        try {
          // Save PDF as blob and upload
          const pdfBlob = doc.output("blob");
          const uploadResponse = await base44.integrations.Core.UploadFile({
            file: pdfBlob,
          });

          // Create FileUpload record
          const fileRecord = {
            entity_type: linkedRecord.type.toLowerCase(),
            entity_id: linkedRecord.id,
            file_url: uploadResponse.file_url,
            file_name: filename,
            file_type: "pdf",
            mime_type: "application/pdf",
          };

          await base44.entities.FileUpload.create(fileRecord);
          toast.success(`PDF exported and attached to ${linkedRecord.type}`);
        } catch (err) {
          toast.warning("PDF exported but could not attach to record");
          console.error("Attachment error:", err);
        }
      } else {
        toast.success("PDF exported successfully");
      }

      setShowDialog(false);
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!trigger) return null;

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShowDialog(true)}>
        <Download className="w-4 h-4 mr-1" />
        Export PDF
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Form Submission as PDF</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-2">{template?.name || "Form Submission"}</p>
              <p className="text-xs text-muted-foreground">ID: {submission.id}</p>
            </div>

            {linkedRecord && (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="attach"
                  checked={attachToRecord}
                  onCheckedChange={setAttachToRecord}
                />
                <label htmlFor="attach" className="text-sm cursor-pointer">
                  <p className="font-medium">Attach PDF to linked record</p>
                  <p className="text-xs text-muted-foreground">
                    Save to {linkedRecord.type}: {linkedRecord.name}
                  </p>
                </label>
              </div>
            )}

            {!linkedRecord && (
              <p className="text-xs text-muted-foreground">
                No linked record found. PDF will be downloaded only.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={generatePDF} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}