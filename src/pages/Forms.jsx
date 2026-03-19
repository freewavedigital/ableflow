import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import WebsiteFormsTab from "@/components/forms/WebsiteFormsTab.jsx";
import JobFormsTab from "@/components/forms/JobFormsTab";
import AgreementFormsTab from "@/components/forms/AgreementFormsTab";
import FormAutomationTab from "@/components/forms/FormAutomationTab";
import NewFormTemplateDialog from "@/components/forms/NewFormTemplateDialog";
import FormsContainer from "@/components/forms/FormsContainer";

export default function Forms() {
  const [showNew, setShowNew] = useState(false);
  const [activeTab, setActiveTab] = useState("website");
  const [searchParams] = useSearchParams();

  const { data: templates = [], refetch } = useQuery({
    queryKey: ["form-templates"],
    queryFn: () => base44.entities.FormTemplate.list("-created_date", 200),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["form-submission-records"],
    queryFn: () => base44.entities.FormSubmissionRecord.list("-submitted_date", 500),
  });

  // Sync activeTab with URL params
  useEffect(() => {
    const type = searchParams.get("type");
    const tab = searchParams.get("tab");
    
    if (type === "job") setActiveTab("job");
    else if (type === "agreement") setActiveTab("agreement");
    else if (tab === "templates") setActiveTab("templates");
    else if (tab === "notifications") setActiveTab("notifications");
    else if (tab === "embed") setActiveTab("embed");
    else setActiveTab("website");
  }, [searchParams]);

  // Filter templates by type
  const websiteTemplates = templates.filter((t) => t.form_type === "website" || t.form_type === "enquiry");
  const jobTemplates = templates.filter((t) => t.form_type === "job");
  const agreementTemplates = templates.filter((t) => t.form_type === "agreement");

  const websiteSubs = submissions.filter((s) => s.form_type === "website" || s.form_type === "enquiry");
  const jobSubs = submissions.filter((s) => s.form_type === "job");
  const agreementSubs = submissions.filter((s) => s.form_type === "agreement");

  const onCreated = () => { refetch(); setShowNew(false); };

  return (
    <FormsContainer>
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <PageHeader
          title={
            activeTab === "website" ? "Website Forms" :
            activeTab === "job" ? "Job Forms" :
            activeTab === "agreement" ? "Agreements" :
            activeTab === "automation" ? "Form Automation" :
            activeTab === "templates" ? "Form Templates" :
            activeTab === "notifications" ? "Form Notifications" :
            activeTab === "embed" ? "Embed & Publish" :
            "Forms"
          }
          subtitle={
            activeTab === "website" ? "Public lead capture forms" :
            activeTab === "job" ? "Technician inspection forms" :
            activeTab === "agreement" ? "Digital signature agreements" :
            activeTab === "automation" ? "Manage form triggers and automation rules" :
            activeTab === "templates" ? "Reusable form templates" :
            activeTab === "notifications" ? "Form submission alerts" :
            activeTab === "embed" ? "Publish forms on your website" :
            "Manage all form types"
          }
        >
          {(activeTab === "website" || activeTab === "job" || activeTab === "agreement") && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to={`/FormBuilder?type=${activeTab}`}>
                  <PenLine className="w-4 h-4 mr-1" /> Build Form
                </Link>
              </Button>
              <Button size="sm" onClick={() => setShowNew(true)}>
                <Plus className="w-4 h-4 mr-1" /> Quick Create
              </Button>
            </div>
          )}
        </PageHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "website" && (
            <WebsiteFormsTab
              templates={websiteTemplates}
              submissions={websiteSubs}
              onRefresh={refetch}
            />
          )}
          {activeTab === "job" && (
            <JobFormsTab
              templates={jobTemplates}
              submissions={jobSubs}
              onRefresh={refetch}
            />
          )}
          {activeTab === "agreement" && (
            <AgreementFormsTab
              templates={agreementTemplates}
              submissions={agreementSubs}
              onRefresh={refetch}
            />
          )}
          {activeTab === "automation" && (
            <FormAutomationTab />
          )}
          {activeTab === "templates" && (
            <div className="p-6">
              <p className="text-muted-foreground">Form templates library coming soon</p>
            </div>
          )}
          {activeTab === "notifications" && (
            <div className="p-6">
              <p className="text-muted-foreground">Form notification settings coming soon</p>
            </div>
          )}
          {activeTab === "embed" && (
            <div className="p-6">
              <p className="text-muted-foreground">Embed & publish settings coming soon</p>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewFormTemplateDialog
          defaultType={activeTab}
          onCreated={onCreated}
          onClose={() => setShowNew(false)}
        />
      )}
    </FormsContainer>
  );
}