import React from "react";
import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { UserContext } from '../_app';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { QuickStats } from "../../components/shared/QuickStats";
import { EventCard } from "../../components/shared/EventCard";
import { ActivityFeed } from "../../components/shared/ActivityFeed";
import { JoinEventWidget } from "../../components/shared/JoinEventWidget";
import { Plus, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

// Define the user type based on how it's used in the component
interface User {
  roles?: string[];
}

// Define the UserContext type to match how it's used
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  sessionLoading: boolean;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  roles: string[];
}

export default function GlobalDashboard() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, setUser, sessionLoading } = useContext(UserContext) as UserContextType;
  const [userEvents, setUserEvents] = useState<Event[] | null>(null);
  const [userEventsLoading, setUserEventsLoading] = useState(false);
  const [userEventsError, setUserEventsError] = useState('');
  // Check authentication status and redirect if needed
  useEffect(() => {
    // Only redirect if session loading is complete and user is null
    if (!sessionLoading && user === null) {
      router.replace('/login?next=' + encodeURIComponent('/dashboard'));
    }
  }, [user, sessionLoading, router]);

  // Authenticated user: fetch their events
  useEffect(() => {
    if (user) {
      setUserEventsLoading(true);
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/users/me/events', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          setUserEvents(data.events || []);
          setUserEventsLoading(false);
        })
        .catch(() => {
          setUserEventsError('Could not load your events.');
          setUserEventsLoading(false);
        });
    }
  }, [user]);

  // Don't render anything while session is loading or user is not authenticated
  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background transition-colors duration-200 p-4">
        <Card className="w-full max-w-md text-center p-4 sm:p-8">
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  // Show empty state if user has no events
  if (userEvents && userEvents.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background transition-colors duration-200 p-4">
        <Card className="w-full max-w-md text-center p-4 sm:p-8">
          <h1 className="text-2xl font-bold mb-4 text-foreground">No Events Yet</h1>
          <p className="mb-4 text-muted-foreground">You have not been added to any events yet. Please check your email for invites or contact an event organizer.</p>
          <Link href="/profile/events" className="text-primary hover:underline font-semibold">Manage Event Invites</Link>
        </Card>
      </div>
    );
  }

  // Show loading state for user events
  if (userEventsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background transition-colors duration-200 p-4">
        <Card className="w-full max-w-md text-center p-4 sm:p-8">
          <p className="text-muted-foreground">Loading your events...</p>
        </Card>
      </div>
    );
  }

  // Show error state for user events
  if (userEventsError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background transition-colors duration-200 p-4">
        <Card className="w-full max-w-md text-center p-4 sm:p-8">
          <p className="text-destructive">{userEventsError}</p>
        </Card>
      </div>
    );
  }

  // Show global dashboard for user with one or more events
  if (userEvents && userEvents.length > 0) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Your Global Dashboard</h1>
            <p className="text-muted-foreground">Overview of your events and recent activity</p>
          </div>

          {/* Submit Report CTA Section - Prominent placement */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Need to Report an Incident?</h2>
                    <p className="text-muted-foreground">Submit an incident quickly and securely</p>
                  </div>
                </div>
                
                {userEvents.length === 1 ? (
                  // Single event - direct link
                  <Link href={`/events/${userEvents[0].slug}/incidents/new`}>
                    <Button size="lg" className="w-full sm:w-auto flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Submit Report for {userEvents[0].name}
                    </Button>
                  </Link>
                ) : (
                  // Multiple events - dropdown selector
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select an event to submit a incident:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Select 
                        value=""
                        onValueChange={(eventSlug) => {
                          if (eventSlug) {
                            router.push(`/events/${eventSlug}/incidents/new`);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-64">
                          <SelectValue placeholder="Choose an event..." />
                        </SelectTrigger>
                        <SelectContent>
                          {userEvents.map(event => (
                            <SelectItem key={event.id} value={event.slug}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{event.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({event.roles.join(', ')})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Stats Section - Full width */}
          <div className="mb-8">
            <QuickStats />
          </div>

          {/* Main Content Grid - Two columns on desktop, single column on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Activity Feed (2/3 width on desktop) */}
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>
            
            {/* Right Column - Join Event Widget (1/3 width on desktop) */}
            <div className="lg:col-span-1">
              <JoinEventWidget onJoin={() => {
                // Refetch user events after joining
                setUserEventsLoading(true);
                fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/users/me/events', {
                  credentials: 'include',
                })
                  .then(res => res.json())
                  .then(data => {
                    setUserEvents(data.events || []);
                    setUserEventsLoading(false);
                  })
                  .catch(() => {
                    setUserEventsError('Could not load your events.');
                    setUserEventsLoading(false);
                  });
              }} />
            </div>
          </div>

          {/* Events Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Your Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 