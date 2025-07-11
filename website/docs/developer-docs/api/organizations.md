---
sidebar_position: 3
---

# Organizations API

Organization endpoints handle multi-tenant organization management, membership, and related functionality. All organization routes are mounted at `/api/organizations`.

## 🏢 Organization Management

### Create Organization

- **POST** `/api/organizations`
- **Role:** SystemAdmin only
- **Body:** `{ name, slug, description?, website? }`
- **Response:** `{ message, organization }`
- **Description:** Creates a new organization. Only SystemAdmins can create organizations.

### List All Organizations

- **GET** `/api/organizations`
- **Role:** SystemAdmin only
- **Query Parameters:**
  - `search` (string, optional): Search term for organization name or description
  - `page` (integer, optional): Page number for pagination (default: 1)
  - `limit` (integer, optional): Number of organizations per page (default: 20)
- **Response:** `{ organizations: [...], pagination: { page, limit, total, totalPages } }`
- **Description:** Get all organizations in the system. Only accessible to SystemAdmins.

### Get User's Organizations

- **GET** `/api/organizations/me`
- **Authentication:** Required
- **Response:** `{ organizations: [...] }`
- **Description:** Retrieve organizations that the authenticated user is a member of.

### Get Organization by Slug

- **GET** `/api/organizations/slug/:orgSlug`
- **Authentication:** Required (must be member)
- **Response:** `{ organization }`
- **Description:** Retrieve organization details using the organization slug.

### Get Organization by ID

- **GET** `/api/organizations/:organizationId`
- **Authentication:** Required (must be member)
- **Response:** `{ organization }`
- **Description:** Retrieve organization details using the organization ID.

### Update Organization

- **PUT** `/api/organizations/:organizationId`
- **Role:** Organization Admin only
- **Body:** `{ name?, description?, website? }`
- **Response:** `{ message, organization }`
- **Description:** Update organization details.

### Delete Organization

- **DELETE** `/api/organizations/:organizationId`
- **Role:** SystemAdmin only
- **Response:** `{ message }`
- **Description:** Delete an organization and all its associated data.

## 👥 Organization Membership

### Add Member to Organization

- **POST** `/api/organizations/:organizationId/members`
- **Role:** Organization Admin only
- **Body:** `{ userId, role }` (role: `org_admin` or `org_viewer`)
- **Response:** `{ message }`
- **Description:** Add a new member to an organization.

### Update Member Role

- **PUT** `/api/organizations/:organizationId/members/:userId`
- **Role:** Organization Admin only
- **Body:** `{ role }` (role: `org_admin` or `org_viewer`)
- **Response:** `{ message }`
- **Description:** Update a member's role in an organization.

### Remove Member

- **DELETE** `/api/organizations/:organizationId/members/:userId`
- **Role:** Organization Admin only
- **Response:** `{ message }`
- **Description:** Remove a member from an organization.

## 🎪 Organization Events

### Create Event in Organization

- **POST** `/api/organizations/:organizationId/events`
- **Role:** Organization Admin only
- **Body:** `{ name, slug, description?, startDate?, endDate?, website?, contactEmail? }`
- **Response:** `{ message, event }`
- **Description:** Create a new event within an organization.

### List Organization Events

- **GET** `/api/organizations/:organizationId/events`
- **Authentication:** Required (must be member)
- **Query Parameters:**
  - `search` (string, optional): Search term for event name or description
  - `isActive` (boolean, optional): Filter by active status
  - `page` (integer, optional): Page number for pagination (default: 1)
  - `limit` (integer, optional): Number of events per page (default: 20)
- **Response:** `{ events: [...], pagination: { page, limit, total, totalPages } }`
- **Description:** Retrieve events belonging to an organization.

## 🖼️ Organization Logo Management

### Upload Organization Logo

- **POST** `/api/organizations/:organizationId/logo`
- **Role:** Organization Admin only
- **Content-Type:** `multipart/form-data`
- **Body:** Form data with `logo` file field
- **Response:** `{ message }`
- **Description:** Upload a logo for an organization.

### Upload Organization Logo by Slug

- **POST** `/api/organizations/slug/:orgSlug/logo`
- **Role:** Organization Admin only
- **Content-Type:** `multipart/form-data`
- **Body:** Form data with `logo` file field
- **Response:** `{ message }`
- **Description:** Upload a logo for an organization using slug.

### Get Organization Logo

- **GET** `/api/organizations/:organizationId/logo`
- **Authentication:** Not required
- **Response:** Binary image data
- **Description:** Retrieve organization logo.

### Get Organization Logo by Slug

- **GET** `/api/organizations/slug/:orgSlug/logo`
- **Authentication:** Not required
- **Response:** Binary image data
- **Description:** Retrieve organization logo using slug.

## 📧 Organization Invite Management

### Get Organization Invite Details (Public)

- **GET** `/api/organizations/invite/:code`
- **Authentication:** Not required
- **Response:** `{ organization, invite }`
- **Description:** Retrieve details about an organization invite link. Public endpoint.

### Create Organization Invite Link

- **POST** `/api/organizations/:organizationId/invites`
- **Role:** Organization Admin only
- **Body:** `{ role, expiresAt?, maxUses?, note? }`
- **Response:** `{ message, invite }`
- **Description:** Create a new invite link for an organization.

### Get Organization Invite Links

- **GET** `/api/organizations/:organizationId/invites`
- **Role:** Organization Admin only
- **Response:** `{ invites: [...] }`
- **Description:** Retrieve all invite links for an organization.

### Update Organization Invite Link

- **PATCH** `/api/organizations/:organizationId/invites/:inviteId`
- **Role:** Organization Admin only
- **Body:** `{ disabled?, note? }`
- **Response:** `{ message }`
- **Description:** Update an existing invite link (e.g., disable it).

### Use Organization Invite Link

- **POST** `/api/organizations/invite/:code/use`
- **Authentication:** Required
- **Response:** `{ message, organization, role }`
- **Description:** Accept an organization invite and join the organization. 