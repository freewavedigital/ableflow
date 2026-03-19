import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function EnquiryList({ enquiries }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Reference</TableHead>
            <TableHead className="text-xs">Contact</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Service</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Source</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enquiries.map((enq) => (
            <TableRow
              key={enq.id}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <TableCell>
                <Link
                  to={`/EnquiryDetail?id=${enq.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {enq.reference_number || enq.id?.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{enq.contact_name}</p>
                  <p className="text-xs text-muted-foreground">{enq.contact_phone}</p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {enq.service_type?.replace(/_/g, " ")}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground capitalize">
                {enq.source}
              </TableCell>
              <TableCell>
                <StatusBadge status={enq.status} />
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                {enq.created_date
                  ? format(new Date(enq.created_date), "d MMM yyyy")
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}