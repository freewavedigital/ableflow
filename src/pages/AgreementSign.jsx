import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AgreementFormRenderer from "@/components/forms/AgreementFormRenderer";
import { handleAgreementSigned } from "@/lib/agreementWorkflow";

export default function AgreementSign() {
  const { agreementId } = useParams();
  const navigate = useNavigate();

  // Fetch agreement
  const { data: agreement, isLoading: agreementLoading } = useQuery({
    queryKey: ["agreement", agreementId],
    queryFn: () => base44.entities.Agreement.filter({ id: agreementId }).then((r) => r[0]),
    enabled: !!agreementId,
  });

  // Fetch template
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["form-template", agreement?.form_template_id],
    queryFn: () => base44.entities.FormTemplate.filter({ id: agreement.form_template_id }).then((r) => r[0]),
    enabled: !!agreement?.form_template_id,
  });

  const isLoading = agreementLoading || templateLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Agreement Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This agreement could not be found. It may have expired or been removed.
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check expiry
  const isExpired = agreement.expiry_date && new Date() > new Date(agreement.expiry_date);
  if (isExpired && agreement.status !== "signed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Agreement Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This agreement expired on {new Date(agreement.expiry_date).toLocaleDateString()}.
              Please contact the service provider for a new agreement.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = async (newStatus) => {
    if (newStatus === "signed") {
      try {
        await handleAgreementSigned(agreement.id);
      } catch (err) {
        console.error("Error handling signed agreement:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back link */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Agreement renderer */}
        {template && (
          <AgreementFormRenderer
            agreement={agreement}
            template={template}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          <p>
            This is a secure document. Your signature and information are encrypted and stored safely.
          </p>
        </div>
      </div>
    </div>
  );
}