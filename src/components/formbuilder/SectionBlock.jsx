import React, { useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, Trash2, Plus, Pencil, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FieldPreview from "./FieldPreview";
import { Droppable, Draggable } from "@hello-pangea/dnd";

export default function SectionBlock({
  section,
  sectionIndex,
  selectedFieldId,
  onSelectField,
  onUpdateSection,
  onDeleteSection,
  onAddField,
  onDeleteField,
  onDuplicateField,
  logicRules,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  const saveTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim()) onUpdateSection({ ...section, title: titleDraft.trim() });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 border-b border-border">
        <button onClick={() => setCollapsed((c) => !c)} className="text-muted-foreground hover:text-foreground">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {editingTitle ? (
          <div className="flex-1 flex items-center gap-1.5">
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
              className="h-7 text-sm flex-1"
              autoFocus
            />
            <button onClick={saveTitle} className="text-primary hover:text-primary/80">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            className="flex-1 text-left text-sm font-semibold text-foreground hover:text-primary"
            onClick={() => setEditingTitle(true)}
          >
            {section.title || "Untitled Section"}
            <Pencil className="inline w-3 h-3 ml-1.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </button>
        )}

        <span className="text-xs text-muted-foreground">{section.fields.length} fields</span>

        <button
          onClick={() => onDeleteSection(section.id)}
          className="text-muted-foreground hover:text-destructive ml-1"
          title="Delete section"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fields */}
      {!collapsed && (
        <Droppable droppableId={section.id} type="FIELD">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 space-y-2 min-h-[60px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
            >
              {section.fields.length === 0 && !snapshot.isDraggingOver && (
                <div className="border-2 border-dashed border-border rounded-xl py-6 text-center text-sm text-muted-foreground">
                  Drop fields here or click a type from the palette
                </div>
              )}
              {section.fields.map((field, fieldIndex) => (
                <Draggable key={field.id} draggableId={field.id} index={fieldIndex}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={dragSnapshot.isDragging ? "opacity-80 shadow-lg" : ""}
                    >
                      <FieldPreview
                        field={field}
                        isSelected={selectedFieldId === field.id}
                        onSelect={() => onSelectField(field)}
                        onDelete={() => onDeleteField(section.id, field.id)}
                        onDuplicate={() => onDuplicateField(section.id, field)}
                        dragHandleProps={dragProvided.dragHandleProps}
                        hasLogic={(logicRules || []).some(
                          (r) =>
                            r.target_field_key === field.field_key ||
                            (r.conditions || []).some((c) => c.trigger_field_key === field.field_key)
                        )}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}

      {/* Add field to section */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-8 text-xs text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary"
            onClick={() => onAddField(section.id, "text")}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Field to Section
          </Button>
        </div>
      )}
    </div>
  );
}