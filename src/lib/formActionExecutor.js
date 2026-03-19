/**
 * Form Action Executor
 * Executes automation actions triggered by form submission/signature/status changes
 */

import { base44 } from "@/api/base44Client";

// Trigger types that can fire actions
export const TRIGGER_TYPES = ["submitted", "signed", "reviewed", "converted"];

// Action types and their requirements
export const ACTION_TYPES = {
  send_email_notification: {
    label: "Send Email Notification",
    config: ["email_to", "subject", "body"],
    description: "Send email to internal staff",
  },
  send_email_to_submitter: {
    label: "Send Email to Submitter",
    config: ["subject", "body"],
    description: "Send email to the person who submitted the form",
  },
  send_sms_notification: {
    label: "Send SMS Notification",
    config: ["phone_to", "message"],
    description: "Send SMS to internal staff",
  },
  notify_user: {
    label: "Notify Internal User",
    config: ["user_email", "message"],
    description: "Create in-app notification for user",
  },
  create_task: {
    label: "Create Task",
    config: ["task_title", "task_description", "assigned_to", "due_date"],
    description: "Create a task reminder",
  },
  update_workflow_stage: {
    label: "Update Workflow Stage",
    config: ["entity_type", "field_name", "field_value"],
    description: "Update a Lead or Job field",
  },
  create_lead: {
    label: "Create Lead",
    config: ["branch_id"],
    description: "Convert form submission to new Lead",
  },
  create_job: {
    label: "Create Job",
    config: ["job_type", "branch_id"],
    description: "Create a new Job from submission",
  },
  attach_form: {
    label: "Attach Form to Record",
    config: ["entity_type", "entity_field_map"],
    description: "Link form submission to existing record",
  },
};

/**
 * Execute a single action
 */
export const executeAction = async (action, context) => {
  const { actionType, config } = action;
  const { submission, template, formValues, entity } = context;

  try {
    switch (actionType) {
      case "send_email_notification":
        return await sendEmailNotification(config, formValues);

      case "send_email_to_submitter":
        return await sendEmailToSubmitter(config, submission, template);

      case "send_sms_notification":
        return await sendSmsNotification(config, formValues);

      case "notify_user":
        return await notifyUser(config, submission, template);

      case "create_task":
        return await createTask(config, submission, template);

      case "update_workflow_stage":
        return await updateWorkflowStage(config, entity);

      case "create_lead":
        return await createLead(config, submission, formValues, template);

      case "create_job":
        return await createJob(config, submission, formValues, template, entity);

      case "attach_form":
        return await attachFormToRecord(config, submission, entity);

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (err) {
    console.error(`[FormAction] ${actionType} failed:`, err);
    throw err;
  }
};

// ============ ACTION IMPLEMENTATIONS ============

async function sendEmailNotification(config, formValues) {
  const { email_to, subject, body } = config;
  if (!email_to || !subject || !body) throw new Error("Missing email config");

  return await base44.integrations.Core.SendEmail({
    to: email_to,
    subject: interpolateTemplate(subject, formValues),
    body: interpolateTemplate(body, formValues),
  });
}

async function sendEmailToSubmitter(config, submission, template) {
  const { subject, body } = config;
  if (!submission?.submitted_by || submission.submitted_by === "anonymous") {
    throw new Error("Submitter email not available");
  }

  return await base44.integrations.Core.SendEmail({
    to: submission.submitted_by,
    subject: interpolateTemplate(subject, submission.field_values),
    body: interpolateTemplate(body, submission.field_values),
  });
}

async function sendSmsNotification(config, formValues) {
  const { phone_to, message } = config;
  if (!phone_to || !message) throw new Error("Missing SMS config");

  // TODO: Implement SMS via integration (Twilio, etc)
  console.log(`[SMS] To: ${phone_to}, Message: ${interpolateTemplate(message, formValues)}`);
  return { success: true, message: "SMS queued" };
}

async function notifyUser(config, submission, template) {
  const { user_email, message } = config;
  if (!user_email || !message) throw new Error("Missing notification config");

  // TODO: Create notification record in a Notification entity
  console.log(`[Notify] User: ${user_email}, Message: ${interpolateTemplate(message, submission.field_values)}`);
  return { success: true, message: "Notification queued" };
}

async function createTask(config, submission, template) {
  const { task_title, task_description, assigned_to, due_date } = config;
  if (!task_title) throw new Error("Task title required");

  return await base44.entities.TaskReminder.create({
    entity_type: "form_submission",
    entity_id: submission.id,
    entity_label: `${template.name} - ${submission.submitted_by}`,
    title: interpolateTemplate(task_title, submission.field_values),
    description: interpolateTemplate(task_description, submission.field_values),
    assigned_to: assigned_to || null,
    due_date: due_date || new Date().toISOString().split("T")[0],
    task_type: "internal_action",
    status: "pending",
  });
}

async function updateWorkflowStage(config, entity) {
  const { entity_type, field_name, field_value } = config;
  if (!entity_type || !field_name || !field_value) throw new Error("Missing workflow config");

  if (!entity || !entity.id) throw new Error("No entity to update");

  const EntityClass = base44.entities[entity_type];
  if (!EntityClass) throw new Error(`Unknown entity type: ${entity_type}`);

  return await EntityClass.update(entity.id, {
    [field_name]: field_value,
  });
}

async function createLead(config, submission, formValues, template) {
  const { branch_id } = config;
  if (!branch_id) throw new Error("Branch ID required");

  // Map form fields to Lead fields
  const leadData = {
    contact_name: formValues.contact_name || formValues.name || "Unknown",
    contact_phone: formValues.contact_phone || formValues.phone || "",
    contact_email: formValues.contact_email || formValues.email || submission.submitted_by,
    service_type: formValues.service_type || "leak_inspection",
    branch_id,
    source: "website",
    status: "new_lead",
    issue_summary: formValues.issue_summary || "",
    site_address: formValues.site_address || "",
    site_suburb: formValues.site_suburb || "",
  };

  const lead = await base44.entities.Enquiry.create(leadData);

  // Link submission to lead
  await base44.entities.FormSubmission.update(submission.id, {
    linked_lead_id: lead.id,
    converted_lead_id: lead.id,
    status: "converted",
  });

  return lead;
}

async function createJob(config, submission, formValues, template, leadEntity) {
  const { job_type, branch_id } = config;
  if (!job_type || !branch_id) throw new Error("Job type and branch required");
  if (!leadEntity || !leadEntity.id) throw new Error("No lead to create job from");

  const jobData = {
    job_type,
    branch_id,
    scheduled_date: new Date().toISOString().split("T")[0],
    job_notes: `Created from form submission: ${template.name}`,
    status: "draft",
  };

  // Link to lead if available
  if (leadEntity.id) {
    jobData.enquiry_id = leadEntity.id;
  }

  return await base44.entities.Job.create(jobData);
}

async function attachFormToRecord(config, submission, entity) {
  const { entity_type } = config;
  if (!entity || !entity.id) throw new Error("No entity to attach to");

  // Update submission with linked entity
  return await base44.entities.FormSubmission.update(submission.id, {
    linked_lead_id: entity_type === "lead" ? entity.id : submission.linked_lead_id,
    linked_job_id: entity_type === "job" ? entity.id : submission.linked_job_id,
    status: "reviewed",
  });
}

/**
 * Execute all actions for a given trigger
 */
export const executeTriggerActions = async (templateId, triggerType, context) => {
  // Fetch triggers for this template
  const triggers = await base44.entities.FormActionTrigger.filter({
    template_id: templateId,
  });

  const relevantTriggers = triggers.filter((t) => t.fire_on === triggerType && t.is_active);

  const results = [];
  for (const trigger of relevantTriggers) {
    try {
      const result = await executeAction(trigger, context);
      results.push({ trigger: trigger.name, success: true, result });
    } catch (err) {
      results.push({ trigger: trigger.name, success: false, error: err.message });
    }
  }

  return results;
};

/**
 * Template interpolation for dynamic values
 * Replaces {{field_name}} with actual form values
 */
function interpolateTemplate(template, values) {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] || match;
  });
}