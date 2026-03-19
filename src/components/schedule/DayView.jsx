import React, { useState } from "react";
import { format } from "date-fns";
import JobCard from "./JobCard";
import RescheduleDialog from "./RescheduleDialog";
import { Clock } from "lucide-react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am–6pm

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function detectConflicts(jobs) {
  const conflictIds = new Set();
  for (let i = 0; i < jobs.length; i++) {
    for (let j = i + 1; j < jobs.length; j++) {
      const a = jobs[i];
      const b = jobs[j];
      if (
        a.assigned_technician &&
        a.assigned_technician === b.assigned_technician &&
        a.scheduled_time_start &&
        b.scheduled_time_start
      ) {
        const aStart = timeToMinutes(a.scheduled_time_start);
        const aEnd = timeToMinutes(a.scheduled_time_end) || aStart + 60;
        const bStart = timeToMinutes(b.scheduled_time_start);
        const bEnd = timeToMinutes(b.scheduled_time_end) || bStart + 60;
        if (aStart < bEnd && aEnd > bStart) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
  }
  return conflictIds;
}

export default function DayView({ selectedDay, jobs, technicians }) {
  const dateStr = format(selectedDay, "yyyy-MM-dd");
  const [rescheduleJob, setRescheduleJob] = useState(null);

  const dayJobs = jobs.filter((j) => j.scheduled_date === dateStr);
  const timedJobs = dayJobs.filter((j) => j.scheduled_time_start);
  const untimedJobs = dayJobs.filter((j) => !j.scheduled_time_start);
  const conflictIds = detectConflicts(timedJobs);

  // Group timed jobs by hour
  const byHour = {};
  HOURS.forEach((h) => { byHour[h] = []; });
  timedJobs.forEach((job) => {
    const h = parseInt(job.scheduled_time_start.split(":")[0], 10);
    if (byHour[h] !== undefined) byHour[h].push(job);
    else if (h >= 7 && h <= 18) byHour[h] = [job];
  });

  return (
    <>
      <div className="flex gap-5">
        {/* Time grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {HOURS.map((hour, idx) => {
              const label = hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;
              const hourJobs = byHour[hour] || [];
              return (
                <div
                  key={hour}
                  className={`flex min-h-[64px] ${idx < HOURS.length - 1 ? "border-b border-border/60" : ""}`}
                >
                  {/* Hour label */}
                  <div className="w-14 flex-shrink-0 flex items-start justify-end pr-3 pt-2">
                    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                  </div>
                  {/* Job slots */}
                  <div className="flex-1 p-1.5 space-y-1">
                    {hourJobs.map((job) => (
                      <div key={job.id} className="cursor-pointer" onClick={() => setRescheduleJob(job)}>
                        <JobCard
                          job={job}
                          hasConflict={conflictIds.has(job.id)}
                          compact={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Untimed / all-day jobs */}
        {untimedJobs.length > 0 && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Time not set
              </p>
              <div className="space-y-2">
                {untimedJobs.map((job) => (
                  <div key={job.id} className="cursor-pointer" onClick={() => setRescheduleJob(job)}>
                    <JobCard job={job} compact={false} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {dayJobs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No jobs scheduled for this day.
        </div>
      )}

      {rescheduleJob && (
        <RescheduleDialog
          job={rescheduleJob}
          technicians={technicians}
          onClose={() => setRescheduleJob(null)}
        />
      )}
    </>
  );
}