import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Globe,
  Briefcase,
  FileSignature,
  Layout,
  FileText,
  Bell,
  Share2,
  Zap,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "All Forms", path: "/Forms", icon: Layout },
  { divider: true, label: "Form Types" },
  { label: "Website Forms", path: "/Forms?type=website", icon: Globe },
  { label: "Job Forms", path: "/Forms?type=job", icon: Briefcase },
  { label: "Agreements", path: "/Forms?type=agreement", icon: FileSignature },
  { divider: true, label: "Management" },
  { label: "Automation", path: "/Forms?tab=automation", icon: Zap },
  { label: "Submissions", path: "/FormSubmissions", icon: FileText },
  { label: "Templates", path: "/Forms?tab=templates", icon: FileText },
  { divider: true, label: "Settings" },
  { label: "Notifications", path: "/Forms?tab=notifications", icon: Bell },
  { label: "Embed & Publish", path: "/Forms?tab=embed", icon: Share2 },
];

export default function FormsNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path.includes("?")) {
      const [basePath, query] = path.split("?");
      return (
        location.pathname === basePath &&
        location.search.includes(query.split("=")[1])
      );
    }
    return location.pathname === path;
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-muted/30 border-r border-border overflow-y-auto">
      <div className="p-4 space-y-1">
        {NAV_ITEMS.map((item, idx) => {
          if (item.divider) {
            return (
              <div key={`divider-${idx}`} className="pt-2 pb-1">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </p>
              </div>
            );
          }

          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground hover:bg-background"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}