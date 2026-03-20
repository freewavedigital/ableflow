import { base44 } from "@/api/base44Client";

/**
 * Email Service
 * Handles sending emails, managing templates, and logging messages
 */

export class EmailService {
  /**
   * Send an email and log it as a CommunicationRecord + EmailRecord
   */
  static async sendEmail({
    to_email,
    to_name = "",
    subject,
    body_html,
    body_plain = "",
    from_name = "Able Leak Detection",
    entity_type,
    entity_id,
    client_id,
    branch_id,
    message_type = "general",
    template_id = null,
    attachments = [],
    direction = "outbound",
  }) {
    // Log communication record
    const commRecord = await base44.entities.CommunicationRecord.create({
      communication_type: "email",
      entity_type,
      entity_id,
      client_id,
      branch_id,
      direction,
      contact_email: to_email,
      contact_name: to_name,
      timestamp: new Date().toISOString(),
      status: "completed",
      notes: subject,
    });

    // Log email record
    const emailRecord = await base44.entities.EmailRecord.create({
      communication_record_id: commRecord.id,
      recipient_email: to_email,
      recipient_name: to_name,
      from_name,
      subject,
      body_html,
      body_plain,
      sent_at: new Date().toISOString(),
      delivery_status: "sent",
      message_type,
      template_id,
      attachments,
    });

    // Actually send via base44 email integration
    await base44.integrations.Core.SendEmail({
      to: to_email,
      subject,
      body: body_html || body_plain,
      from_name,
    });

    return { commRecord, emailRecord };
  }

  /**
   * Send from a saved template with variable substitution
   */
  static async sendFromTemplate({
    template_id,
    to_email,
    to_name = "",
    entity_type,
    entity_id,
    client_id,
    branch_id,
    variables = {},
    attachments = [],
  }) {
    const template = await base44.entities.CommunicationTemplate.read
      ? (await base44.entities.CommunicationTemplate.filter({ id: template_id }))[0]
      : null;

    if (!template) throw new Error("Template not found");

    let subject = template.for_email_only?.subject || template.name;
    let body_html = template.for_email_only?.body_html || template.content;
    let body_plain = template.for_email_only?.body_plain || template.content;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const rx = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(rx, value);
      body_html = body_html.replace(rx, value);
      body_plain = body_plain.replace(rx, value);
    });

    return this.sendEmail({
      to_email,
      to_name,
      subject,
      body_html,
      body_plain,
      entity_type,
      entity_id,
      client_id,
      branch_id,
      message_type: template.category,
      template_id,
      attachments,
    });
  }

  /**
   * Get email history for a record
   */
  static async getEmailHistory(entity_type, entity_id) {
    const records = await base44.entities.CommunicationRecord.filter(
      { communication_type: "email", entity_type, entity_id },
      "-timestamp",
      100
    );

    const details = await Promise.all(
      records.map(async (rec) => {
        const emails = await base44.entities.EmailRecord.filter({
          communication_record_id: rec.id,
        });
        return { ...rec, email: emails[0] || null };
      })
    );

    return details;
  }

  /**
   * Get email templates
   */
  static async getTemplates(category = null) {
    const query = { template_type: "email", status: "active" };
    if (category) query.category = category;
    return base44.entities.CommunicationTemplate.filter(query, "-created_date", 100);
  }
}

// Operational email trigger keys
export const EMAIL_TRIGGERS = {
  ENQUIRY_RESPONSE: "enquiry_response",
  AGREEMENT_SENT: "agreement_sent",
  BOOKING_CONFIRMATION: "booking_confirmation",
  QUOTE_DELIVERY: "quote_delivery",
  INVOICE_DELIVERY: "invoice_delivery",
};

export const EMAIL_TRIGGER_LABELS = {
  enquiry_response: "Enquiry Response",
  agreement_sent: "Agreement Sent",
  booking_confirmation: "Booking Confirmation",
  quote_delivery: "Quote Delivery",
  invoice_delivery: "Invoice Delivery",
};

export const EMAIL_TRIGGER_DESCRIPTIONS = {
  enquiry_response: "Auto-reply when a new enquiry is received",
  agreement_sent: "Sent when an agreement document is dispatched to a client",
  booking_confirmation: "Confirm a scheduled job with the client",
  quote_delivery: "Deliver a quote document to the client",
  invoice_delivery: "Deliver an invoice to the client",
};

// Map trigger -> trigger_event field on CommunicationTrigger
export const EMAIL_TRIGGER_EVENT_MAP = {
  enquiry_response: "lead_created",
  agreement_sent: "agreement_sent",
  booking_confirmation: "job_scheduled",
  quote_delivery: "quote_sent",
  invoice_delivery: "invoice_sent",
};