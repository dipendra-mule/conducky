import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { SafeReactMarkdown } from "@/components/ui/secure-markdown";
import { Card } from "../../../components/ui/card";

interface Event {
  id: string;
  name: string;
  slug: string;
  codeOfConduct?: string;
}

export default function EventCodeOfConductPage() {
  const router = useRouter();
  const { eventSlug } = router.query;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!eventSlug) return;
    setLoading(true);
    fetch(
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") +
        `/api/events/slug/${eventSlug}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error("Event not found");
        return res.json();
      })
      .then((data) => {
        setEvent(data.event);
        setLoading(false);
      })
      .catch(() => {
        setError("Event not found");
        setLoading(false);
      });
  }, [eventSlug]);

  if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;
  if (error || !event)
    return (
      <div className="p-8 text-center text-lg text-red-600">
        {error || "Event not found"}
      </div>
    );

  return (
    <div className="font-sans min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 flex flex-col items-center py-8">
      <Card className="max-w-2xl w-full p-6 sm:p-10 mx-auto">
        <h1 className="text-2xl font-bold mb-2">Code of Conduct</h1>
        <h2 className="text-lg font-semibold mb-6 text-gray-700 dark:text-gray-300">
          for {event.name}
        </h2>
        {event.codeOfConduct ? (
          <div className="prose dark:prose-invert max-h-[70vh] overflow-y-auto">
            <SafeReactMarkdown content={event.codeOfConduct} />
          </div>
        ) : (
          <div className="text-gray-500 italic">
            No code of conduct provided for this event.
          </div>
        )}
      </Card>
    </div>
  );
} 