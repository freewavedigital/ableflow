import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { SMSService } from "@/lib/smsService";
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
import { MessageCircle, Send, Loader2 } from "lucide-react";

export default function SMSSender({ entity_type, entity_id, client_id, branch_id, open, onOpenChange }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [content, setContent] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateVariables, setTemplateVariables] = useState({});
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: () => SMSService.getTemplates(),
  });

  // Get phone number from entity
  useEffect(() => {
    if (!open) return;

    const fetchPhone = async () => {
      try {
        if (entity_type === "lead" || entity_type === "job") {
          const entity = await base44.entities.Enquiry.read(entity_id);
          setPhoneNumber(entity.contact_phone || "");
        } else if (entity_type === "client") {
          const client = await base44.entities.Client.read(entity_id);
          setPhoneNumber(client.phone || "");
        }
      } catch (err) {
        console.error("Failed to fetch phone number:", err);
      }
    };

    fetchPhone();
  }, [open, entity_type, entity_id]);

  // Send SMS mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (useTemplate && selectedTemplate) {
        return SMSService.sendFromTemplate({
          template_id: selectedTemplate,
          phone_number: phoneNumber,
          entity_type,
          entity_id,
          client_id,
          branch_id,
          variables: templateVariables,
        });
      } else {
        return SMSService.sendSMS({
          phone_number: phoneNumber,
          content,
          entity_type,
          entity_id,
          client_id,
          branch_id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication-records"] });
      queryClient.invalidateQueries({ queryKey: ["sms-records"] });
      setContent("");
      setPhoneNumber("");
      setUseTemplate(false);
      setSelectedTemplate("");
      setTemplateVariables({});
      onOpenChange(false);
    },
  });

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      const vars = {};
      template.variables?.forEach((v) => {
        vars[v.name] = "";
      });
      setTemplateVariables(vars);
    }
  };

  const canSend = phoneNumber && (useTemplate ? selectedTemplate : content.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Send SMS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phone Number */}
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="mt-1"
            />
          </div>

          {/* Use Template Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-template"
              checked={useTemplate}
              onChange={(e) => setUseTemplate(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="use-template" className="text-sm font-medium cursor-pointer">
              Use Template
            </label>
          </div>

          {/* Template Selection */}
          {useTemplate ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Template</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Variables */}
              {selectedTemplate &&
                templates
                  ?.find((t) => t.id === selectedTemplate)
                  ?.variables?.map((variable) => (
                    <div key={variable.name}>
                      <label className="text-sm font-medium">{variable.name}</label>
                      <Input
                        value={templateVariables[variable.name] || ""}
                        onChange={(e) =>
                          setTemplateVariables({
                            ...templateVariables,
                            [variable.name]: e.target.value,
                          })
                        }
                        placeholder={variable.example}
                        className="mt-1"
                      />
                    </div>
                  ))}
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                className="mt-1 h-24"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length} / 160 characters
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!canSend || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send SMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}