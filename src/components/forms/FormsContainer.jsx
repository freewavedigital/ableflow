import React from "react";
import FormsNav from "./FormsNav";

export default function FormsContainer({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <FormsNav />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}