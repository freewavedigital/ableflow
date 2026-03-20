import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, isToday, isYesterday } from "date-fns";
import { ScrollText, Search, Filter, Loader2, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";

function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm");
}

const SENTIMENT_CONFIG = {
  positive: { icon: ThumbsUp,   color: "text-green-600", bg: "bg-green-100" },
  neutral:  { icon: Minus,       color: "text-slate-500", bg: "bg-slate-100" },
  negative: { icon: ThumbsDown, color: "text-red-600",   bg: "bg-red-100" },
};

function SentimentIcon({ sentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${cfg.bg}`}>
      <Icon className={`w-3 h-3 ${cfg.color}`} />
    </span>
  );
}

export default function CommsTranscripts() {
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");

  const { data: transcripts = [], isLoading } = useQuery({
    queryKey: ["call-transcripts"],
    queryFn: () => base44.entities.CallTranscript.list("-created_at", 200),
  });

  const filtered = useMemo(() => {
    return transcripts.filter(t => {
      if (sentimentFilter !== "all" && t.sentiment_overall !== sentimentFilter) return false;
      if (reviewFilter === "reviewed" && !t.is_reviewed) return false;
      if (reviewFilter === "unreviewed" && t.is_reviewed) return false;
      if (search) {
        const q = search.toLowerCase();
        const body = (t.full_transcript || "").toLowerCase();
        const topics = (t.key_topics || []).join(" ").toLowerCase();
        if (!body.includes(q) && !topics.includes(q)) return false;
      }
      return true;
    });
  }, [transcripts, search, sentimentFilter, reviewFilter]);

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title="Transcripts" subtitle="Transcribed text from call recordings" />

      <div className="px-6 pb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search transcript text or topics…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
          <SelectTrigger className="w-36">
            <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sentiments</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reviewFilter} onValueChange={setReviewFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Review status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="unreviewed">Unreviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ScrollText className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No transcripts found</p>
            <p className="text-xs text-muted-foreground mt-1">Transcripts are generated from call recordings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => {
              const isOpen = expandedId === t.id;
              return (
                <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : t.id)}
                    className="w-full flex items-start gap-4 px-4 py-3 hover:bg-muted/40 text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ScrollText className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">Call Transcript</p>
                        {t.sentiment_overall && <SentimentIcon sentiment={t.sentiment_overall} />}
                        {t.is_reviewed && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Reviewed
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{fmtTime(t.created_at)}</span>
                      </div>
                      {t.key_topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {t.key_topics.slice(0, 5).map(topic => (
                            <Badge key={topic} variant="secondary" className="text-[10px]">{topic}</Badge>
                          ))}
                        </div>
                      )}
                      {!isOpen && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.full_transcript}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-4 py-4 bg-muted/20 space-y-4">
                      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono text-xs bg-background border border-border rounded-lg p-3 max-h-80 overflow-auto">
                        {t.full_transcript}
                      </div>
                      {t.action_items?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Action Items</p>
                          <ul className="space-y-1">
                            {t.action_items.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {t.issues_identified?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Issues Identified</p>
                          <div className="flex flex-wrap gap-1.5">
                            {t.issues_identified.map((issue, i) => (
                              <Badge key={i} className="text-xs bg-red-50 text-red-700 border border-red-200">{issue}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {t.transcription_accuracy && (
                        <p className="text-xs text-muted-foreground">Accuracy: {t.transcription_accuracy}% · Service: {t.transcription_service || "unknown"}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}