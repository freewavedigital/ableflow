import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Phone, Mail, Send, RefreshCw, Paperclip, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const ICONS = {
  note: MessageSquare,
  call: Phone,
  email_sent: Mail,
  sms_sent: Send,
  status_change: RefreshCw,
  file_upload: Paperclip,
  system: AlertCircle,
};

const COLORS = {
  note: "bg-blue-100 text-blue-700",
  call: "bg-green-100 text-green-700",
  email_sent: "bg-purple-100 text-purple-700",
  sms_sent: "bg-cyan-100 text-cyan-700",
  status_change: "bg-amber-100 text-amber-700",
  file_upload: "bg-slate-100 text-slate-700",
  system: "bg-slate-100 text-slate-500",
};

export default function JobActivityFeed({ jobId, activities }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [type, setType] = useState("note");

  const addMutation = useMutation({
    mutationFn: () =>
      base44.entities.ActivityLog.create({
        entity_type: "job",
        entity_id: jobId,
        activity_type: type,
        title: type === "note" ? "Note added" : type === "call" ? "Call logged" : "Email logged",
        content: text,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", "job", jobId] });
      setText("");
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Activity & Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-5 pb-5 border-b border-border">
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-36 flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">📝 Note</SelectItem>
                <SelectItem value="call">📞 Call</SelectItem>
                <SelectItem value="email_sent">📧 Email</SelectItem>
                <SelectItem value="sms_sent">💬 SMS</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a note or log a communication..."
              rows={2}
              className="flex-1"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={!text.trim() || addMutation.isPending} onClick={() => addMutation.mutate()}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {addMutation.isPending ? "Saving..." : "Log Activity"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
          ) : (
            activities.map((act) => {
              const Icon = ICONS[act.activity_type] || MessageSquare;
              const color = COLORS[act.activity_type] || COLORS.note;
              return (
                <div key={act.id} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{act.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {act.created_date ? format(new Date(act.created_date), "d MMM, h:mm a") : ""}
                      </span>
                    </div>
                    {act.content && (
                      <p className="text-sm text-foreground/80 mt-0.5 leading-relaxed">{act.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}