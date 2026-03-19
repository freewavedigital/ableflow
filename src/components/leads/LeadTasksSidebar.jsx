// Thin wrapper — delegates to shared TasksSidebar
import React from "react";
import TasksSidebar from "@/components/tasks/TasksSidebar";

export default function LeadTasksSidebar({ enquiryId, enquiry }) {
  const label = enquiry
    ? `${enquiry.contact_name} — ${enquiry.service_type?.replace(/_/g, " ")}`
    : undefined;

  return (
    <TasksSidebar
      entityType="lead"
      entityId={enquiryId}
      entityLabel={label}
    />
  );
}