import { useAuth } from "@/lib/AuthContext";

/**
 * Role hierarchy:
 *   head_office  → global access, template/standards management
 *   branch_manager → branch-wide ops + financials
 *   admin        → branch leads, clients, jobs, schedule, comms
 *   technician   → assigned jobs only, no admin/commercial visibility
 */

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || "technician";
  const userBranchId = user?.branch_id || null;

  const is = (r) => role === r;
  const isAtLeast = (r) => {
    const levels = { technician: 0, admin: 1, branch_manager: 2, head_office: 3 };
    return (levels[role] ?? 0) >= (levels[r] ?? 0);
  };

  return {
    role,
    userBranchId,

    // --- Identity checks ---
    isTechnician: is("technician"),
    isAdmin: is("admin"),
    isBranchManager: is("branch_manager"),
    isHeadOffice: is("head_office"),

    // --- Feature-level gates ---

    // Can view and manage leads/enquiries
    canManageLeads: isAtLeast("admin"),

    // Can view leads (read-only for technicians — they don't see leads at all)
    canViewLeads: isAtLeast("admin"),

    // Can manage client records
    canManageClients: isAtLeast("admin"),

    // Can manage job records (create, edit, reassign)
    canManageJobs: isAtLeast("admin"),

    // Can view jobs (technicians see assigned jobs only — enforced at query level)
    canViewJobs: true,

    // Can access schedule / dispatch board
    canViewSchedule: isAtLeast("admin"),

    // Can reassign technicians on jobs
    canReassignTechnicians: isAtLeast("admin"),

    // Can view and manage quotes
    canManageQuotes: isAtLeast("admin"),

    // Can view and manage invoices
    canManageInvoices: isAtLeast("branch_manager"),

    // Can view financial data (totals, invoice status)
    canViewFinancials: isAtLeast("branch_manager"),

    // Can manage job type templates
    canManageTemplates: isAtLeast("head_office"),

    // Can manage branch settings
    canManageBranches: isAtLeast("head_office"),

    // Can view all branches (head office only)
    canViewAllBranches: is("head_office"),

    // Can manage users and roles
    canManageUsers: isAtLeast("head_office"),

    // Can view communications log
    canViewCommsLog: isAtLeast("admin"),

    // Can send communications (email/SMS)
    canSendComms: isAtLeast("admin"),

    // Can manage agreements
    canManageAgreements: isAtLeast("admin"),

    // Can view task/reminder list
    canViewTasks: true,

    // Can manage tasks for others (not just own)
    canManageAllTasks: isAtLeast("admin"),

    // --- Branch scoping helper ---
    // Returns a filter object to scope queries. Pass to entity.filter()
    branchFilter: (extraFilters = {}) => {
      if (is("head_office")) return extraFilters; // no branch restriction
      if (userBranchId) return { branch_id: userBranchId, ...extraFilters };
      return extraFilters;
    },

    // For technicians: also filter by assigned_technician
    technicianJobFilter: (userEmail) => {
      if (isAtLeast("admin")) {
        return userBranchId ? { branch_id: userBranchId } : {};
      }
      // Technician: only assigned jobs in their branch
      return { branch_id: userBranchId, assigned_technician: userEmail };
    },
  };
}