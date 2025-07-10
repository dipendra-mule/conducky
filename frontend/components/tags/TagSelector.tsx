import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card } from "../ui/card";
import { X, Plus, Tag as TagIcon } from "lucide-react";

export interface Tag {
  id: string;
  name: string;
  color: string;
  eventId: string;
}

interface TagSelectorProps {
  eventSlug: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  disabled?: boolean;
  className?: string;
}

export function TagSelector({ 
  eventSlug, 
  selectedTags, 
  onTagsChange, 
  disabled = false, 
  className = "" 
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        } else {
          setError("Failed to load tags");
        }
      } catch (err) {
        setError("Failed to load tags");
        console.error("Error fetching tags:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventSlug) {
      fetchTags();
    }
  }, [eventSlug]);

  const handleTagSelect = (tagId: string) => {
    const tag = availableTags.find(t => t.id === tagId);
    if (tag && !selectedTags.find(t => t.id === tagId)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  };

  const getTagStyle = (color: string) => {
    // Convert color to appropriate background and text colors
    const colorMap: Record<string, string> = {
      'red': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'purple': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'pink': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'orange': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'gray': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'indigo': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'teal': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    };
    
    return colorMap[color] || colorMap['gray'];
  };

  // Get unselected tags for the dropdown
  const unselectedTags = availableTags.filter(
    tag => !selectedTags.find(selected => selected.id === tag.id)
  );

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-foreground">Tags</label>
        <div className="text-sm text-muted-foreground">Loading tags...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-foreground">Tags</label>
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-foreground">Tags</label>
      
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className={`${getTagStyle(tag.color)} flex items-center gap-1`}
            >
              <TagIcon className="h-3 w-3" />
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag.id)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${tag.name} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector dropdown */}
      {!disabled && unselectedTags.length > 0 && (
        <div className="space-y-2">
          <Select onValueChange={handleTagSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add a tag..." />
            </SelectTrigger>
            <SelectContent>
              {unselectedTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${getTagStyle(tag.color).split(' ')[0]}`}
                    />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {availableTags.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No tags available for this event. Contact an event administrator to create tags.
        </div>
      )}
      
      {/* All tags selected state */}
      {!disabled && availableTags.length > 0 && unselectedTags.length === 0 && selectedTags.length > 0 && (
        <div className="text-sm text-muted-foreground">
          All available tags have been selected.
        </div>
      )}
    </div>
  );
} 