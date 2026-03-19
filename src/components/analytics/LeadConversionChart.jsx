import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_GROUPS = [
  { key: "new_lead",           label: "New",          color: "#3b82f6" },
  { key: "contact_made",       label: "Contacted",    color: "#06b6d4" },
  { key: "agreement_sent",     label: "Agreement",    color: "#a78bfa" },
  { key: "ready_to_schedule",  label: "Ready",        color: "#f59e0b" },
  { key: "converted_to_job",   label: "Converted",    color: "#10b981" },
  { key: "lost",               label: "Lost",         color: "#f43f5e" },
];

export default function LeadConversionChart({ enquiries }) {
  const counts = {};
  for (const e of enquiries) counts[e.status] = (counts[e.status] || 0) + 1;

  const data = STATUS_GROUPS.map((s) => ({
    ...s,
    value: counts[s.key] || 0,
  })).filter((d) => d.value > 0);

  const total = enquiries.length;
  const converted = counts["converted_to_job"] || 0;
  const rate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Lead Pipeline</CardTitle>
          <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
            {rate}% conversion
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No lead data in range</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip formatter={(v, n, p) => [v, p.payload.label]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}