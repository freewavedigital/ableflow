import React from "react";
import { Outlet } from "react-router-dom";
import CommsNav from "@/components/communications/CommsNav";

export default function CommsLayout() {
  return (
    <div className="flex h-full overflow-hidden">
      <CommsNav />
      <div className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </div>
    </div>
  );
}