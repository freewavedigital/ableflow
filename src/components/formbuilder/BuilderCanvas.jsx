import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import SectionBlock from "./SectionBlock";

export default function BuilderCanvas({
  sections,
  selectedFieldId,
  onSelectField,
  onUpdateSection,
  onDeleteSection,
  onAddSection,
  onAddField,
  onDeleteField,
  onDuplicateField,
  onDragEnd,
  logicRules,
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Section reordering */}
        <Droppable droppableId="SECTIONS" type="SECTION">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
              {sections.map((section, sectionIndex) => (
                <Draggable key={section.id} draggableId={`section-${section.id}`} index={sectionIndex}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={dragSnapshot.isDragging ? "opacity-80 shadow-xl" : ""}
                    >
                      {/* Section drag handle via header */}
                      <div {...dragProvided.dragHandleProps}>
                        <SectionBlock
                          section={section}
                          sectionIndex={sectionIndex}
                          selectedFieldId={selectedFieldId}
                          onSelectField={onSelectField}
                          onUpdateSection={onUpdateSection}
                          onDeleteSection={onDeleteSection}
                          onAddField={onAddField}
                          onDeleteField={onDeleteField}
                          onDuplicateField={onDuplicateField}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {sections.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-2xl py-16 text-center">
          <p className="text-muted-foreground text-sm mb-3">No sections yet</p>
          <Button variant="outline" size="sm" onClick={onAddSection}>
            <Plus className="w-4 h-4 mr-1" /> Add First Section
          </Button>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-4 border-dashed text-muted-foreground hover:text-primary hover:border-primary"
        onClick={onAddSection}
      >
        <Plus className="w-4 h-4 mr-1" /> Add Section
      </Button>
    </div>
  );
}