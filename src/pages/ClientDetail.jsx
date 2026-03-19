import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, MessageSquarePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default function ClientDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => base44.entities.Client.filter({ id }),
    select: (d) => d[0],
    enabled: !!id,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites", id],
    queryFn: () => base44.entities.Site.filter({ client_id: id }),
    enabled: !!id,
  });

  const { data: enquiries = [] } = useQuery({
    queryKey: ["client-enquiries", id],
    queryFn: () => base44.entities.Enquiry.filter({ client_id: id }, "-created_date", 20),
    enabled: !!id,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["client-jobs", id],
    queryFn: () => base44.entities.Job.filter({ client_id: id }, "-created_date", 20),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return <div className="p-6 text-center text-muted-foreground">Client not found</div>;
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link to="/Clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
      </div>

      <PageHeader
        title={`${client.first_name} ${client.last_name}`}
        subtitle={client.company_name || client.type?.replace(/_/g, " ")}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sites */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Sites / Properties ({sites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sites registered</p>
              ) : (
                <div className="space-y-3">
                  {sites.map((site) => (
                    <div key={site.id} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">{site.name || "Site"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{site.address}, {site.suburb}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="capitalize">{site.property_type?.replace(/_/g, " ")}</span>
                        {site.pool_type !== "none" && (
                          <span className="capitalize">Pool: {site.pool_type?.replace(/_/g, " ")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Jobs ({jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No jobs yet</p>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <Link key={job.id} to={`/JobDetail?id=${job.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <p className="text-sm font-medium">{job.job_number} — {job.job_type?.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{job.scheduled_date ? format(new Date(job.scheduled_date), "d MMM yyyy") : "—"}</p>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enquiries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4" />
                Enquiries ({enquiries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No enquiries</p>
              ) : (
                <div className="space-y-2">
                  {enquiries.map((enq) => (
                    <Link key={enq.id} to={`/EnquiryDetail?id=${enq.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div>
                        <p className="text-sm font-medium">{enq.reference_number} — {enq.service_type?.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{enq.created_date ? format(new Date(enq.created_date), "d MMM yyyy") : "—"}</p>
                      </div>
                      <StatusBadge status={enq.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="text-primary hover:underline">{client.phone}</a>
              </div>
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
                </div>
              )}
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{client.type?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previous Customer</span>
                  <span className="font-medium">{client.previous_customer ? "Yes" : "No"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}