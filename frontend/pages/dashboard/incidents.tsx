import React from 'react';
import { EnhancedIncidentList } from '@/components/incidents/EnhancedIncidentList';

export default function CrossEventIncidents() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 mt-8">
      <h1 className="text-3xl font-bold mb-8">All Incidents</h1>
      <EnhancedIncidentList
        showBulkActions={true}
        showPinning={true}
        showExport={true}
        className="w-full"
      />
    </div>
  );
} 