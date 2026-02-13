"use client";

import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: string;
  onChange: (newValue: string) => void;
  hasWarning?: boolean;
}

export function EditableCell({ value, onChange, hasWarning }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(value);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  }, [editValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        setEditValue(value);
        setIsEditing(false);
      }
    },
    [value],
  );

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-7 min-w-[120px] text-xs"
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={cn(
        "block cursor-pointer truncate rounded px-1 py-0.5 text-xs",
        hasWarning && "bg-yellow-100 text-yellow-800",
        !value && hasWarning && "bg-red-100 text-red-800",
      )}
      title={value || "(empty - double click to edit)"}
    >
      {value || "-"}
    </span>
  );
}
