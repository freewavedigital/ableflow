import React from "react";
import { Zap, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function UnassignedPanel({ jobs, onJobClick }) {
  if (jobs.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-amber-800 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Unassigned Jobs ({jobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onJobClick(job)}
            className="flex items-start justify-between gap-2 p-2 bg-white border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{job.contact_name || "Unknown"}</p>
              <p className="text-[11px] text-muted-foreground capitalize truncate">
                {job.job_type?.replace(/_/g, " ")}
                {job.site_suburb && ` · ${job.site_suburb}`}
              </p>
              {job.scheduled_date && (
                <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5">
                  <CalendarDays className="w-2.5 h-2.5" />
                  {job.scheduled_date}
                </p>
              )}
            </div>
            <Link
              to={`/JobDetail?id=${job.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-primary hover:underline flex-shrink-0 opacity-0 group-hover:opacity-100"
            >
              View →
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}