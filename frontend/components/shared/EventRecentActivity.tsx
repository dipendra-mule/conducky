import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Incident {
  id: string;
  title?: string;
  type: string;
  state: string;
  createdAt: string;
  reporter?: {
    id: string;
    email?: string;
  };
}

interface EventRecentActivityProps {
  eventSlug: string;
  userRoles: string[];
}

export function EventRecentActivity({ eventSlug, userRoles }: EventRecentActivityProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = userRoles.includes("event_admin") || userRoles.includes("system_admin");
  const isResponder = userRoles.includes("responder");

  useEffect(() => {
    async function fetchRecentIncidents() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + 
          `/api/events/slug/${eventSlug}/incidents?limit=5&recent=1`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();
        setIncidents(data.incidents || []);
      } catch {
        setError("Could not load recent activity.");
      } finally {
        setLoading(false);
      }
    }
    
    if (eventSlug) {
      fetchRecentIncidents();
    }
  }, [eventSlug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return "Just now";
  };

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case "submitted": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "acknowledged": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "investigating": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {isAdmin || isResponder ? "Recent Incidents" : "Your Recent Incidents"}
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/events/${eventSlug}/incidents`} className="flex items-center gap-1">
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading recent activity...</div>
      ) : error ? (
        <div className="text-center text-destructive py-8">{error}</div>
      ) : incidents.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No incidents yet. Submit the first one!
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">
                    {incident.title || incident.type}
                  </h3>
                  <Badge className={getStateColor(incident.state)}>
                    {incident.state}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(incident.createdAt)}</span>
                  {incident.reporter && (isAdmin || isResponder) && (
                    <>
                      <span>•</span>
                      <span>by {incident.reporter.email || "anonymous"}</span>
                    </>
                  )}
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/events/${eventSlug}/incidents/${incident.id}`}>
                  View
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
} 