import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import { Globe, Briefcase, FileSignature, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnquiryFormsTab from "@/components/forms/EnquiryFormsTab";
import JobFormsTab from "@/components/forms/JobFormsTab";
import AgreementFormsTab from "@/components/forms/AgreementFormsTab";
import NewFormTemplateDialog from "@/components/forms/NewFormTemplateDialog";

export default function Forms() {
  const [tab, setTab] = useState("enquiry");
  const [showNew, setShowNew] = useState(false);

  const { data: templates = [], refetch } = useQuery({
    queryKey: ["form-templates"],
    queryFn: () => base44.entities.FormTemplate.list("-created_date", 200),
  });

  const { data: submissions = [], refetch: refetchSubs } = useQuery({
    queryKey: ["form-submission-records"],
    queryFn: () => base44.entities.FormSubmissionRecord.list("-submitted_date", 500),
  });

  const enquiryTemplates = templates.filter((t) => t.form_type === "enquiry");
  const jobTemplates = templates.filter((t) => t.form_type === "job");
  const agreementTemplates = templates.filter((t) => t.form_type === "agreement");

  const enquirySubs = submissions.filter((s) => s.form_type === "enquiry");
  const jobSubs = submissions.filter((s) => s.form_type === "job");
  const agreementSubs = submissions.filter((s) => s.form_type === "agreement");

  const onCreated = () => { refetch(); setShowNew(false); };

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
      <PageHeader
        title="Forms"
        subtitle="Manage enquiry forms, job inspection forms, and agreement templates"
      >
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Template
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="enquiry" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Enquiry Forms
            {enquiryTemplates.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full">
                {enquiryTemplates.length}
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

        <TabsContent value="enquiry">
          <EnquiryFormsTab
            templates={enquiryTemplates}
            submissions={enquirySubs}
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