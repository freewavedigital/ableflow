import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle2 } from "lucide-react";

function calcTechStats(jobs, users) {
  const map = {};
  for (const j of jobs) {
    const email = j.assigned_technician;
    if (!email) continue;
    if (!map[email]) map[email] = { email, total: 0, completed: 0, totalMinutes: 0, withTime: 0 };
    map[email].total += 1;
    if (["completed", "invoiced", "closed"].includes(j.status)) {
      map[email].completed += 1;
    }
    if (j.time_on_site_minutes) {
      map[email].totalMinutes += j.time_on_site_minutes;
      map[email].withTime += 1;
    }
  }

  return Object.values(map).map((t) => {
    const user = users.find((u) => u.email === t.email);
    return {
      ...t,
      name: user?.full_name || t.email.split("@")[0],
      completionRate: t.total > 0 ? Math.round((t.completed / t.total) * 100) : 0,
      avgDuration: t.withTime > 0 ? Math.round(t.totalMinutes / t.withTime) : null,
    };
  }).sort((a, b) => b.total - a.total);
}

export default function TechnicianTable({ jobs, users }) {
  const stats = calcTechStats(jobs, users);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Technician Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No assigned jobs in range</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Technician</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">Jobs</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">Completed</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Rate</span>
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Avg Time</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.map((t, i) => (
                  <tr key={t.email} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-3 py-3 text-center">{t.total}</td>
                    <td className="px-3 py-3 text-center">{t.completed}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                        t.completionRate >= 80 ? "text-green-600" : t.completionRate >= 60 ? "text-amber-600" : "text-red-500"
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {t.completionRate}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-muted-foreground">
                      {t.avgDuration != null ? `${t.avgDuration}m` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}