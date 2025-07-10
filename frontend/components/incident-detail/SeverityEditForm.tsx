import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SeverityEditFormProps {
  initialSeverity: string | null;
  onSave: (severity: string) => Promise<void>;
  onCancel: () => void;
}

export function SeverityEditForm({ initialSeverity, onSave, onCancel }: SeverityEditFormProps) {
  const [severity, setSeverity] = useState(initialSeverity || "");
  const [saving, setSaving] = useState(false);

  const severityOptions = [
    { value: "low", label: "Low", color: "text-green-600" },
    { value: "medium", label: "Medium", color: "text-yellow-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "critical", label: "Critical", color: "text-red-600" }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(severity);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={severity}
        onValueChange={setSeverity}
        disabled={saving}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select severity level" />
        </SelectTrigger>
        <SelectContent>
          {severityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className={option.color}>{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !severity}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
} 