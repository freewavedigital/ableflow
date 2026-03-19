import React from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Circle, AlertCircle, AlarmClock, ExternalLink, User } from "lucide-react";
import { Link } from "react-router-dom";

const PRIORITY_STYLES = {
  urgent: "border-l-4 border-l-red-500",
  high:   "border-l-4 border-l-orange-400",
  normal: "",
  low:    "opacity-80",
};

const TYPE_LABELS = {
  follow_up_call:  "Call",
  send_email:      "Email",
  send_agreement:  "Agreement",
  confirm_booking: "Confirm Booking",
  chase_payment:   "Chase Payment",
  schedule_job:    "Schedule Job",
  internal_action: "Internal",
  other:           "Task",
};

const ENTITY_ROUTES = {
  lead:    "/EnquiryDetail",
  job:     "/JobDetail",
  client:  "/ClientDetail",
  quote:   "/Quotes",
  invoice: "/Invoices",
};

export default function TaskCard({ task, onComplete }) {
  const isOverdue = task._overdue;
  const isCompleted = task.status === "completed";

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow ${PRIORITY_STYLES[task.priority] || ""} ${isCompleted ? "opacity-60" : ""}`}
    >
      {/* Complete toggle */}
      <button
        onClick={() => !isCompleted && onComplete(task)}
        className="mt-0.5 flex-shrink-0"
        disabled={isCompleted}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : isOverdue ? (
          <AlertCircle className="w-5 h-5 text-red-500" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-medium text-sm ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </span>
          {task.task_type && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {TYPE_LABELS[task.task_type] || task.task_type}
            </span>
          )}
          {task.priority === "urgent" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Urgent</span>
          )}
          {task.priority === "high" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">High</span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          {task.due_date && (
            <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
              <AlarmClock className="w-3 h-3" />
              {isOverdue ? "Overdue · " : "Due "}
              {format(parseISO(task.due_date), "d MMM yyyy")}
            </span>
          )}
          {task.assigned_to && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assigned_to.split("@")[0]}
            </span>
          )}
          {task.entity_id && task.entity_type && ENTITY_ROUTES[task.entity_type] && (
            <Link
              to={`${ENTITY_ROUTES[task.entity_type]}?id=${task.entity_id}`}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {task.entity_label || `View ${task.entity_type}`}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}