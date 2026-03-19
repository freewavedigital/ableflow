import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/hooks/useBranch";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import EnquiryKanban from "@/components/enquiries/EnquiryKanban";
import EnquiryList from "@/components/enquiries/EnquiryList";
import NewEnquiryDialog from "@/components/enquiries/NewEnquiryDialog";

export default function Enquiries() {
  const [view, setView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { selectedBranchId } = useBranch();
  const queryClient = useQueryClient();

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => base44.entities.Enquiry.list("-created_date", 200),
  });

  const filtered = enquiries
    .filter((e) =>
      selectedBranchId === "all" ? true : e.branch_id === selectedBranchId
    )
    .filter(
      (e) =>
        !search ||
        e.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.contact_phone?.includes(search) ||
        e.reference_number?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <PageHeader title="Enquiries" subtitle="Lead pipeline and triage">
        <Button size="sm" onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Enquiry
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="h-9">
            <TabsTrigger value="kanban" className="text-xs px-3">
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs px-3">
              <List className="w-3.5 h-3.5 mr-1.5" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 && !search ? (
        <EmptyState
          title="No enquiries yet"
          description="Create your first enquiry to start managing leads."
        >
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Enquiry
          </Button>
        </EmptyState>
      ) : view === "kanban" ? (
        <EnquiryKanban enquiries={filtered} />
      ) : (
        <EnquiryList enquiries={filtered} />
      )}

      <NewEnquiryDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </div>
  );
}