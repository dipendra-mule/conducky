import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IncidentForm } from '@/components/IncidentForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileText } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function NewIncident() {
  const router = useRouter();
  const { eventSlug } = router.query;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fetch event details
  useEffect(() => {
    if (!eventSlug || Array.isArray(eventSlug)) return;
    
    async function fetchEvent() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events/slug/${eventSlug}`,
          { credentials: "include" }
        );
        
        if (!res.ok) {
          if (res.status === 404) {
            setError("Event not found");
          } else if (res.status === 403) {
            setError("You don't have permission to submit incidents to this event");
          } else {
            setError("Failed to load event details");
          }
          return;
        }
        
        const data = await res.json();
        setEvent(data.event);
      } catch {
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventSlug]);

  const handleSuccess = () => {
    // Navigate to the user's incidents page after successful submission
    // This shows them their newly created incident in context
    router.push(`/events/${eventSlug}/my-incidents`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="p-4 sm:p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-4 w-1/3"></div>
              <div className="h-4 bg-muted rounded mb-2 w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="p-4 sm:p-8">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold mb-2">Unable to Load Event</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="p-4 sm:p-8">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
              <p className="text-muted-foreground mb-4">The requested event could not be found.</p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Submit New Incident</h1>
              <p className="text-muted-foreground mt-1">
                Submit an incident for <span className="font-medium">{event.name}</span>
              </p>
            </div>
            
            <Button variant="outline" asChild>
              <Link href={`/events/${eventSlug}/incidents`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Incidents
              </Link>
            </Button>
          </div>
        </div>

        {/* Incident Form */}
        <IncidentForm
          eventSlug={eventSlug as string}
          eventName={event.name}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
} 