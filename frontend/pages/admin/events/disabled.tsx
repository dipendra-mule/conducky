import React from 'react';
import { Card } from '@/components/ui/card';

export default function DisabledEvents() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-200">
      <Card className="w-full max-w-4xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl font-bold mb-4">Disabled Events</h1>
        <p className="text-muted-foreground">Disabled events management is coming soon.</p>
        <p className="text-sm text-muted-foreground mt-2">This will show all disabled events with options to re-enable or permanently delete.</p>
      </Card>
    </div>
  );
} 