import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OUTCOME_LABELS = {
  no_issue_found: "No Issue Found",
  issue_found_quote_required: "Quote Required",
  further_testing_required: "Further Testing",
  follow_up_visit_required: "Follow-up Visit",
  repair_approved: "Repair Approved",
  completed_closed: "Closed",
  client_declined: "Client Declined",
  pending: "Pending",
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#94a3b8",
  "#f97316",
  "#a78bfa",
];

export default function JobOutcomeChart({ jobs }) {
  const counts = {};
  for (const j of jobs) {
    const key = j.outcome || "pending";
    counts[key] = (counts[key] || 0) + 1;
  }
  const data = Object.entries(counts)
    .map(([k, v]) => ({ name: OUTCOME_LABELS[k] || k, value: v }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Job Outcomes</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No job data in range</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}