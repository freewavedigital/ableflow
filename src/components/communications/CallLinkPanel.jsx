import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function CallLinkPanel({ open, onOpenChange, callRecord, onLinked }) {
  const [activeTab, setActiveTab] = useState("link");
  const [selectedId, setSelectedId] = useState(null);
  const [newLeadData, setNewLeadData] = useState({ contact_name: "", contact_phone: "" });
  const qc = useQueryClient();

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => base44.entities.Enquiry.list(),
  });

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const linkMutation = useMutation({
    mutationFn: async (data) => {
      // Update CommunicationRecord with linked entity
      await base44.entities.CommunicationRecord.update(
        callRecord.communication_record_id,
        {
          entity_type: data.entityType,
          entity_id: data.entityId,
        }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communications"] });
      toast.success("Call linked successfully");
      onOpenChange(false);
      onLinked?.();
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      const lead = await base44.entities.Enquiry.create({
        contact_name: newLeadData.contact_name || "Unknown",
        contact_phone: callRecord.phone_number,
        service_type: "leak_inspection",
        source: "phone",
        status: "contact_made",
      });

      await base44.entities.CommunicationRecord.update(
        callRecord.communication_record_id,
        {
          entity_type: "lead",
          entity_id: lead.id,
        }
      );

      return lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enquiries", "communications"] });
      toast.success("Lead created and linked");
      onOpenChange(false);
      setNewLeadData({ contact_name: "", contact_phone: "" });
      onLinked?.();
    },
  });

  if (!callRecord) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Call</DialogTitle>
          <DialogDescription>
            Attach this call to an existing record or create a new lead
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="link" className="flex-1">
              Link to Existing
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">
              Create Lead
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-3 mt-4">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold mb-2">Leads</h3>
                {loadingLeads ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : leads.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No leads found</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {leads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedId(lead.id)}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded border transition ${
                          selectedId === lead.id
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {lead.contact_name} ({lead.contact_phone})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Jobs</h3>
                {loadingJobs ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : jobs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No jobs found</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {jobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedId(job.id)}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded border transition ${
                          selectedId === job.id
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {job.job_number} - {job.contact_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Clients</h3>
                {loadingClients ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : clients.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No clients found</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedId(client.id)}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded border transition ${
                          selectedId === client.id
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {client.first_name} {client.last_name} ({client.phone})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={!selectedId || linkMutation.isPending}
                onClick={() => {
                  const item =
                    leads.find((l) => l.id === selectedId) ||
                    jobs.find((j) => j.id === selectedId) ||
                    clients.find((c) => c.id === selectedId);
                  if (item) {
                    const type = leads.find((l) => l.id === selectedId)
                      ? "lead"
                      : jobs.find((j) => j.id === selectedId)
                      ? "job"
                      : "client";
                    linkMutation.mutate({ entityType: type, entityId: selectedId });
                  }
                }}
              >
                {linkMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Link Call
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-3 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name (optional)</label>
              <Input
                placeholder="Contact name"
                value={newLeadData.contact_name}
                onChange={(e) =>
                  setNewLeadData({ ...newLeadData, contact_name: e.target.value })
                }
                className="h-9"
              />
            </div>

            <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded px-3 py-2">
              Phone number will be {callRecord.phone_number}
            </p>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={createLeadMutation.isPending} onClick={() => createLeadMutation.mutate()}>
                {createLeadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Lead
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}