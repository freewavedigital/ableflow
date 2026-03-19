import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

function buildMonthlyData(invoices) {
  const map = {};
  for (const inv of invoices) {
    if (!inv.created_date) continue;
    const key = format(new Date(inv.created_date), "MMM yy");
    if (!map[key]) map[key] = { month: key, revenue: 0, count: 0 };
    if (inv.status === "paid") map[key].revenue += inv.total || 0;
    map[key].count += 1;
  }
  return Object.values(map).slice(-6);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-primary">Revenue: <span className="font-bold">${payload[0]?.value?.toLocaleString()}</span></p>
    </div>
  );
};

export default function RevenueChart({ invoices }) {
  const data = buildMonthlyData(invoices);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Monthly Revenue (Paid Invoices)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No invoice data in range</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}