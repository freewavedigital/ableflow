import { base44 } from "@/api/base44Client";

/**
 * SMS Service
 * Handles sending SMS, managing templates, and logging messages
 */

export class SMSService {
  /**
   * Send SMS to a phone number
   */
  static async sendSMS({
    phone_number,
    content,
    entity_type,
    entity_id,
    client_id,
    branch_id,
    message_type = "general",
    template_id = null,
    direction = "outbound",
  }) {
    // Create communication record
    const commRecord = await base44.entities.CommunicationRecord.create({
      communication_type: "sms",
      entity_type,
      entity_id,
      client_id,
      branch_id,
      direction,
      contact_phone: phone_number,
      timestamp: new Date().toISOString(),
      status: "pending",
      notes: content.substring(0, 100),
    });

    // Create SMS record
    const smsRecord = await base44.entities.SMSRecord.create({
      communication_record_id: commRecord.id,
      phone_number,
      content,
      sent_at: new Date().toISOString(),
      delivery_status: "sent",
      message_type,
      template_id,
    });

    // In a real app, this would call an SMS provider API (Twilio, etc)
    // For now, we just log it
    console.log(`SMS sent to ${phone_number}:`, content);

    return { commRecord, smsRecord };
  }

  /**
   * Send SMS from template
   */
  static async sendFromTemplate({
    template_id,
    phone_number,
    entity_type,
    entity_id,
    client_id,
    branch_id,
    variables = {},
  }) {
    // Get template
    const template = await base44.entities.CommunicationTemplate.read(template_id);

    // Replace variables in template
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    });

    return this.sendSMS({
      phone_number,
      content,
      entity_type,
      entity_id,
      client_id,
      branch_id,
      message_type: template.category,
      template_id,
    });
  }

  /**
   * Get SMS history for a record
   */
  static async getSMSHistory(entity_type, entity_id) {
    const records = await base44.entities.CommunicationRecord.filter({
      communication_type: "sms",
      entity_type,
      entity_id,
    }, "-timestamp", 100);

    // Get SMS details for each record
    const smsDetails = await Promise.all(
      records.map(async (record) => {
        const sms = await base44.entities.SMSRecord.filter({
          communication_record_id: record.id,
        }).then((r) => r[0]);
        return { ...record, sms };
      })
    );

    return smsDetails;
  }

  /**
   * Create SMS template
   */
  static async createTemplate({
    name,
    content,
    category = "general",
    variables = [],
    branch_id = null,
  }) {
    return base44.entities.CommunicationTemplate.create({
      name,
      template_type: "sms",
      content,
      category,
      variables,
      status: "active",
      branch_id,
    });
  }

  /**
   * Get SMS templates
   */
  static async getTemplates(category = null, branch_id = null) {
    const query = {
      template_type: "sms",
      status: "active",
    };
    if (category) query.category = category;
    if (branch_id) query.branch_id = branch_id;

    return base44.entities.CommunicationTemplate.filter(query, "-created_date", 50);
  }

  /**
   * Get template by category
   */
  static async getTemplatesByCategory(category) {
    return this.getTemplates(category);
  }
}

// SMS trigger types
export const SMS_TRIGGERS = {
  ENQUIRY_ACKNOWLEDGEMENT: "enquiry_acknowledgement",
  TENTATIVE_BOOKING: "tentative_booking",
  BOOKING_CONFIRMATION: "booking_confirmation",
  JOB_REMINDER: "job_reminder",
  TECHNICIAN_ON_THE_WAY: "technician_on_the_way",
  JOB_COMPLETION: "job_completion",
  FOLLOW_UP_REQUEST: "follow_up_request",
};

// SMS trigger conditions
export const SMS_TRIGGER_CONDITIONS = {
  [SMS_TRIGGERS.ENQUIRY_ACKNOWLEDGEMENT]: {
    entity_type: "lead",
    trigger: "lead_created",
  },
  [SMS_TRIGGERS.TENTATIVE_BOOKING]: {
    entity_type: "lead",
    trigger: "lead_status_changed",
    condition: { field: "status", value: "tentative_dates" },
  },
  [SMS_TRIGGERS.BOOKING_CONFIRMATION]: {
    entity_type: "job",
    trigger: "job_created",
  },
  [SMS_TRIGGERS.JOB_REMINDER]: {
    entity_type: "job",
    trigger: "job_scheduled",
    delay_minutes: 1440, // 24 hours before
  },
  [SMS_TRIGGERS.TECHNICIAN_ON_THE_WAY]: {
    entity_type: "job",
    trigger: "job_status_changed",
    condition: { field: "status", value: "dispatched" },
  },
  [SMS_TRIGGERS.JOB_COMPLETION]: {
    entity_type: "job",
    trigger: "job_status_changed",
    condition: { field: "status", value: "completed" },
  },
  [SMS_TRIGGERS.FOLLOW_UP_REQUEST]: {
    entity_type: "job",
    trigger: "job_status_changed",
    condition: { field: "status", value: "follow_up_required" },
  },
};