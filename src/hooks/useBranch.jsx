import React, { createContext, useContext, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const [selectedBranchId, setSelectedBranchId] = useState("all");

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => base44.entities.Branch.list(),
  });

  return (
    <BranchContext.Provider
      value={{ branches, selectedBranchId, setSelectedBranchId, isLoading }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be inside BranchProvider");
  return ctx;
}