import React, { useState } from "react";
import { Upload, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CallAudioUpload({ callRecord, onUploaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      // Upload audio file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create CallRecording record
      const recording = await base44.entities.CallRecording.create({
        call_record_id: callRecord.id,
        file_url,
        file_name: file.name,
        file_format: file.name.split(".").pop().toLowerCase(),
        file_size_bytes: file.size,
      });

      // Update CallRecord with recording_id
      await base44.entities.CallRecord.update(callRecord.id, {
        recording_id: recording.id,
      });

      // Trigger transcription via backend function
      // This would be called by a backend worker watching for new recordings
      await base44.integrations.Core.InvokeLLM({
        prompt: `Please transcribe the following audio file. Return only the transcribed text, with speaker labels if identifiable:\n\nFile: ${file.name}`,
        file_urls: [file_url],
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
                },
              },
            },
          },
        },
      }).then(async (result) => {
        // Create CallTranscript with result
        const transcript = await base44.entities.CallTranscript.create({
          call_record_id: callRecord.id,
          call_recording_id: recording.id,
          full_transcript: result.transcript,
          transcript_format: "plain",
          transcription_service: "openai",
          language: "en",
          speaker_segments: result.speaker_segments || [],
        });

        // Update CallRecord with transcript_id
        await base44.entities.CallRecord.update(callRecord.id, {
          transcript_id: transcript.id,
        });

        return { recording, transcript };
      });

      return recording;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["call-records", callRecord.id] });
      toast.success("Recording uploaded and transcription started");
      setFileName(null);
      onUploaded?.(data);
    },
    onError: (err) => {
      toast.error("Failed to upload recording");
      setFileName(null);
    },
  });

  const handleFileSelect = (file) => {
    if (!["mp3", "wav", "m4a", "opus", "webm"].includes(file.name.split(".").pop().toLowerCase())) {
      toast.error("Only MP3, WAV, M4A, OPUS, and WEBM files are supported");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File must be under 50MB");
      return;
    }
    setFileName(file.name);
    uploadMutation.mutate(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
      }}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
    >
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => {
          if (e.target.files[0]) handleFileSelect(e.target.files[0]);
        }}
        className="hidden"
        id="audio-upload"
      />

      <div className="flex flex-col items-center gap-2">
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium">
              {fileName ? `Uploading ${fileName}...` : "Processing..."}
            </p>
          </>
        ) : (
          <>
            <Music className="w-8 h-8 text-muted-foreground" />
            <label htmlFor="audio-upload" className="cursor-pointer">
              <p className="text-sm font-medium">Drop audio file or click to upload</p>
            </label>
            <p className="text-xs text-muted-foreground">MP3, WAV, M4A, OPUS, WEBM up to 50MB</p>
          </>
        )}
      </div>
    </div>
  );
}