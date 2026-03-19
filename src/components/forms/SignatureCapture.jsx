import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, RotateCcw } from "lucide-react";

export default function SignatureCapture({ onCapture, disabled = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const startDrawing = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1f2937";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL("image/png");
    onCapture(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground">Sign below</label>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Eraser className="w-3 h-3" />
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        disabled={disabled}
        className="w-full border-2 border-border rounded-lg bg-white cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={isEmpty || disabled}
          className="flex-1"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Clear
        </Button>
        <Button
          type="button"
          onClick={handleCapture}
          disabled={isEmpty || disabled}
          className="flex-1"
        >
          Capture Signature
        </Button>
      </div>
    </div>
  );
}