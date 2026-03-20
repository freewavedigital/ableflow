import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Phone,
  MessageSquare,
  Mail,
  FileText,
  Zap,
  Mic,
  ScrollText,
  ChevronRight,
} from "lucide-react";

const NAV_SECTIONS = [
  { label: "Overview", icon: LayoutGrid, path: "/Communications", exact: true },
  {
    label: "Channels",
    items: [
      { label: "Calls", icon: Phone, path: "/Communications/Calls", color: "text-primary bg-primary/10" },
      { label: "SMS", icon: MessageSquare, path: "/Communications/SMS", color: "text-green-700 bg-green-100" },
      { label: "Email", icon: Mail, path: "/Communications/Email", color: "text-blue-700 bg-blue-100" },
    ],
  },
  {
    label: "Recordings & Intelligence",
    items: [
      { label: "Call Recordings", icon: Mic, path: "/Communications/Recordings", color: "text-violet-700 bg-violet-100" },
      { label: "Transcripts", icon: ScrollText, path: "/Communications/Transcripts", color: "text-indigo-700 bg-indigo-100" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Templates", icon: FileText, path: "/Communications/Templates", color: "text-amber-700 bg-amber-100" },
      { label: "Automations", icon: Zap, path: "/Communications/Automations", color: "text-orange-700 bg-orange-100" },
    ],
  },
];

function NavItem({ item, isActive }) {
  return (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? item.color || "text-primary bg-primary/10" : "bg-muted text-muted-foreground group-hover:bg-secondary"}`}>
        <item.icon className="w-4 h-4" />
      </span>
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary/50" />}
    </Link>
  );
}

export default function CommsNav() {
  const location = useLocation();

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Communications</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Calls, messages & automation</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV_SECTIONS.map((section) => {
          if (!section.items) {
            // Top-level single item
            return (
              <NavItem
                key={section.path}
                item={section}
                isActive={isActive(section.path, section.exact)}
              />
            );
          }
          return (
            <div key={section.label}>
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    isActive={isActive(item.path)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}