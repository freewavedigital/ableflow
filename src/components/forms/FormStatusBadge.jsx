import React from "react";

const CONFIG = {
  draft:    { label: "Draft",    className: "bg-muted text-muted-foreground" },
  active:   { label: "Active",   className: "bg-green-100 text-green-700" },
  archived: { label: "Archived", className: "bg-amber-100 text-amber-700" },
};

export default function FormStatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.draft;
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}