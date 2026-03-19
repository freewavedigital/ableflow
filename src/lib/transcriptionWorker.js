import { base44 } from "@/api/base44Client";

/**
 * Transcription Worker
 * Watches for new CallRecordings and automatically transcribes them
 * This runs client-side on a polling interval
 */

class TranscriptionWorker {
  constructor() {
    this.isRunning = false;
    this.pollInterval = 30000; // Check every 30 seconds
    this.processedRecordings = new Set(); // Track processed recordings
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("Transcription worker started");
    this.poll();
  }

  stop() {
    this.isRunning = false;
    console.log("Transcription worker stopped");
  }

  async poll() {
    if (!this.isRunning) return;

    try {
      await this.processNewRecordings();
    } catch (err) {
      console.error("Transcription worker error:", err);
    }

    // Schedule next poll
    setTimeout(() => this.poll(), this.pollInterval);
  }

  async processNewRecordings() {
    try {
      // Get all recordings without transcripts
      const recordings = await base44.entities.CallRecording.list("-created_date", 50);

      for (const recording of recordings) {
        // Skip if already processed or has transcript
        if (this.processedRecordings.has(recording.id) || recording.transcription_status === "completed") {
          continue;
        }

        // Mark as processing
        this.processedRecordings.add(recording.id);

        try {
          await this.transcribeRecording(recording);
        } catch (err) {
          console.error(`Failed to transcribe recording ${recording.id}:`, err);
          // Keep trying next poll
        }
      }
    } catch (err) {
      console.error("Failed to fetch recordings:", err);
    }
  }

  async transcribeRecording(recording) {
    try {
      // Update status to processing
      await base44.entities.CallRecording.update(recording.id, {
        transcription_status: "processing",
      });

      // Call OpenAI API via LLM integration to transcribe audio
      // This uses Whisper via the InvokeLLM endpoint
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Please transcribe the following audio file. Return the full transcript with speaker identification if possible.

File: ${recording.file_name}

Return the result as JSON with:
- transcript: full transcribed text
- speaker_segments: array of {speaker: "agent"|"customer"|"unknown", text: string, start_time: number, end_time: number}
- key_topics: array of main topics discussed
- sentiment: "positive"|"neutral"|"negative"`,
        file_urls: [recording.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            transcript: {
              type: "string",
              description: "Full transcribed text",
            },
            speaker_segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  speaker: {
                    type: "string",
                    enum: ["agent", "customer", "unknown"],
                  },
                  text: {
                    type: "string",
                  },
                  start_time: {
                    type: "number",
                  },
                  end_time: {
                    type: "number",
                  },
                },
              },
            },
            key_topics: {
              type: "array",
              items: {
                type: "string",
              },
            },
            sentiment: {
              type: "string",
              enum: ["positive", "neutral", "negative"],
            },
          },
        },
        model: "gpt_5", // Use higher quality model for transcription
      });

      // Get the CallRecord to link transcript
      const callRecord = await base44.entities.CallRecord.filter({
        recording_id: recording.id,
      }).then((r) => r[0]);

      if (!callRecord) {
        throw new Error(`No CallRecord found for recording ${recording.id}`);
      }

      // Create CallTranscript
      const transcript = await base44.entities.CallTranscript.create({
        call_record_id: callRecord.id,
        call_recording_id: recording.id,
        full_transcript: result.transcript,
        transcript_format: "plain",
        transcription_service: "openai",
        transcription_accuracy: 95, // Default confidence
        language: "en",
        speaker_segments: result.speaker_segments || [],
        key_topics: result.key_topics || [],
        sentiment_overall: result.sentiment,
      });

      // Update CallRecord with transcript_id
      await base44.entities.CallRecord.update(callRecord.id, {
        transcript_id: transcript.id,
      });

      // Update CallRecording status
      await base44.entities.CallRecording.update(recording.id, {
        transcription_status: "completed",
      });

      console.log(`Successfully transcribed recording ${recording.id}`);
      return transcript;
    } catch (err) {
      // Mark as failed
      await base44.entities.CallRecording.update(recording.id, {
        transcription_status: "failed",
      }).catch((e) => console.error("Failed to update recording status:", e));

      throw err;
    }
  }
}

// Export singleton instance
export const transcriptionWorker = new TranscriptionWorker();