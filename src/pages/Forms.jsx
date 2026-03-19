import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import { Globe, Briefcase, FileSignature, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import WebsiteFormsTab from "@/components/forms/WebsiteFormsTab";
import JobFormsTab from "@/components/forms/JobFormsTab";
import AgreementFormsTab from "@/components/forms/AgreementFormsTab";
import NewFormTemplateDialog from "@/components/forms/NewFormTemplateDialog";

export default function Forms() {
  const [tab, setTab] = useState("website");
  const [showNew, setShowNew] = useState(false);

  const { data: templates = [], refetch } = useQuery({
    queryKey: ["form-templates"],
    queryFn: () => base44.entities.FormTemplate.list("-created_date", 200),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["form-submission-records"],
    queryFn: () => base44.entities.FormSubmissionRecord.list("-submitted_date", 500),
  });

  // Support legacy "enquiry" form_type during migration
  const websiteTemplates = templates.filter((t) => t.form_type === "website" || t.form_type === "enquiry");
  const jobTemplates = templates.filter((t) => t.form_type === "job");
  const agreementTemplates = templates.filter((t) => t.form_type === "agreement");

  const websiteSubs = submissions.filter((s) => s.form_type === "website" || s.form_type === "enquiry");
  const jobSubs = submissions.filter((s) => s.form_type === "job");
  const agreementSubs = submissions.filter((s) => s.form_type === "agreement");

  const onCreated = () => { refetch(); setShowNew(false); };

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
      <PageHeader
        title="Forms"
        subtitle="Manage website lead forms, job inspection forms, and agreement templates"
      >
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Template
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="website" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website Forms
            {websiteTemplates.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full">
                {websiteTemplates.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="job" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Job Forms
            {jobTemplates.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full">
                {jobTemplates.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="agreement" className="flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            Agreements
            {agreementTemplates.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full">
                {agreementTemplates.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="website">
          <WebsiteFormsTab
            templates={websiteTemplates}
            submissions={websiteSubs}
            onRefresh={refetch}
          />
        </TabsContent>
        <TabsContent value="job">
          <JobFormsTab
            templates={jobTemplates}
            submissions={jobSubs}
            onRefresh={refetch}
          />
        </TabsContent>
        <TabsContent value="agreement">
          <AgreementFormsTab
            templates={agreementTemplates}
            submissions={agreementSubs}
            onRefresh={refetch}
          />
        </TabsContent>
      </Tabs>

      {showNew && (
        <NewFormTemplateDialog
          defaultType={tab}
          onCreated={onCreated}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}