import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import SignatureCapture from "./SignatureCapture";

const STATUS_CONFIG = {
  draft: { icon: AlertCircle, color: "bg-slate-50 border-slate-200", label: "Draft" },
  sent: { icon: Clock, color: "bg-blue-50 border-blue-200", label: "Sent" },
  viewed: { icon: Clock, color: "bg-amber-50 border-amber-200", label: "Viewed" },
  signed: { icon: CheckCircle2, color: "bg-green-50 border-green-200", label: "Signed" },
  declined: { icon: AlertCircle, color: "bg-red-50 border-red-200", label: "Declined" },
  expired: { icon: AlertCircle, color: "bg-gray-50 border-gray-200", label: "Expired" },
};

export default function AgreementFormRenderer({ agreement, template, onStatusChange }) {
  const [signerName, setSignerName] = useState(agreement?.signer_name || "");
  const [signerEmail, setSignerEmail] = useState(agreement?.signer_email || "");
  const [signerRole, setSignerRole] = useState(agreement?.signer_role || "");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(agreement?.agreed_to_terms || false);

  const isReadOnly = ["signed", "declined", "expired"].includes(agreement?.status);
  const canSign = !isReadOnly && signerName.trim() && agreeToTerms && signatureUrl;

  // Update signature when captured
  const handleSignatureCapture = (url) => {
    setSignatureUrl(url);
    toast.success("Signature captured");
  };

  // Create signature record and update agreement
  const signMutation = useMutation({
    mutationFn: async () => {
      if (!signatureUrl) throw new Error("No signature captured");

      // Create SignatureRecord
      const sigRecord = await base44.entities.SignatureRecord.create({
        agreement_id: agreement.id,
        template_id: template.id,
        signer_name: signerName,
        signer_email: signerEmail,
        signer_role: signerRole,
        signature_url: signatureUrl,
        signed_at: new Date().toISOString(),
        agreed_to_terms: true,
        ip_address: null, // Could capture if needed
        device_info: navigator.userAgent,
        document_hash: hashText(template.agreement_body || ""),
      });

      // Update Agreement status to "signed"
      await base44.entities.Agreement.update(agreement.id, {
        status: "signed",
        signed_date: new Date().toISOString(),
        signature_record_id: sigRecord.id,
        signer_name: signerName,
        signer_email: signerEmail,
        signer_role: signerRole,
      });

      return sigRecord;
    },
    onSuccess: () => {
      toast.success("Agreement signed successfully!");
      if (onStatusChange) onStatusChange("signed");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to sign agreement");
    },
  });

  // Mark as viewed when first rendered
  useEffect(() => {
    if (agreement?.status === "sent") {
      base44.entities.Agreement.update(agreement.id, {
        status: "viewed",
        viewed_date: new Date().toISOString(),
      }).catch(() => {});
    }
  }, [agreement?.id, agreement?.status]);

  const statusIcon = STATUS_CONFIG[agreement?.status || "draft"].icon;
  const StatusIcon = statusIcon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with status */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{template?.name || "Agreement"}</CardTitle>
              <CardDescription>{template?.description}</CardDescription>
            </div>
            <Badge className={STATUS_CONFIG[agreement?.status || "draft"].color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {STATUS_CONFIG[agreement?.status || "draft"].label}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Pre-filled context */}
      {(agreement?.client_name_snapshot || agreement?.site_address_snapshot) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agreement Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {agreement?.client_name_snapshot && (
              <div>
                <span className="text-muted-foreground">Client: </span>
                <span className="font-medium">{agreement.client_name_snapshot}</span>
              </div>
            )}
            {agreement?.site_address_snapshot && (
              <div>
                <span className="text-muted-foreground">Site: </span>
                <span className="font-medium">{agreement.site_address_snapshot}</span>
              </div>
            )}
            {agreement?.service_type_snapshot && (
              <div>
                <span className="text-muted-foreground">Service: </span>
                <span className="font-medium">{agreement.service_type_snapshot}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agreement body */}
      {template?.agreement_body && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agreement Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
              <ReactMarkdown>{template.agreement_body}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signer info and signature */}
      {!isReadOnly ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sign Agreement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Signer details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Full Name *</label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Your full name"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-foreground">Your Role</label>
                <Input
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  placeholder="e.g. Property Owner, Tenant, Manager"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Signature canvas */}
            <SignatureCapture onCapture={handleSignatureCapture} disabled={isReadOnly} />

            {signatureUrl && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Captured Signature</label>
                <img
                  src={signatureUrl}
                  alt="Signature preview"
                  className="w-full border border-border rounded-lg bg-white p-2"
                />
              </div>
            )}

            {/* Terms acceptance checkbox */}
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Checkbox
                checked={agreeToTerms}
                onCheckedChange={setAgreeToTerms}
                disabled={isReadOnly}
                id="agree-terms"
              />
              <label htmlFor="agree-terms" className="text-xs text-foreground cursor-pointer flex-1">
                I confirm that I have read and agree to the terms of this agreement
              </label>
            </div>

            {/* Sign button */}
            <Button
              onClick={() => signMutation.mutate()}
              disabled={!canSign || signMutation.isPending}
              className="w-full"
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing...
                </>
              ) : (
                "Sign Agreement"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Read-only view after signing */
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agreement?.signature_record_id && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Signed by: </span>
                    <span className="font-medium">{agreement.signer_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Role: </span>
                    <span className="font-medium">{agreement.signer_role || "—"}</span>
                  </div>
                </div>
                {agreement?.signed_date && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Signed on: </span>
                    <span className="font-medium">
                      {new Date(agreement.signed_date).toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Simple hash function for document integrity
function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}