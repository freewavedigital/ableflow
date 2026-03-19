import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquarePlus,
  CalendarDays,
  Briefcase,
  Users,
  FileText,
  Receipt,
  Menu,
  X,
  Droplets,
  Settings,
  ClipboardList,
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

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const perms = usePermissions();
  const { user } = useAuth();

  const navItems = [
    { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard, show: true },
    { label: "Enquiries", path: "/Enquiries", icon: MessageSquarePlus, show: perms.canViewLeads },
    { label: "Schedule", path: "/Schedule", icon: CalendarDays, show: perms.canViewSchedule },
    { label: "Jobs", path: "/Jobs", icon: Briefcase, show: perms.canViewJobs },
    { label: "Clients", path: "/Clients", icon: Users, show: perms.canManageClients },
    { label: "Quotes", path: "/Quotes", icon: FileText, show: perms.canManageQuotes },
    { label: "Invoices", path: "/Invoices", icon: Receipt, show: perms.canManageInvoices },
    { label: "Tasks", path: "/Tasks", icon: ClipboardList, show: perms.canViewTasks },
  ].filter((i) => i.show);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Droplets className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-sidebar-foreground">
                Able Leak Detection
              </h1>
              <p className="text-xs text-sidebar-foreground/50">Operations</p>
            </div>
            <button
              className="ml-auto lg:hidden text-sidebar-foreground/50"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Branch Selector */}
          <div className="px-3 py-3 border-b border-sidebar-border">
            <BranchSelector />
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-sidebar-border text-xs text-sidebar-foreground/40">
            ALD Ops v1.0
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border lg:px-6">
          <button
            className="lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}