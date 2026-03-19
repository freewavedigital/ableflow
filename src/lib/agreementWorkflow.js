/**
 * Agreement Workflow Orchestration
 * 
 * Handles agreement creation, distribution, and post-signing actions
 */

import { base44 } from "@/api/base44Client";

// Create and send an agreement
export const createAndSendAgreement = async ({
  templateId,
  clientId,
  leadId,
  jobId,
  branchId,
  clientName,
  siteAddress,
  serviceType,
  expiryDays = 30,
  sendNow = false,
}) => {
  // Create Agreement record in draft status
  const agreement = await base44.entities.Agreement.create({
    form_template_id: templateId,
    client_id: clientId,
    lead_id: leadId || null,
    job_id: jobId || null,
    branch_id: branchId,
    agreement_type: "service_agreement",
    status: "draft",
    client_name_snapshot: clientName,
    site_address_snapshot: siteAddress,
    service_type_snapshot: serviceType,
    expiry_date: addDays(new Date(), expiryDays).toISOString().split("T")[0],
  });

  if (sendNow) {
    // Mark as sent and trigger notification
    await base44.entities.Agreement.update(agreement.id, {
      status: "sent",
      sent_date: new Date().toISOString(),
    });

    // TODO: Send email notification to client with agreement link
    // Could integrate with Core.SendEmail integration
  }

  return agreement;
};

// Trigger post-signing actions
export const handleAgreementSigned = async (agreementId) => {
  const agreements = await base44.entities.Agreement.filter({ id: agreementId });
  if (!agreements.length) throw new Error("Agreement not found");

  const agreement = agreements[0];

  // Notify admin (could send email)
  // TODO: Implement email notification
  console.log(`[Agreement Signed] ${agreement.id} - ${agreement.signer_name}`);

  // Transition lead to "ready_to_schedule" if linked to a lead
  if (agreement.lead_id) {
    try {
      const leads = await base44.entities.Enquiry.filter({ id: agreement.lead_id });
      if (leads.length) {
        await base44.entities.Enquiry.update(agreement.lead_id, {
          status: "ready_to_schedule",
          agreement_status: "signed",
        });
      }
    } catch (err) {
      console.error("Failed to update lead status:", err);
    }
  }

  // If job exists, allow scheduling
  if (agreement.job_id) {
    try {
      const jobs = await base44.entities.Job.filter({ id: agreement.job_id });
      if (jobs.length) {
        // Job can now be transitioned to scheduled/dispatched
        console.log(`[Job Ready] ${agreement.job_id} - Agreement signed, job can proceed`);
      }
    } catch (err) {
      console.error("Failed to update job:", err);
    }
  }

  return agreement;
};

// Get agreement public link (for client signing)
export const getAgreementPublicLink = (agreementId) => {
  return `/agreement/${agreementId}`;
};

// Utility
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}