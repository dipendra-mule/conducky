import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "../ui/badge";
import { LocationEditForm } from "./LocationEditForm";
import { IncidentDateEditForm } from "./IncidentDateEditForm";
import { PartiesEditForm } from "./PartiesEditForm";
import { DescriptionEditForm } from "./DescriptionEditForm";
import { TagsEditForm } from "./TagsEditForm";

import { useLogger } from '@/hooks/useLogger';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface IncidentMetaTableProps {
  id: string;
  description: string;
  reporter?: { name?: string; email?: string } | null;
  location?: string | null;
  incidentAt?: string | null;
  parties?: string | null;
  eventName?: string; // New: event name display
  eventSlug?: string; // Required for tag editing
  tags?: Tag[]; // New: tags display
  userRoles?: string[]; // Add userRoles for visibility control
  // Edit permissions and handlers
  canEditTags?: boolean;
  onTagsEdit?: (tags: Tag[]) => Promise<void>;
  canEditLocation?: boolean;
  canEditIncidentAt?: boolean;
  canEditParties?: boolean;
  canEditDescription?: boolean;
  onLocationEdit?: (location: string | null) => Promise<void>;
  onIncidentAtEdit?: (incidentAt: string | null) => Promise<void>;
  onPartiesEdit?: (parties: string | null) => Promise<void>;
  onDescriptionEdit?: (description: string) => Promise<void>;
}

export function IncidentMetaTable({ 
  id, 
  description, 
  reporter, 
  location, 
  incidentAt, 
  parties,
  eventName,
  eventSlug,
  tags = [],
  userRoles = [],
  canEditTags = false,
  onTagsEdit,
  canEditLocation = false,
  canEditIncidentAt = false,
  canEditParties = false,
  canEditDescription = false,
  onLocationEdit,
  onIncidentAtEdit,
  onPartiesEdit,
  onDescriptionEdit
}: IncidentMetaTableProps) {
  const { error: logError } = useLogger();
  const [editingField, setEditingField] = useState<string | null>(null);

  // Role-based visibility
  const isReporter = userRoles.includes('reporter') && !userRoles.some(r => ['responder', 'event_admin', 'system_admin'].includes(r));
  const canViewResponderFields = !isReporter; // Responders and above can see tags, severity

  // Format incident date for display
  const formatIncidentDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleEdit = async (field: string, value: string | null | Tag[]) => {
    try {
      switch (field) {
        case 'location':
          await onLocationEdit?.(value as string || null);
          break;
        case 'incidentAt':
          await onIncidentAtEdit?.(value as string | null);
          break;
        case 'parties':
          await onPartiesEdit?.(value as string | null);
          break;
        case 'description':
          await onDescriptionEdit?.(value as string || "");
          break;
        case 'tags':
          await onTagsEdit?.(value as Tag[]);
          break;
        case 'severity':
          // This case is removed as per the edit hint
          break;
      }
      setEditingField(null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logError(`Failed to update ${field}`, { field, incidentId: id }, error as Error);
      }
      // Error handling is done by the parent component
    }
  };

  const renderEditableField = (
    fieldName: string,
    displayValue: React.ReactNode,
    canEdit: boolean,
    editForm: React.ReactNode
  ) => {
    if (editingField === fieldName) {
      return editForm;
    }

    return (
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {displayValue}
        </div>
        {canEdit && (
          <button 
            type="button" 
            onClick={() => setEditingField(fieldName)} 
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation" 
            aria-label={`Edit ${fieldName}`}
          >
            <Pencil size={16} />
          </button>
        )}
      </div>
    );
  };

  const MetaField = ({ 
    label, 
    children, 
    className = "" 
  }: { 
    label: string; 
    children: React.ReactNode; 
    className?: string; 
  }) => (
    <div className={`px-4 sm:px-6 py-3 border-b border-border last:border-b-0 ${className}`}>
      <div className="text-sm font-medium text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-sm">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-0 bg-background rounded-lg border">
      <MetaField label="Incident ID">
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {id}
        </span>
      </MetaField>

      {/* New: Event Name Display */}
      {eventName && (
        <MetaField label="Event">
          <span className="font-medium">{eventName}</span>
        </MetaField>
      )}

      {/* Tags - Only visible to responders and above */}
      {canViewResponderFields && (
        <MetaField label="Tags">
          {renderEditableField(
            'tags',
            <div className="flex flex-wrap gap-2">
              {tags && tags.length > 0 ? (
                tags.map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="secondary"
                    style={{ 
                      backgroundColor: `${tag.color}20`, 
                      borderColor: tag.color,
                      color: tag.color 
                    }}
                    className="border"
                  >
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <span className="italic text-muted-foreground">No tags</span>
              )}
            </div>,
            canEditTags && !!eventSlug,
            eventSlug ? (
              <TagsEditForm
                initialTags={tags || []}
                eventSlug={eventSlug}
                onSave={(newTags) => handleEdit('tags', newTags)}
                onCancel={() => setEditingField(null)}
              />
            ) : null
          )}
        </MetaField>
      )}

      <MetaField label="Description">
        {renderEditableField(
          'description',
          <div className="whitespace-pre-wrap break-words text-foreground">
            {description}
          </div>,
          canEditDescription,
          <DescriptionEditForm
            initialDescription={description}
            onSave={(value) => handleEdit('description', value)}
            onCancel={() => setEditingField(null)}
          />
        )}
      </MetaField>

      <MetaField label="Reporter">
        <span className="font-medium">
          {reporter?.name || reporter?.email || 'Anonymous'}
        </span>
      </MetaField>

      <MetaField label="Location">
        {renderEditableField(
          'location',
          <span className="text-foreground">
            {location || <span className="italic text-muted-foreground">Not specified</span>}
          </span>,
          canEditLocation,
          <LocationEditForm
            initialLocation={location || ""}
            onSave={(value) => handleEdit('location', value)}
            onCancel={() => setEditingField(null)}
          />
        )}
      </MetaField>

      <MetaField label="Incident Date">
        {renderEditableField(
          'incidentAt',
          <span className="text-foreground">
            {formatIncidentDate(incidentAt) || <span className="italic text-muted-foreground">Not specified</span>}
          </span>,
          canEditIncidentAt,
                     <IncidentDateEditForm
             initialIncidentAt={incidentAt || null}
             onSave={(value) => handleEdit('incidentAt', value)}
             onCancel={() => setEditingField(null)}
           />
        )}
      </MetaField>

      <MetaField label="Parties Involved">
        {renderEditableField(
          'parties',
          <div className="whitespace-pre-wrap break-words text-foreground">
            {parties || <span className="italic text-muted-foreground">Not specified</span>}
          </div>,
          canEditParties,
          <PartiesEditForm
            initialParties={parties || ""}
            onSave={(value) => handleEdit('parties', value)}
            onCancel={() => setEditingField(null)}
          />
        )}
      </MetaField>
    </div>
  );
} 