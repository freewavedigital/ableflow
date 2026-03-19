import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KpiTile({ icon: Icon, label, value, sub, trend, trendLabel, accent = "blue" }) {
  const accentMap = {
    blue:    { icon: "bg-blue-50 text-blue-600",    border: "border-blue-100" },
    amber:   { icon: "bg-amber-50 text-amber-600",  border: "border-amber-100" },
    green:   { icon: "bg-green-50 text-green-600",  border: "border-green-100" },
    purple:  { icon: "bg-purple-50 text-purple-600",border: "border-purple-100" },
    rose:    { icon: "bg-rose-50 text-rose-600",    border: "border-rose-100" },
    cyan:    { icon: "bg-cyan-50 text-cyan-600",    border: "border-cyan-100" },
  };
  const a = accentMap[accent] || accentMap.blue;

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-muted-foreground";

  return (
    <div className={`bg-card border ${a.border} rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.icon}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trendLabel && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trendLabel}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}