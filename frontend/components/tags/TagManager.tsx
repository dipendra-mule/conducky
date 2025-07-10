import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
  eventId: string;
  incidentCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface TagManagerProps {
  eventSlug: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#EC4899', // pink
  '#6B7280', // gray
];

export function TagManager({ eventSlug }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    color: DEFAULT_COLORS[0]
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch tags
  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/api/events/slug/${eventSlug}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch event data');
      }
      
      const eventData = await response.json();
      const eventId = eventData.event.id;
      
      const tagsResponse = await fetch(`${apiBase}/api/tags/event/${eventId}`, {
        credentials: 'include'
      });
      
      if (!tagsResponse.ok) {
        throw new Error('Failed to fetch tags');
      }
      
      const tagsData = await tagsResponse.json();
      setTags(tagsData.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [eventSlug]);

  // Create tag
  const handleCreateTag = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Tag name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Get event ID first
      const eventResponse = await fetch(`${apiBase}/api/events/slug/${eventSlug}`, {
        credentials: 'include'
      });
      
      if (!eventResponse.ok) {
        throw new Error('Failed to fetch event data');
      }
      
      const eventData = await eventResponse.json();
      
      const response = await fetch(`${apiBase}/api/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          eventId: eventData.event.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tag');
      }

      const result = await response.json();
      setTags(prev => [...prev, result.tag]);
      setFormData({ name: '', color: DEFAULT_COLORS[0] });
      setCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Tag created successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create tag',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update tag
  const handleUpdateTag = async () => {
    if (!editingTag || !formData.name.trim()) return;

    try {
      setSubmitting(true);
      
      const response = await fetch(`${apiBase}/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tag');
      }

      const result = await response.json();
      setTags(prev => prev.map(tag => tag.id === editingTag.id ? result.tag : tag));
      setEditingTag(null);
      setFormData({ name: '', color: DEFAULT_COLORS[0] });
      
      toast({
        title: "Success",
        description: "Tag updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update tag',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete tag
  const handleDeleteTag = async (tag: Tag) => {
    try {
      const response = await fetch(`${apiBase}/api/tags/${tag.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tag');
      }

      setTags(prev => prev.filter(t => t.id !== tag.id));
      setDeletingTag(null);
      
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error", 
        description: err instanceof Error ? err.message : 'Failed to delete tag',
        variant: "destructive",
      });
    }
  };

  // Start editing
  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Manage Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading tags...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Manage Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Manage Tags ({tags.length})
          </CardTitle>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <div className="space-y-2 mb-4">
                <DialogTitle>Create New Tag</DialogTitle>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tag-name">Tag Name</Label>
                  <Input
                    id="tag-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter tag name"
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tag-color">Color</Label>
                  <div className="flex gap-2 mt-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-primary' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                  <Input
                    id="tag-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="mt-2 w-20 h-10"
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      setFormData({ name: '', color: DEFAULT_COLORS[0] });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTag} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Tag'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {tags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tags created yet. Create your first tag to start categorizing incidents.
          </div>
        ) : (
          <div className="space-y-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge
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
                  
                  {tag.incidentCount !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {tag.incidentCount} incident{tag.incidentCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Dialog open={editingTag?.id === tag.id} onOpenChange={(open) => {
                    if (!open) {
                      setEditingTag(null);
                      setFormData({ name: '', color: DEFAULT_COLORS[0] });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(tag)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <div className="space-y-2 mb-4">
                        <DialogTitle>Edit Tag</DialogTitle>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-tag-name">Tag Name</Label>
                          <Input
                            id="edit-tag-name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter tag name"
                            maxLength={50}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-tag-color">Color</Label>
                          <div className="flex gap-2 mt-2">
                            {DEFAULT_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                className={`w-8 h-8 rounded-full border-2 ${
                                  formData.color === color ? 'border-primary' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select color ${color}`}
                              />
                            ))}
                          </div>
                          <Input
                            id="edit-tag-color"
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                            className="mt-2 w-20 h-10"
                          />
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingTag(null);
                              setFormData({ name: '', color: DEFAULT_COLORS[0] });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateTag} disabled={submitting}>
                            {submitting ? 'Updating...' : 'Update Tag'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog open={deletingTag?.id === tag.id} onOpenChange={(open) => {
                    if (!open) setDeletingTag(null);
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTag(tag)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                        <div className="text-sm text-muted-foreground">
                          Are you sure you want to delete the tag &quot;{tag.name}&quot;? 
                          {tag.incidentCount && tag.incidentCount > 0 && (
                            <>
                              {' '}This tag is currently used on {tag.incidentCount} incident{tag.incidentCount !== 1 ? 's' : ''}.
                            </>
                          )}
                          {' '}This action cannot be undone.
                        </div>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                          onClick={() => handleDeleteTag(tag)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Tag
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 