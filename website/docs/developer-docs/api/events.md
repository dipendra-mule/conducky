---
sidebar_position: 4
---

# Events API

Event endpoints handle event management, user roles, and event-specific operations. Events are the core organizational unit within organizations. Routes are available at both `/api/events` and `/events`.

## 🎪 Event Information

### Get Event by ID

- **GET** `/api/events/:eventId`
- **Role:** Admin or SystemAdmin for the event
- **Response:** `{ event }`

### Get Event by Slug (Public)

- **GET** `/api/events/slug/:slug` or `/events/slug/:slug`
- **Description:** Get event details by slug (public endpoint)
- **Response:** `{ event }`

### Update Event

- **PATCH** `/api/events/slug/:slug` or `/events/slug/:slug`
- **Role:** Admin or SystemAdmin for the event
- **Body:** `{ name?, newSlug?, description?, logo?, startDate?, endDate?, website?, codeOfConduct?, contactEmail? }` (at least one required)
- **Response:** `{ event }`

### Get User Roles for Event

- **GET** `/api/events/slug/:slug/my-roles` or `/events/slug/:slug/my-roles`
- **Description:** Get the authenticated user's roles for a specific event.
- **Authentication:** Required
- **Response:** `{ roles: [...] }`

## 👥 Event User Management

### List Users for Event (by ID)

- **GET** `/api/events/:eventId/users`
- **Role:** Admin or SystemAdmin for the event
- **Response:** `{ users }`

### List Users for Event (by Slug)

- **GET** `/api/events/slug/:slug/users` or `/events/slug/:slug/users`
- **Role:** Reporter, Responder, Admin, or SystemAdmin for the event
- **Query Parameters:**
  - `search` (string, optional): Filter users by name or email
  - `sort` (string, optional): Sort by `name`, `email`, or `role` (default: `name`)
  - `order` (string, optional): Sort order, `asc` or `desc` (default: `asc`)
  - `page` (integer, optional): Page number for pagination (default: 1)
  - `limit` (integer, optional): Number of users per page (default: 20)
  - `role` (string, optional): Filter users by event role
- **Response:** `{ users: [...], total: <number> }`

### Update Event User

- **PATCH** `/api/events/slug/:slug/users/:userId` or `/events/slug/:slug/users/:userId`
- **Role:** Admin or SystemAdmin for the event
- **Body:** `{ name, email, role }`
- **Response:** `{ message }`

### Remove User from Event

- **DELETE** `/api/events/slug/:slug/users/:userId` or `/events/slug/:slug/users/:userId`
- **Role:** Admin or SystemAdmin for the event
- **Response:** `{ message }`

### Get Individual User Profile

- **GET** `/api/events/slug/:slug/users/:userId` or `/events/slug/:slug/users/:userId`
- **Role:** Responder, Admin, or SystemAdmin for the event
- **Description:** Get detailed profile information for a specific user in the event
- **Response:** `{ user: { id, name, email, avatarUrl }, roles: [...], joinDate: string, lastActivity: string|null }`

### Get User Activity Timeline

- **GET** `/api/events/slug/:slug/users/:userId/activity` or `/events/slug/:slug/users/:userId/activity`
- **Role:** Responder, Admin, or SystemAdmin for the event
- **Description:** Get chronological activity timeline for a specific user in the event
- **Query Parameters:**
  - `page` (integer, optional): Page number for pagination (default: 1)
  - `limit` (integer, optional): Number of activities per page (default: 20)
- **Response:** `{ activities: [...], total: number }`
- **Activity Types:**
  - `report`: Report submissions and updates
  - `comment`: Comment additions to incidents
  - `audit`: System actions and role changes

### Get User Incidents

- **GET** `/api/events/slug/:slug/users/:userId/incidents` or `/events/slug/:slug/users/:userId/incidents`
- **Role:** Responder, Admin, or SystemAdmin for the event
- **Description:** Get all incidents submitted by or assigned to a specific user in the event
- **Query Parameters:**
  - `type` (string, optional): Filter by incident type (`submitted`, `assigned`, `all`) (default: `all`)
  - `page` (integer, optional): Page number for pagination (default: 1)
  - `limit` (integer, optional): Number of incidents per page (default: 20)
- **Response:** `{ incidents: [...], total: number }`

## 🔐 Role Management

### Assign Role to User

- **POST** `/api/events/:eventId/roles`
- **Role:** Admin or SystemAdmin for the event
- **Body:** `{ userId, roleName }`
- **Response:** `{ message, userEventRole }`

### Remove Role from User

- **DELETE** `/api/events/:eventId/roles`
- **Role:** Admin or SystemAdmin for the event
- **Body:** `{ userId, roleName }`
- **Response:** `{ message }`

## 🖼️ Event Logo Management

### Upload Event Logo (by ID)

- **POST** `/api/events/:eventId/logo`
- **Role:** Admin or SystemAdmin for the event
- **Body:** `multipart/form-data` with a `logo` file field
- **Response:** `{ event }`

### Upload Event Logo (by Slug)

- **POST** `/api/events/slug/:slug/logo` or `/events/slug/:slug/logo`
- **Role:** Admin or SystemAdmin for the event
- **Body:** `multipart/form-data` with a `logo` file field
- **Response:** `{ event }`

### Get Event Logo (by ID)

- **GET** `/api/events/:eventId/logo`
- **Description:** Fetch the event logo image for display.
- **Response:** Binary image data (or 404 if not found)

### Get Event Logo (by Slug)

- **GET** `/api/events/slug/:slug/logo` or `/events/slug/:slug/logo`
- **Description:** Fetch the event logo image for display.
- **Response:** Binary image data (or 404 if not found) 