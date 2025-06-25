import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SaveIcon, EyeIcon, PencilIcon } from 'lucide-react';
import { SafeReactMarkdown } from '@/components/ui/secure-markdown';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';

interface Event {
  id: string;
  name: string;
  slug: string;
  codeOfConduct?: string;
}

export default function EditCodeOfConduct() {
  const router = useRouter();
  const { eventSlug } = router.query;
  const [event, setEvent] = useState<Event | null>(null);
  const [codeOfConduct, setCodeOfConduct] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Check if user has admin permissions
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!eventSlug) return;

    const fetchEventAndPermissions = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch event details
        const eventResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events/slug/${eventSlug}`,
          { credentials: 'include' }
        );

        if (!eventResponse.ok) {
          throw new Error('Event not found');
        }

        const eventData = await eventResponse.json();
        setEvent(eventData.event);
        setCodeOfConduct(eventData.event.codeOfConduct || '');

        // Check user permissions
        const rolesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events/slug/${eventSlug}/my-roles`,
          { credentials: 'include' }
        );

        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          const isAdmin = rolesData.roles && (
            rolesData.roles.includes('event_admin') || 
            rolesData.roles.includes('system_admin')
          );
          setHasPermission(isAdmin);
        } else {
          setHasPermission(false);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event data');
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndPermissions();
  }, [eventSlug]);

  const handleSave = async () => {
    if (!event || !hasPermission) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events/slug/${event.slug}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ codeOfConduct })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update code of conduct');
      }

      const data = await response.json();
      setEvent(data.event);
      setSuccess('Code of conduct updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCodeOfConduct(event?.codeOfConduct || '');
    setIsEditing(false);
    setIsPreview(false);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
        <Card className="w-full max-w-4xl mx-auto p-4 sm:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
        <div className="w-full max-w-4xl mx-auto">
          <AppBreadcrumbs />
          <Card className="p-4 sm:p-8 mt-6">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to edit the code of conduct for this event.</p>
            <Button 
              onClick={() => router.back()} 
              className="mt-4"
            >
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
      <div className="w-full max-w-4xl mx-auto">
        <AppBreadcrumbs />
        
        <Card className="p-4 sm:p-8 mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Code of Conduct</h1>
              <p className="text-muted-foreground mt-1">
                Edit the code of conduct for {event?.name}
              </p>
            </div>
            
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPreview(!isPreview)}
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  {isPreview ? 'Edit' : 'Preview'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <SaveIcon className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {error && (
            <Alert className="mb-4 border-destructive">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500">
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {isEditing ? (
            <div className="space-y-4">
              {isPreview ? (
                <div className="border rounded-lg p-4 min-h-[400px] bg-muted/5">
                  <h3 className="text-lg font-semibold mb-4">Preview</h3>
                  {codeOfConduct ? (
                    <div className="prose max-w-none dark:prose-invert">
                      <SafeReactMarkdown content={codeOfConduct} />
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No content to preview</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="codeOfConduct" className="text-sm font-medium">
                    Code of Conduct (Markdown supported)
                  </label>
                  <Textarea
                    id="codeOfConduct"
                    value={codeOfConduct}
                    onChange={(e) => setCodeOfConduct(e.target.value)}
                    placeholder="Enter your event's code of conduct using Markdown formatting..."
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can use Markdown formatting including headers (#), lists (-), links ([text](url)), and emphasis (*italic*, **bold**).
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-6 min-h-[400px] bg-muted/5">
              {codeOfConduct ? (
                <div className="prose max-w-none dark:prose-invert">
                  <SafeReactMarkdown content={codeOfConduct} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No code of conduct has been set for this event yet.
                  </p>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Create Code of Conduct
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              The code of conduct will be accessible to all event participants at{' '}
              <code className="bg-muted px-2 py-1 rounded text-xs">
                /events/{eventSlug}/code-of-conduct
              </code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}