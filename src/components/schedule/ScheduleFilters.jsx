import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutGrid, Map } from "lucide-react";

const JOB_TYPES = [
  { value: "all", label: "All Job Types" },
  { value: "leak_inspection", label: "Leak Inspection" },
  { value: "structural_inspection", label: "Structural Inspection" },
  { value: "pressure_test", label: "Pressure Test" },
  { value: "scuba_dive_test", label: "Scuba Dive Test" },
  { value: "pipe_blockage", label: "Pipe Blockage" },
  { value: "repair", label: "Repair" },
  { value: "domestic_inspection", label: "Domestic Inspection" },
  { value: "service_call", label: "Service Call" },
  { value: "follow_up", label: "Follow-up" },
  { value: "other", label: "Other" },
];

export default function ScheduleFilters({
  view, setView,
  branches,
  selectedBranchId, setSelectedBranchId,
  technicians,
  filterTechnician, setFilterTechnician,
  filterJobType, setFilterJobType,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* View toggle */}
      <div className="flex rounded-md border border-border overflow-hidden">
        <button
          onClick={() => setView("week")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "week" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Week
        </button>
        <button
          onClick={() => setView("day")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "day" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
        >
          <CalendarDays className="w-3.5 h-3.5" /> Day
        </button>
        <button
          onClick={() => setView("map")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "map" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
        >
          <Map className="w-3.5 h-3.5" /> Map
        </button>
      </div>

      {/* Branch */}
      <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
        <SelectTrigger className="h-8 text-xs w-36">
          <SelectValue placeholder="Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Technician */}
      <Select value={filterTechnician} onValueChange={setFilterTechnician}>
        <SelectTrigger className="h-8 text-xs w-40">
          <SelectValue placeholder="Technician" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Technicians</SelectItem>
          <SelectItem value="unassigned">⚡ Unassigned</SelectItem>
          {technicians.map((t) => (
            <SelectItem key={t.email} value={t.email}>
              {t.full_name || t.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Job type */}
      <Select value={filterJobType} onValueChange={setFilterJobType}>
        <SelectTrigger className="h-8 text-xs w-44">
          <SelectValue placeholder="Job Type" />
        </SelectTrigger>
        <SelectContent>
          {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}