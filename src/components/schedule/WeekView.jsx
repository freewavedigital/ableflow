import React, { useState } from "react";
import { format, isSameDay, addDays, startOfWeek } from "date-fns";
import { Link } from "react-router-dom";
import JobCard from "./JobCard";
import RescheduleDialog from "./RescheduleDialog";
import { Plus } from "lucide-react";

function detectConflicts(dayJobs) {
  // Flag jobs with overlapping time slots for the same technician
  const conflictIds = new Set();
  for (let i = 0; i < dayJobs.length; i++) {
    for (let j = i + 1; j < dayJobs.length; j++) {
      const a = dayJobs[i];
      const b = dayJobs[j];
      if (
        a.assigned_technician &&
        a.assigned_technician === b.assigned_technician &&
        a.scheduled_time_start &&
        b.scheduled_time_start
      ) {
        const aStart = a.scheduled_time_start;
        const aEnd = a.scheduled_time_end || a.scheduled_time_start;
        const bStart = b.scheduled_time_start;
        const bEnd = b.scheduled_time_end || b.scheduled_time_start;
        if (aStart < bEnd && aEnd > bStart) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
  }
  return conflictIds;
}

export default function WeekView({ weekStart, jobs, technicians, onDrop }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [dragJobId, setDragJobId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [rescheduleJob, setRescheduleJob] = useState(null);

  const getJobsForDay = (date) => {
    const ds = format(date, "yyyy-MM-dd");
    return jobs
      .filter((j) => j.scheduled_date === ds)
      .sort((a, b) => (a.scheduled_time_start || "").localeCompare(b.scheduled_time_start || ""));
  };

  const handleDragStart = (e, job) => {
    e.dataTransfer.setData("jobId", job.id);
    setDragJobId(job.id);
  };

  const handleDrop = (e, date) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    if (jobId) onDrop(jobId, format(date, "yyyy-MM-dd"));
    setDragJobId(null);
    setDragOver(null);
  };

  return (
    <>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayJobs = getJobsForDay(day);
          const conflictIds = detectConflicts(dayJobs);
          const isToday = isSameDay(day, new Date());
          const isDragTarget = dragOver === format(day, "yyyy-MM-dd");

          return (
            <div
              key={day.toISOString()}
              className="flex flex-col min-h-[200px]"
              onDragOver={(e) => { e.preventDefault(); setDragOver(format(day, "yyyy-MM-dd")); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, day)}
            >
              {/* Day header */}
              <div className={`text-center py-2 rounded-t-lg text-sm ${isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{format(day, "EEE")}</p>
                <p className="text-lg font-bold leading-tight">{format(day, "d")}</p>
                {dayJobs.length > 0 && (
                  <p className="text-[10px] opacity-70">{dayJobs.length} job{dayJobs.length !== 1 ? "s" : ""}</p>
                )}
              </div>

              {/* Drop zone */}
              <div className={`flex-1 border border-t-0 border-border rounded-b-lg p-2 space-y-1.5 transition-colors ${isDragTarget ? "bg-primary/5 border-primary/40" : "bg-card"}`}>
                {dayJobs.map((job) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job)}
                    onDragEnd={() => setDragJobId(null)}
                    className="cursor-grab active:cursor-grabbing"
                    onClick={() => setRescheduleJob(job)}
                  >
                    <JobCard
                      job={job}
                      isDragging={dragJobId === job.id}
                      hasConflict={conflictIds.has(job.id)}
                      compact
                    />
                  </div>
                ))}

                {dayJobs.length === 0 && !isDragTarget && (
                  <div className="flex items-center justify-center h-full min-h-[60px]">
                    <Link
                      to={`/CreateJob?date=${format(day, "yyyy-MM-dd")}`}
                      className="opacity-0 hover:opacity-100 group-hover:opacity-100"
                    >
                      <Plus className="w-4 h-4 text-muted-foreground/40" />
                    </Link>
                  </div>
                )}
                {isDragTarget && (
                  <div className="flex items-center justify-center h-full min-h-[60px] border-2 border-dashed border-primary/40 rounded-md">
                    <p className="text-xs text-primary/60">Drop to reschedule</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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