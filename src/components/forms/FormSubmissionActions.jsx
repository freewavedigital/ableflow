import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Clock, Play } from "lucide-react";
import { toast } from "sonner";
import { executeTriggerActions } from "@/lib/formActionExecutor";

/**
 * Visualizes actions that will/have run for a form submission
 * Shows execution status, logs, and allows manual trigger
 */
export default function FormSubmissionActions({ submission, template }) {
  const [executionLog, setExecutionLog] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fetch configured triggers
  const { data: triggers = [] } = useQuery({
    queryKey: ["form-action-triggers", template.id],
    queryFn: () => base44.entities.FormActionTrigger.filter({ template_id: template.id }),
  });

  // Get triggers for the current submission status
  const relevantTriggers = triggers.filter(
    (t) => t.fire_on === submission.status && t.is_active
  );

  const handleExecuteTriggers = async () => {
    setIsExecuting(true);
    setExecutionLog([]);

    try {
      const context = {
        submission,
        template,
        formValues: submission.field_values || {},
        entity: null, // Would be populated based on linked entity
      };

      const results = await executeTriggerActions(
        template.id,
        submission.status,
        context
      );

      setExecutionLog(
        results.map((r) => ({
          action: r.trigger,
          success: r.success,
          message: r.success ? "✓ Completed" : `✗ ${r.error}`,
          timestamp: new Date().toLocaleTimeString(),
        }))
      );

      if (results.every((r) => r.success)) {
        toast.success(`${results.length} action(s) executed`);
      } else {
        const failed = results.filter((r) => !r.success).length;
        toast.warning(`${failed} action(s) failed`);
      }
    } catch (err) {
      toast.error("Failed to execute actions");
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!relevantTriggers.length && executionLog.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Configured Actions</span>
          <Badge variant="outline">{relevantTriggers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List of triggers */}
        {relevantTriggers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Will execute on {submission.status}:
            </p>
            {relevantTriggers.map((trigger) => (
              <div
                key={trigger.id}
                className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{trigger.name}</p>
                  <p className="text-muted-foreground">{trigger.action_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Execution log */}
        {executionLog.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">Execution history:</p>
            {executionLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-muted/20 rounded text-xs">
                {log.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-muted-foreground">{log.message}</p>
                </div>
                <span className="text-muted-foreground">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}

        {/* Manual trigger button */}
        {relevantTriggers.length > 0 && (
          <Button
            onClick={handleExecuteTriggers}
            disabled={isExecuting}
            size="sm"
            className="w-full"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Actions Now
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}