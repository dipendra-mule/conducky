---
sidebar_position: 6
---

# Cross-Event Incidents Dashboard

The Cross-Event Incidents Dashboard provides a centralized view of all incidents across events where you have access, making it easy to manage incidents across multiple events from a single interface.

## Accessing the Dashboard

Navigate to **Dashboard > All Incidents** from the main navigation, or visit `/dashboard/incidents` directly.

## Role-Based Access

Your access to incidents depends on your role in each event:

- **Reporters**: See only incidents you've submitted across all events
- **Responders**: See all incidents in events where you're a responder, plus your own incidents in other events  
- **Admins**: See all incidents in events where you're an admin, plus role-appropriate incidents in other events

## Features

### Advanced Filtering

The dashboard provides comprehensive filtering options:

- **Search**: Search across incident titles, descriptions, and reporter names
- **Status Filter**: Filter by incident status (submitted, acknowledged, investigating, resolved, closed)
- **Event Filter**: Filter by specific events
- **Assignment Filter**: 
  - All assignments
  - Assigned to me
  - Unassigned incidents

### Sorting and Pagination

- **Sortable Columns**: Click column headers to sort by title, status, or creation date
- **Pagination**: Navigate through large result sets with page controls
- **Results Per Page**: Shows up to 50 incidents per page (configurable up to 100)

### Quick Actions

For incidents where you have appropriate permissions, quick actions are available via the actions dropdown:

#### Assignment Actions
- **Assign to Me**: Quickly assign unassigned incidents to yourself (Responders and Admins only)

#### Status Change Actions
- **Mark as Acknowledged**: Move submitted incidents to acknowledged status
- **Mark as Investigating**: Progress incidents from acknowledged to investigating
- **Mark as Resolved**: Mark investigating incidents as resolved
- **Mark as Closed**: Close resolved incidents

Available status transitions depend on the current incident status and follow the standard workflow.

### Responsive Design

The dashboard adapts to different screen sizes:

- **Desktop**: Full table view with all columns and actions
- **Mobile**: Card-based layout with essential information and actions

## Incident Information Displayed

Each incident shows:

- **Title and Description**: Brief preview of the incident
- **Event**: Which event the incident belongs to
- **Status**: Current state with color-coded badges
- **Severity**: If assigned (low, medium, high, critical)
- **Reporter**: Who submitted the incident 
- **Assignment**: Current assignee or "Unassigned"
- **Creation Date**: When the incident was submitted
- **Evidence Count**: Number of attached files
- **Comment Count**: Number of comments on the incident 

## Actions Available

### View Report
- **View Button**: Opens the full incident detail page in the event context
- Provides complete access to incident details, comments, evidence, and management tools

### Quick Actions (Role-Based)
- **Assign to Me**: Available for responders/admins on unassigned incidents
- **Status Changes**: Available based on current status and user permissions
- Actions are performed immediately and refresh the dashboard

## Navigation

From the cross-event dashboard, you can:

- **View Individual Incidents**: Click "View" to open the full incident in its event context
- **Apply Filters**: Use the filter controls to narrow down results
- **Sort Results**: Click column headers to change sort order
- **Navigate Pages**: Use pagination controls for large result sets

## Permissions and Security

- All incidents are filtered based on your actual permissions in each event
- You cannot see incidents from events where you don't have access
- Quick actions are only available where you have appropriate permissions
- All actions respect the same security rules as the individual event interfaces

## Performance

- Results are paginated for optimal performance
- Filters are applied server-side to reduce data transfer
- Real-time updates when actions are performed
- Efficient loading with skeleton states during data fetching

## Use Cases

### Multi-Event Responder
- View all incidents assigned to you across events
- Quickly assign yourself to new unassigned incidents
- Track progress of investigations across multiple events

### Event Administrator
- Monitor incident activity across all managed events
- Identify trends and patterns in incident reporting
- Ensure timely response to critical incidents

### Conference Organizer
- Get overview of incident activity across multiple conference editions
- Compare incident patterns between different events
- Maintain awareness of ongoing investigations

## Tips for Effective Use

1. **Use Filters**: Narrow down results using status, event, and assignment filters
2. **Sort by Priority**: Sort by status or creation date to prioritize work
3. **Quick Assignment**: Use "Assign to Me" for rapid response to new incidents
4. **Status Progression**: Use quick status changes to keep incidents moving through the workflow
5. **Regular Monitoring**: Check the "Assigned to me" filter regularly for your active cases

The Cross-Event Incidents Dashboard streamlines incident management across multiple events, providing the tools needed for efficient oversight and response coordination. 