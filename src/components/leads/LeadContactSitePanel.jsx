import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, User, Building2, Pencil, Check, X } from "lucide-react";

function EditableRow({ label, value, onSave, type = "text", placeholder = "" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const save = () => {
    onSave(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value || "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        <div className="flex gap-1.5">
          <Input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-8 text-sm flex-1"
            placeholder={placeholder}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          />
          <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={save}><Check className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={cancel}><X className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 group">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || <span className="text-muted-foreground/50 font-normal">Not set</span>}</p>
      </div>
      <button
        onClick={() => { setDraft(value || ""); setEditing(true); }}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Pencil className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}

export default function LeadContactSitePanel({ enquiry, onUpdate }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* Contact Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EditableRow label="Full Name" value={enquiry.contact_name} onSave={(v) => onUpdate("contact_name", v)} placeholder="Contact name" />
          <div className="flex items-center justify-between gap-2 group">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Phone</p>
              {enquiry.contact_phone ? (
                <a href={`tel:${enquiry.contact_phone}`} className="text-sm font-medium text-primary hover:underline">
                  {enquiry.contact_phone}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground/50">Not set</p>
              )}
            </div>
            <button
              onClick={() => {}}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <Phone className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <EditableRow label="Phone" value={enquiry.contact_phone} onSave={(v) => onUpdate("contact_phone", v)} placeholder="e.g. 0400 000 000" />
          <EditableRow label="Email" value={enquiry.contact_email} onSave={(v) => onUpdate("contact_email", v)} type="email" placeholder="email@example.com" />
          {enquiry.contact_email && (
            <a href={`mailto:${enquiry.contact_email}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Mail className="w-3 h-3" /> Send email
            </a>
          )}
          {enquiry.previous_customer && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1">
              <Check className="w-3 h-3" /> Returning customer
            </div>
          )}
        </CardContent>
      </Card>

      {/* Site / Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Site Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EditableRow label="Street Address" value={enquiry.site_address} onSave={(v) => onUpdate("site_address", v)} placeholder="123 Example St" />
          <EditableRow label="Suburb" value={enquiry.site_suburb} onSave={(v) => onUpdate("site_suburb", v)} placeholder="Suburb" />
          <div className="grid grid-cols-2 gap-3">
            <EditableRow label="State" value={enquiry.site_state} onSave={(v) => onUpdate("site_state", v)} placeholder="NSW" />
            <EditableRow label="Postcode" value={enquiry.site_postcode} onSave={(v) => onUpdate("site_postcode", v)} placeholder="2000" />
          </div>
          {enquiry.site_address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent([enquiry.site_address, enquiry.site_suburb, enquiry.site_state].filter(Boolean).join(", "))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <MapPin className="w-3 h-3" /> Open in Maps
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}