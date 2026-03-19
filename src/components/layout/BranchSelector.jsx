import React from "react";
import { useBranch } from "@/hooks/useBranch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export default function BranchSelector() {
  const { branches, selectedBranchId, setSelectedBranchId, isLoading } = useBranch();

  if (isLoading) {
    return (
      <div className="h-9 bg-sidebar-accent rounded-lg animate-pulse" />
    );
  }

  return (
    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
      <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-sm h-9">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/50" />
          <SelectValue placeholder="All Branches" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Branches</SelectItem>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}