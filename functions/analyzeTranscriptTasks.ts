import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const TASK_TYPE_MAP = {
  follow_up_call: ["call back", "ring", "phone", "follow up", "follow-up", "call them"],
  send_email: ["email", "send over", "send through", "send details"],
  send_agreement: ["agreement", "contract", "terms", "sign"],
  confirm_booking: ["confirm", "booking", "appointment", "schedule", "book in"],
  chase_payment: ["payment", "invoice", "pay", "money", "quote", "price"],
  schedule_job: ["schedule", "arrange", "organise", "organize", "dispatch", "send someone"],
};

function inferTaskType(text) {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(TASK_TYPE_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) return type;
  }
  return "other";
}

function inferPriority(text, sentiment) {
  const lower = text.toLowerCase();
  if (/urgent|asap|emergency|immediately|today/.test(lower)) return "urgent";
  if (/high priority|important|soon/.test(lower)) return "high";
  if (sentiment === "negative") return "high";
  return "normal";
}

function dueDateFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Supports both direct invocation and entity automation payload
    const transcriptId = body.transcript_id || body.event?.entity_id || body.data?.id;

    if (!transcriptId) {
      return Response.json({ error: "transcript_id is required" }, { status: 400 });
    }

    // Fetch the transcript
    const transcripts = await base44.asServiceRole.entities.CallTranscript.filter({ id: transcriptId });
    const transcript = transcripts[0];
    if (!transcript) {
      return Response.json({ error: "Transcript not found" }, { status: 404 });
    }

    // Only process if we have a transcript to work with
    if (!transcript.full_transcript?.trim()) {
      return Response.json({ skipped: true, reason: "Empty transcript" });
    }

    // Fetch parent CallRecord to get entity linkage
    const callRecords = await base44.asServiceRole.entities.CallRecord.filter({ id: transcript.call_record_id });
    const callRecord = callRecords[0];

    // Fetch parent CommunicationRecord for entity_type / entity_id
    let commRecord = null;
    if (callRecord?.communication_record_id) {
      const comms = await base44.asServiceRole.entities.CommunicationRecord.filter({ id: callRecord.communication_record_id });
      commRecord = comms[0];
    }

    const entityType = commRecord?.entity_type || "lead";
    const entityId = commRecord?.entity_id || transcript.call_record_id;
    const branchId = commRecord?.branch_id || null;
    const assignedTo = commRecord?.initiated_by || null;

    // Use LLM to extract action items from the transcript
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are analyzing a call transcript for a leak detection / plumbing service business.
Extract ALL action items, follow-up tasks, and commitments mentioned in this transcript.
For each item return:
- title: short task title (max 10 words)
- description: 1-2 sentence detail
- task_type: one of [follow_up_call, send_email, send_agreement, confirm_booking, chase_payment, schedule_job, internal_action, other]
- priority: one of [low, normal, high, urgent]
- due_days: how many days from today is reasonable (1 = tomorrow, 2 = in 2 days, 7 = next week)

Only include concrete actionable items. Ignore pleasantries. Return an empty array if none found.

TRANSCRIPT:
${transcript.full_transcript.slice(0, 8000)}`,
      response_json_schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                task_type: { type: "string" },
                priority: { type: "string" },
                due_days: { type: "number" },
              },
            },
          },
        },
      },
    });

    let aiTasks = llmResult?.tasks || [];

    // Also include any action_items already extracted on the transcript entity as a fallback
    if (aiTasks.length === 0 && transcript.action_items?.length > 0) {
      aiTasks = transcript.action_items.map((item) => ({
        title: item.length > 80 ? item.slice(0, 77) + "..." : item,
        description: item,
        task_type: inferTaskType(item),
        priority: inferPriority(item, transcript.sentiment_overall),
        due_days: 2,
      }));
    }

    if (aiTasks.length === 0) {
      return Response.json({ created: 0, message: "No action items identified in transcript" });
    }

    // Create TaskReminder records
    const created = [];
    for (const task of aiTasks) {
      const record = await base44.asServiceRole.entities.TaskReminder.create({
        entity_type: entityType,
        entity_id: entityId,
        branch_id: branchId,
        title: task.title,
        description: `[Auto-generated from call transcript]\n\n${task.description || ""}`.trim(),
        task_type: task.task_type || "other",
        priority: task.priority || "normal",
        status: "pending",
        due_date: dueDateFromNow(task.due_days ?? 2),
        assigned_to: assignedTo,
        notes: `Source: Call transcript ID ${transcriptId}`,
      });
      created.push(record.id);
    }

    // Mark transcript tasks as processed by updating the action_items field if LLM found new ones
    if (aiTasks.length > 0) {
      await base44.asServiceRole.entities.CallTranscript.update(transcriptId, {
        action_items: aiTasks.map((t) => t.title),
      });
    }

    return Response.json({ created: created.length, task_ids: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});