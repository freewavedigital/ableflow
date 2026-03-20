import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { EmailService } from "@/lib/emailService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Send, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

export default function EmailSender({
  entity_type,
  entity_id,
  client_id,
  branch_id,
  open,
  onOpenChange,
  prefill = {},
}) {
  const [to_email, setToEmail] = useState(prefill.to_email || "");
  const [to_name, setToName] = useState(prefill.to_name || "");
  const [subject, setSubject] = useState(prefill.subject || "");
  const [body, setBody] = useState(prefill.body || "");
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [variables, setVariables] = useState({});
  const [attachments, setAttachments] = useState(prefill.attachments || []);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => EmailService.getTemplates(),
  });

  // Auto-populate email from entity
  useEffect(() => {
    if (!open || prefill.to_email) return;

    const fetchEmail = async () => {
      try {
        if (entity_type === "lead") {
          const enquiry = await base44.entities.Enquiry.read(entity_id);
          setToEmail(enquiry.contact_email || "");
          setToName(enquiry.contact_name || "");
        } else if (entity_type === "job") {
          const job = await base44.entities.Job.read(entity_id);
          setToEmail("");
          setToName(job.contact_name || "");
        } else if (entity_type === "client") {
          const client = await base44.entities.Client.read(entity_id);
          setToEmail(client.email || "");
          setToName(`${client.first_name || ""} ${client.last_name || ""}`.trim());
        }
      } catch (e) {
        // ignore
      }
    };

    fetchEmail();
  }, [open, entity_type, entity_id, prefill.to_email]);

  const handleTemplateSelect = (id) => {
    setTemplateId(id);
    const template = templates?.find((t) => t.id === id);
    if (!template) return;
    const vars = {};
    template.variables?.forEach((v) => (vars[v.name] = ""));
    setVariables(vars);
    setSubject(template.for_email_only?.subject || template.name || "");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAttachments((prev) => [
      ...prev,
      { file_url, file_name: file.name, file_type: file.type },
    ]);
    setUploading(false);
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (useTemplate && templateId) {
        return EmailService.sendFromTemplate({
          template_id: templateId,
          to_email,
          to_name,
          entity_type,
          entity_id,
          client_id,
          branch_id,
          variables,
          attachments,
        });
      }
      return EmailService.sendEmail({
        to_email,
        to_name,
        subject,
        body_html: body,
        body_plain: body,
        entity_type,
        entity_id,
        client_id,
        branch_id,
        attachments,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-history"] });
      queryClient.invalidateQueries({ queryKey: ["communication-records"] });
      toast.success("Email sent successfully");
      onOpenChange(false);
      // Reset
      setToEmail(""); setToName(""); setSubject(""); setBody("");
      setUseTemplate(false); setTemplateId(""); setVariables({}); setAttachments([]);
    },
    onError: () => {
      toast.error("Failed to send email");
    },
  });

  const canSend = to_email && subject && (useTemplate ? templateId : body.trim());

  const selectedTemplate = templates?.find((t) => t.id === templateId);
  const templateVars = selectedTemplate?.variables || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">To Email</label>
              <Input
                value={to_email}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="client@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">To Name</label>
              <Input
                value={to_name}
                onChange={(e) => setToName(e.target.value)}
                placeholder="Client Name"
                className="mt-1"
              />
            </div>
          </div>

          {/* Use Template toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-email-template"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
            />
            <label htmlFor="use-email-template" className="text-sm font-medium cursor-pointer">
              Use Template
            </label>
          </div>

          {useTemplate ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Template</label>
                <Select value={templateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {templateVars.map((v) => (
                <div key={v.name}>
                  <label className="text-sm font-medium capitalize">{v.name.replace(/_/g, " ")}</label>
                  <Input
                    value={variables[v.name] || ""}
                    onChange={(e) =>
                      setVariables({ ...variables, [v.name]: e.target.value })
                    }
                    placeholder={v.example || `Enter ${v.name}`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message..."
                  className="mt-1 h-32"
                />
              </div>
            </>
          )}

          {/* Attachments */}
          <div>
            <label className="text-sm font-medium">Attachments</label>
            <div className="mt-1 space-y-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-1.5">
                  <span className="truncate">{att.file_name}</span>
                  <button onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}>
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                <Paperclip className="w-4 h-4" />
                {uploading ? "Uploading..." : "Attach file"}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!canSend || sendMutation.isPending || uploading}
          >
            {sendMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />Send Email</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}