import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  Briefcase,
  Users,
  FileText,
  Receipt,
  Menu,
  X,
  Droplets,
  ClipboardList,
  ChevronRight,
  Smartphone,
  Settings2,
  BarChart2,
  ClipboardCheck,
  MessageSquare,
} from "lucide-react";
import BranchSelector from "./BranchSelector";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/lib/AuthContext";

const ROLE_LABELS = {
  head_office: "Head Office",
  branch_manager: "Branch Manager",
  admin: "Admin",
  technician: "Technician",
};

// Visual divider between nav groups
function NavGroup({ label, children }) {
  return (
    <div className="mb-1">
      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
        {label}
      </p>
      {children}
    </div>
  );
}

function NavItem({ item, isActive, onClick }) {
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-semibold rounded-full leading-none">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const perms = usePermissions();
  const { user } = useAuth();

  const isTechnician = user?.role === "technician";

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const close = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm text-sidebar-foreground leading-tight">
              Able Leak
            </h1>
            <p className="text-[10px] text-sidebar-foreground/40 leading-tight">Operations</p>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/40 hover:text-sidebar-foreground"
            onClick={close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Branch Selector */}
        {!isTechnician && (
          <div className="px-3 py-2.5 border-b border-sidebar-border flex-shrink-0">
            <BranchSelector />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">

          {/* Overview — everyone */}
          <NavItem item={{ label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard }} isActive={isActive("/Dashboard")} onClick={close} />

          {/* My Jobs — Technicians & Admins */}
          {(isTechnician || user?.role === 'admin') && (
            <NavGroup label="My Jobs">
              <NavItem item={{ label: "My Jobs", path: "/MyJobs", icon: Smartphone }} isActive={isActive("/MyJobs")} onClick={close} />
              <NavItem item={{ label: "Tasks", path: "/Tasks", icon: ClipboardList }} isActive={isActive("/Tasks")} onClick={close} />
            </NavGroup>
          )}

          {/* Lead workflow — admins */}
          {!isTechnician && perms.canViewLeads && (
            <NavGroup label="Leads">
              <NavItem item={{ label: "Enquiries", path: "/Enquiries", icon: Inbox }} isActive={isActive("/Enquiries")} onClick={close} />
            </NavGroup>
          )}

          {/* Operations — admins */}
          {!isTechnician && (
            <NavGroup label="Operations">
              {perms.canViewSchedule && (
                <NavItem item={{ label: "Schedule", path: "/Schedule", icon: CalendarDays }} isActive={isActive("/Schedule")} onClick={close} />
              )}
              {perms.canViewJobs && (
                <NavItem item={{ label: "Jobs", path: "/Jobs", icon: Briefcase }} isActive={isActive("/Jobs")} onClick={close} />
              )}
              {perms.canViewTasks && (
                <NavItem item={{ label: "Tasks", path: "/Tasks", icon: ClipboardList }} isActive={isActive("/Tasks")} onClick={close} />
              )}
            </NavGroup>
          )}

          {/* Clients — admins */}
          {!isTechnician && perms.canManageClients && (
            <NavGroup label="Clients">
              <NavItem item={{ label: "Clients & Sites", path: "/Clients", icon: Users }} isActive={isActive("/Clients")} onClick={close} />
            </NavGroup>
          )}

          {/* Communications — admins */}
          {!isTechnician && (
            <NavGroup label="Communications">
              <NavItem item={{ label: "Communications Hub", path: "/Communications", icon: MessageSquare }} isActive={isActive("/Communications")} onClick={close} />
              {perms.canManageLeads && (
                <>
                  <NavItem item={{ label: "SMS Templates", path: "/SMSTemplates", icon: MessageSquare }} isActive={isActive("/SMSTemplates")} onClick={close} />
                  <NavItem item={{ label: "SMS Automation", path: "/SMSAutomation", icon: MessageSquare }} isActive={isActive("/SMSAutomation")} onClick={close} />
                </>
              )}
            </NavGroup>
          )}

          {/* Finance — admins */}
          {!isTechnician && (perms.canManageQuotes || perms.canManageInvoices) && (
            <NavGroup label="Finance">
              {perms.canManageQuotes && (
                <NavItem item={{ label: "Quotes", path: "/Quotes", icon: FileText }} isActive={isActive("/Quotes")} onClick={close} />
              )}
              {perms.canManageInvoices && (
                <NavItem item={{ label: "Invoices", path: "/Invoices", icon: Receipt }} isActive={isActive("/Invoices")} onClick={close} />
              )}
            </NavGroup>
          )}

          {/* Analytics — branch_manager+ */}
          {!isTechnician && perms.canViewFinancials && (
            <NavGroup label="Analytics">
              <NavItem item={{ label: "Analytics", path: "/Analytics", icon: BarChart2 }} isActive={isActive("/Analytics")} onClick={close} />
            </NavGroup>
          )}

          {/* Forms — admin+ */}
          {!isTechnician && perms.canManageLeads && (
            <NavGroup label="Forms">
              <NavItem item={{ label: "Forms", path: "/Forms", icon: ClipboardCheck }} isActive={isActive("/Forms")} onClick={close} />
              <NavItem item={{ label: "Submissions", path: "/FormSubmissions", icon: FileText }} isActive={isActive("/FormSubmissions")} onClick={close} />
            </NavGroup>
          )}

          {/* Settings — head office / managers */}
          {!isTechnician && perms.canManageTemplates && (
            <NavGroup label="Settings">
              <NavItem item={{ label: "Job Templates", path: "/JobTemplates", icon: Settings2 }} isActive={isActive("/JobTemplates")} onClick={close} />
            </NavGroup>
          )}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-sidebar-primary">
                {(user?.full_name || user?.email || "?")[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.full_name || user?.email}
              </p>
              <p className="text-[10px] text-sidebar-primary font-medium">
                {ROLE_LABELS[user?.role] || "Staff"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — mobile only */}
        <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border lg:hidden">
          <button
            className="text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Droplets className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Able Leak</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}