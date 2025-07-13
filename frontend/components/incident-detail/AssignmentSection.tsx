import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface AssignmentFields {
  assignedResponderId?: string;
  severity?: string;
  resolution?: string;
}

interface AssignmentSectionProps {
  assignmentFields: AssignmentFields;
  setAssignmentFields: (fields: AssignmentFields) => void;
  eventUsers: User[];
  onSave: (updatedFields?: AssignmentFields) => void;
  isResponderOrAbove?: boolean;
}

export function AssignmentSection({
  assignmentFields,
  setAssignmentFields,
  eventUsers,
  onSave,
  isResponderOrAbove = false,
}: AssignmentSectionProps) {
  const [editingField, setEditingField] = useState<null | "assignedResponderId" | "severity" | "resolution">(
    null
  );
  const [localFields, setLocalFields] = useState<AssignmentFields>(assignmentFields);

  // When entering edit mode, copy current values
  function startEdit(field: "assignedResponderId" | "severity" | "resolution") {
    setEditingField(field);
    setLocalFields(assignmentFields);
  }

  function handleFieldChange(field: keyof AssignmentFields, value: string) {
    setLocalFields((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
    const updatedFields = { ...assignmentFields, ...localFields };
    setAssignmentFields(updatedFields);
    setEditingField(null);
    // Pass the updated fields to onSave so it doesn't rely on async state
    onSave(updatedFields);
  }

  function handleCancel() {
    setEditingField(null);
    setLocalFields(assignmentFields);
  }

  return (
    <div className="space-y-4">
      {/* Assigned Responder */}
      <div className="mb-2">
        <label htmlFor="assigned-responder" className="block text-sm font-medium text-foreground mb-1">Assigned Responder</label>
        <div>
          {editingField === "assignedResponderId" ? (
            <div className="flex items-center gap-2">
              <select
                id="assigned-responder"
                value={localFields.assignedResponderId || ''}
                onChange={e => handleFieldChange("assignedResponderId", e.target.value)}
                className="border px-2 py-1 rounded w-full bg-background text-foreground"
              >
                <option value="">(unassigned)</option>
                {eventUsers.map((u: User) => (
                  <option key={u.id} value={u.id}>{u.name || u.email || 'Unknown'}</option>
                ))}
              </select>
              <Button type="button" onClick={handleSave} className="bg-primary text-foreground px-2 py-1 text-xs">Save</Button>
              <Button type="button" onClick={handleCancel} className="bg-muted text-foreground px-2 py-1 text-xs">Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>
                {assignmentFields.assignedResponderId
                  ? eventUsers.find((u: User) => u.id === assignmentFields.assignedResponderId)?.name ||
                    eventUsers.find((u: User) => u.id === assignmentFields.assignedResponderId)?.email ||
                    'Unknown'
                  : '(unassigned)'}
              </span>
              <button type="button" onClick={() => startEdit("assignedResponderId")}
                className="p-1 rounded hover:bg-muted" aria-label="Edit assigned responder">
                <Pencil size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Severity - Only show to responders and above */}
      {isResponderOrAbove && (
        <div className="mb-2">
          <label htmlFor="severity" className="block text-sm font-medium text-foreground mb-1">Severity</label>
          <div>
            {editingField === "severity" ? (
              <div className="flex items-center gap-2">
                <select
                  id="severity"
                  value={localFields.severity || ''}
                  onChange={e => handleFieldChange("severity", e.target.value)}
                  className="border px-2 py-1 rounded w-full bg-background text-foreground"
                >
                  <option value="">(none)</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <Button type="button" onClick={handleSave} className="bg-primary text-foreground px-2 py-1 text-xs">Save</Button>
                <Button type="button" onClick={handleCancel} className="bg-muted text-foreground px-2 py-1 text-xs">Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{assignmentFields.severity || '(none)'}</span>
                <button type="button" onClick={() => startEdit("severity")}
                  className="p-1 rounded hover:bg-muted" aria-label="Edit severity">
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Resolution */}
      <div className="mb-2">
        <label htmlFor="resolution" className="block text-sm font-medium text-foreground mb-1">Resolution</label>
        <div>
          {editingField === "resolution" ? (
            <div className="flex items-center gap-2">
              <textarea
                id="resolution"
                value={localFields.resolution || ''}
                onChange={e => handleFieldChange("resolution", e.target.value)}
                className="border px-2 py-1 rounded w-full bg-background text-foreground min-h-[60px]"
                placeholder="Enter resolution details (required if resolved/closed)"
              />
              <Button type="button" onClick={handleSave} className="bg-primary text-foreground px-2 py-1 text-xs">Save</Button>
              <Button type="button" onClick={handleCancel} className="bg-muted text-foreground px-2 py-1 text-xs">Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{assignmentFields.resolution || <span className="italic text-muted-foreground">(none)</span>}</span>
              <button type="button" onClick={() => startEdit("resolution")}
                className="p-1 rounded hover:bg-muted" aria-label="Edit resolution">
                <Pencil size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Feedback */}
    </div>
  );
} 