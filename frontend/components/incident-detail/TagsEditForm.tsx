import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TagIcon, X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsEditFormProps {
  initialTags: Tag[];
  eventSlug: string;
  onSave: (tags: Tag[]) => void;
  onCancel: () => void;
}

export function TagsEditForm({ 
  initialTags, 
  eventSlug, 
  onSave, 
  onCancel 
}: TagsEditFormProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch available tags for the event
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/api/tags/event/slug/${eventSlug}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (err) {
        console.error("Error fetching tags:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventSlug) {
      fetchTags();
    }
  }, [eventSlug]);

  const handleTagAdd = (tagId: string) => {
    const tag = availableTags.find(t => t.id === tagId);
    if (tag && !selectedTags.find(t => t.id === tagId)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedTags);
    } finally {
      setSaving(false);
    }
  };

  const unselectedTags = availableTags.filter(
    tag => !selectedTags.find(selected => selected.id === tag.id)
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">Loading tags...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              style={{ 
                backgroundColor: `${tag.color}20`, 
                borderColor: tag.color,
                color: tag.color 
              }}
              className="border flex items-center gap-1"
            >
              <TagIcon className="h-3 w-3" />
              {tag.name}
              <button
                type="button"
                onClick={() => handleTagRemove(tag.id)}
                className="ml-1 hover:text-destructive"
                aria-label={`Remove ${tag.name} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector dropdown */}
      {unselectedTags.length > 0 && (
        <Select onValueChange={handleTagAdd}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Add a tag..." />
          </SelectTrigger>
          <SelectContent>
            {unselectedTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Save/Cancel buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
} 