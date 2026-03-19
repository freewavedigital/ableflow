import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, Save, X, Search, Copy } from "lucide-react";
import { toast } from "sonner";

export default function CallTranscriptViewer({ transcript, callRecord, commRecord }) {
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summary, setSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSpeakers, setShowSpeakers] = useState(false);
  const qc = useQueryClient();

  const updateSummaryMutation = useMutation({
    mutationFn: (text) =>
      base44.entities.CallTranscript.update(transcript.id, {
        key_topics: text.split("\n").filter((l) => l.trim()),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call-transcripts"] });
      toast.success("Summary saved");
      setIsEditingSummary(false);
    },
  });

  const highlightMatches = (text) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!transcript) {
    return (
      <div className="bg-muted/30 rounded-lg p-6 text-center text-sm text-muted-foreground">
        No transcript available yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-card border border-border rounded p-2">
          <p className="text-muted-foreground font-semibold">Language</p>
          <p className="font-medium">{transcript.language || "EN"}</p>
        </div>
        <div className="bg-card border border-border rounded p-2">
          <p className="text-muted-foreground font-semibold">Accuracy</p>
          <p className="font-medium">{transcript.transcription_accuracy || "-"}%</p>
        </div>
        <div className="bg-card border border-border rounded p-2">
          <p className="text-muted-foreground font-semibold">Service</p>
          <p className="font-medium capitalize">{transcript.transcription_service || "-"}</p>
        </div>
      </div>

      {/* Speaker Segments Toggle */}
      {transcript.speaker_segments?.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSpeakers(!showSpeakers)}
          className="w-full justify-between"
        >
          <span>{showSpeakers ? "Hide" : "Show"} Speaker Segments</span>
          <span className="text-xs text-muted-foreground ml-2">({transcript.speaker_segments.length})</span>
        </Button>
      )}

      {/* Speaker Segments */}
      {showSpeakers && transcript.speaker_segments?.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
          {transcript.speaker_segments.map((segment, i) => (
            <div key={i} className="border-l-2 border-primary/50 pl-3">
              <p className="text-xs font-semibold text-primary capitalize mb-0.5">
                {segment.speaker}
                {segment.start_time && (
                  <span className="text-muted-foreground ml-2">
                    {Math.floor(segment.start_time / 60)}:{String(Math.floor(segment.start_time % 60)).padStart(2, "0")}
                  </span>
                )}
              </p>
              <p className="text-sm text-foreground">{segment.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full Transcript */}
      <div className="bg-card border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {highlightMatches(transcript.full_transcript)}
        </div>
      </div>

      {/* Summary / Key Topics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Summary & Topics</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditingSummary(!isEditingSummary)}
          >
            {isEditingSummary ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Edit2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>

        {isEditingSummary ? (
          <div className="space-y-2">
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Add key points (one per line)..."
              className="h-20"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingSummary(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updateSummaryMutation.mutate(summary)}
                disabled={updateSummaryMutation.isPending}
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
            {transcript.key_topics?.length > 0 ? (
              <>
                {transcript.key_topics.map((topic, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span className="flex-1">{topic}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-muted-foreground italic">No summary yet</p>
            )}
          </div>
        )}
      </div>

      {/* Copy Button */}
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => copyToClipboard(transcript.full_transcript)}
      >
        <Copy className="w-3.5 h-3.5 mr-2" />
        Copy Full Transcript
      </Button>

      {/* Link to Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p className="font-semibold mb-1">Link to Record Notes</p>
        <p>Transcript automatically indexed for search in {commRecord?.entity_type}</p>
      </div>
    </div>
  );
}