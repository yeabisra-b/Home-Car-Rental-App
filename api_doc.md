# Rental Property Management System - API Contract

This contract was revised against the project requirements in `Final Project I.pdf` and the current codebase in this repository.

## Design Notes

- Preserve existing route paths for authentication, properties, rental units, and admin management.
- Standardize the contract on email-based login, UUID resource identifiers, ISO 8601 UTC timestamps, wrapped single-resource responses, and paginated list responses.
- Prefer expanding payloads and adding a small number of missing routes over renaming existing routes.
- Keep in-app messages plus notifications in MVP.
- Defer user reporting and moderation workflows from the short-build MVP.

## Base URL

`http://localhost:3000/api/v1`

## Authentication

All endpoints except public ones require:

`Authorization: Bearer <access_token>`

Public endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /admin/create-admin` only when bootstrapping the very first admin account

## Global Conventions

### Resource IDs

- All primary IDs are UUID strings.
- Route params named `:propertyId`, `:unitId`, `:leaseId`, `:invoiceId`, `:requestId`, `:messageId`, `:notificationId`, and `:userId` are UUIDs.

### Dates and Times

- All timestamps use ISO 8601 UTC format, for example `2026-03-26T09:30:00Z`.
- Date-only fields use `YYYY-MM-DD`.
- Billing month is represented as the first day of the month in ISO date format, for example `2026-03-01`.

### Error Response

```json
{
  "error": "Human-readable error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

`errors` is optional and is mainly used for validation failures.

### Pagination

List endpoints use `page` and `limit`.

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

### Single-Resource Response Envelopes

Use wrapped objects instead of returning a bare entity:

- `{ "user": { ... } }`
- `{ "property": { ... } }`
- `{ "unit": { ... } }`
- `{ "lease": { ... } }`
- `{ "invoice": { ... } }`
- `{ "request": { ... } }`
- `{ "message": { ... } }`
- `{ "announcement": { ... } }`
- `{ "notification": { ... } }`

### Common Enums

- User roles: `OWNER`, `TENANT`, `ADMIN`
- Account status: `ACTIVE`, `INACTIVE`, `SUSPENDED`
- Property type: `BUILDING`, `VEHICLE`
- Property status: `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `DELETED`
- Unit status: `VACANT`, `OCCUPIED`, `MAINTENANCE`, `UNAVAILABLE`
- Lease status: `DRAFT`, `ACTIVE`, `TERMINATED`, `EXPIRED`
- Invoice status: `UNPAID`, `PENDING_REVIEW`, `PAID`, `OVERDUE`
- Maintenance status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `OWNER_REJECTED`, `TENANT_REJECTED`, `CANCELLED`, `CLOSED`
- Maintenance priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- Notification type: `MESSAGE`, `ANNOUNCEMENT`, `MAINTENANCE`, `INVOICE`, `SYSTEM`

## 1. Authentication and User Management

### 1.1 Register account

**POST** `/auth/register`

Roles: Public

Request body:

```json
{
  "email": "owner@example.com",
  "password": "secure123",
  "firstName": "John",
  "middleName": "Leslie",
  "lastName": "Doe",
  "phoneNumber": "+251911223344",
  "role": "OWNER"
}
```

Rules:

- Public registration only allows `OWNER` or `TENANT`.
- If `role` is omitted, default to `TENANT`.
- Email must be unique.

Response `201 Created`:

```json
{
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "firstName": "John",
    "middleName": "Leslie",
    "lastName": "Doe",
    "phoneNumber": "+251911223344",
    "role": "OWNER",
    "accountStatus": "ACTIVE",
    "profilePictureUrl": null,
    "createdAt": "2026-03-26T09:30:00Z"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### 1.2 Login

**POST** `/auth/login`

Roles: Public

Request body:

```json
{
  "email": "owner@example.com",
  "password": "secure123"
}
```

Response `200 OK`:

```json
{
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "OWNER",
    "accountStatus": "ACTIVE"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### 1.3 Refresh token

**POST** `/auth/refresh-token`

Roles: Public

Request body:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Response `200 OK`:

```json
{
  "accessToken": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token"
}
```

### 1.4 Logout

**POST** `/auth/logout`

Roles: OWNER, TENANT, ADMIN

Response `200 OK`:

```json
{
  "message": "Logged out successfully"
}
```

### 1.5 Get current profile

**GET** `/auth/profile`

Roles: OWNER, TENANT, ADMIN

Response `200 OK`:

```json
{
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "firstName": "John",
    "middleName": "Leslie",
    "lastName": "Doe",
    "phoneNumber": "+251911223344",
    "role": "OWNER",
    "accountStatus": "ACTIVE",
    "profilePictureUrl": "https://...",
    "createdAt": "2026-03-26T09:30:00Z"
  }
}
```

### 1.6 Update profile

**PUT** `/auth/profile`

Roles: OWNER, TENANT, ADMIN

Partial updates allowed.

Request body:

```json
{
  "firstName": "New",
  "middleName": "Middle",
  "lastName": "Name",
  "phoneNumber": "+251900000000",
  "profilePictureUrl": "https://..."
}
```

Response `200 OK`:

```json
{
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "firstName": "New",
    "middleName": "Middle",
    "lastName": "Name"
  }
}
```

### 1.7 Upload profile picture

**POST** `/upload/user-profile/:userId`

Roles: OWNER, TENANT, ADMIN

Content type: `multipart/form-data`

Form fields:

- `file` required

Response `200 OK`:

```json
{
  "user": {
    "id": "uuid",
    "profilePictureUrl": "/api/v1/download/user-profile/uuid"
  },
  "fileName": "sanitized-name-timestamp.jpg"
}
```

### 1.8 Download profile picture

**GET** `/download/user-profile/:userId`

Roles: Public

Returns the file content.

## 2. Properties

### 2.1 Register property

**POST** `/properties`

Roles: OWNER

Request body for building:

```json
{
  "title": "Sunrise Apartments",
  "description": "Modern building in Bole",
  "type": "BUILDING",
  "addressCity": "Addis Ababa",
  "addressStreet": "Bole Road",
  "addressSubCity": "Bole",
  "addressWoreda": "03",
  "addressHouseNumber": "22",
  "buildingDetails": {
    "buildingType": "APARTMENT",
    "totalFloors": 5,
    "totalUnits": 20,
    "hasParking": true,
    "hasElevator": true,
    "hasSecurity": false,
    "yearBuilt": 2021,
    "amenities": ["Water tank", "Guard room"]
  }
}
```

Request body for vehicle:

```json
{
  "title": "Toyota Corolla 2020",
  "description": "Well-maintained sedan",
  "type": "VEHICLE",
  "addressCity": "Addis Ababa",
  "addressStreet": "Mexico",
  "addressSubCity": "Kirkos",
  "addressWoreda": "08",
  "vehicleDetails": {
    "plateNumber": "AA-12345",
    "vehicleType": "SEDAN",
    "brand": "Toyota",
    "model": "Corolla",
    "manufactureYear": 2020,
    "color": "White",
    "transmissionType": "AUTOMATIC",
    "fuelType": "PETROL",
    "engineCapacity": "1.8L",
    "mileage": 50000
  }
}
```

Response `201 Created`:

```json
{
  "property": {
    "id": "uuid",
    "ownerId": "uuid",
    "title": "Sunrise Apartments",
    "type": "BUILDING",
    "status": "ACTIVE",
    "addressCity": "Addis Ababa",
    "addressStreet": "Bole Road",
    "addressSubCity": "Bole",
    "addressWoreda": "03",
    "addressHouseNumber": "22",
    "buildingDetails": {},
    "vehicleDetails": null,
    "createdAt": "2026-03-26T09:30:00Z"
  }
}
```

### 2.2 List properties

**GET** `/properties`

Roles: OWNER, TENANT, ADMIN

Query parameters:

- `type`
- `city`
- `ownerId` admin only
- `status` property status only
- `page`
- `limit`

Role behavior:

- OWNER sees only their own properties unless explicitly widened later by admin-only tooling.
- TENANT sees active properties that are available for browsing.
- ADMIN sees all properties and may filter by `ownerId`.

Response `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Sunrise Apartments",
      "type": "BUILDING",
      "status": "ACTIVE",
      "addressCity": "Addis Ababa",
      "rentalUnits": [
        {
          "id": "uuid",
          "unitIdentifier": "A-101",
          "status": "VACANT",
          "rentAmount": 5000
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 2.3 Get property

**GET** `/properties/:propertyId`

Roles: OWNER, TENANT, ADMIN

Response `200 OK`:

```json
{
  "property": {
    "id": "uuid",
    "owner": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "owner@example.com"
    },
    "media": [],
    "rentalUnits": [],
    "buildingDetails": {},
    "vehicleDetails": null
  }
}
```

### 2.4 Update property

**PUT** `/properties/:propertyId`

Roles: OWNER for own properties, ADMIN

Partial update body:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "addressCity": "Addis Ababa",
  "addressStreet": "Airport Road",
  "addressSubCity": "Bole",
  "addressWoreda": "04",
  "addressHouseNumber": "11",
  "status": "MAINTENANCE",
  "buildingDetails": {
    "hasSecurity": true
  }
}
```

Response `200 OK`:

```json
{
  "property": {
    "id": "uuid",
    "title": "Updated title"
  }
}
```

### 2.5 Delete property

**DELETE** `/properties/:propertyId`

Roles: OWNER for own properties, ADMIN

Rules:

- Reject deletion if the property still has occupied units or active leases.

Response `204 No Content`

### 2.6 Upload property or unit media

**POST** `/upload/property-media/:propertyId`

Roles: OWNER

Content type: `multipart/form-data`

Form fields:

- `file` required
- `unitId` optional, use when the media belongs to a specific rental unit
- `description` optional
- `isPrimary` optional boolean

Supported files:

- Images for property galleries
- PDFs for property documents
- Optional videos if the implementation keeps current media model support

Response `201 Created`:

```json
{
  "media": {
    "id": "uuid",
    "propertyId": "uuid",
    "unitId": "uuid",
    "mediaType": "IMAGE",
    "isPrimary": false,
    "description": "Front entrance"
  },
  "fileName": "sanitized-name-timestamp.jpg"
}
```

### 2.7 Delete property media

**DELETE** `/properties/media/:mediaId`

Roles: OWNER, ADMIN

Response `204 No Content`

### 2.8 Download property or unit media

**GET** `/download/property-media/:mediaId`

Roles: Public for active properties, OWNER for own, ADMIN

Returns the file content.

## 3. Rental Units

### 3.1 Add rental unit

**POST** `/properties/:propertyId/units`

Roles: OWNER

Request body:

```json
{
  "unitIdentifier": "A-101",
  "bedrooms": 2,
  "bathrooms": 1,
  "areaSqMeters": 82.5,
  "rentAmount": 5000,
  "depositAmount": 10000,
  "status": "VACANT",
  "description": "Spacious apartment",
  "amenities": ["Balcony", "Built-in kitchen"],
  "floorNumber": 3
}
```

Response `201 Created`:

```json
{
  "unit": {
    "id": "uuid",
    "propertyId": "uuid",
    "unitIdentifier": "A-101",
    "rentAmount": 5000,
    "status": "VACANT"
  }
}
```

### 3.2 Search units

**GET** `/units`

Roles: OWNER, TENANT, ADMIN

Query parameters:

- `propertyId`
- `minRent`
- `maxRent`
- `bedrooms`
- `status`
- `city`
- `page`
- `limit`

Role behavior:

- OWNER sees units from their own properties.
- TENANT sees browseable units.
- ADMIN sees all units.

Response `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "unitIdentifier": "A-101",
      "rentAmount": 5000,
      "status": "VACANT",
      "property": {
        "id": "uuid",
        "title": "Sunrise Apartments",
        "addressCity": "Addis Ababa"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 3.3 Get unit

**GET** `/units/:unitId`

Roles: OWNER, TENANT, ADMIN

Response `200 OK`:

```json
{
  "unit": {
    "id": "uuid",
    "property": {
      "id": "uuid",
      "ownerId": "uuid"
    },
    "currentLease": {
      "id": "uuid",
      "status": "ACTIVE"
    }
  }
}
```

### 3.4 Update unit

**PUT** `/units/:unitId`

Roles: OWNER for own units, ADMIN

Partial update body:

```json
{
  "rentAmount": 5500,
  "depositAmount": 10000,
  "status": "MAINTENANCE",
  "description": "Temporarily unavailable",
  "amenities": ["Balcony", "Wi-Fi ready"]
}
```

Response `200 OK`:

```json
{
  "unit": {
    "id": "uuid",
    "rentAmount": 5500,
    "status": "MAINTENANCE"
  }
}
```

### 3.5 Delete unit

**DELETE** `/units/:unitId`

Roles: OWNER for own units, ADMIN

Rules:

- Reject deletion if the unit has an active lease or is still occupied.

Response `204 No Content`

## 4. Lease Management

### 4.1 Create lease

**POST** `/leases`

Roles: OWNER

Request body:

```json
{
  "unitId": "uuid",
  "tenantId": "uuid",
  "tenantEmail": "tenant@example.com",
  "startDate": "2026-04-01",
  "endDate": "2027-03-31",
  "monthlyRent": 5000,
  "depositAmount": 10000
}
```

Rules:

- Provide either `tenantId` or `tenantEmail`.
- If both are provided they must resolve to the same tenant.
- Only one active or draft lease can exist for a unit at a time.
- Newly created leases start in `DRAFT`.

Response `201 Created`:

```json
{
  "lease": {
    "id": "uuid",
    "unitId": "uuid",
    "tenantId": "uuid",
    "startDate": "2026-04-01",
    "endDate": "2027-03-31",
    "monthlyRent": 5000,
    "depositAmount": 10000,
    "status": "DRAFT"
  }
}
```

### 4.2 List leases

**GET** `/leases`

Roles:

- OWNER sees leases for owned properties
- TENANT sees their own leases
- ADMIN sees all leases

Query parameters:

- `status`
- `unitId`
- `tenantId` admin only
- `page`
- `limit`

### 4.3 Get lease

**GET** `/leases/:leaseId`

Roles: OWNER if they own the unit, TENANT if it is their lease, ADMIN

Response `200 OK`:

```json
{
  "lease": {
    "id": "uuid",
    "status": "ACTIVE",
    "unit": {},
    "tenant": {},
    "documents": []
  }
}
```

### 4.4 Upload signed lease document

**POST** `/upload/lease-document/:leaseId`

Roles: OWNER

Content type: `multipart/form-data`

Form fields:

- `file` required PDF
- `documentType` optional, defaults to `SIGNED`

Rules:

- Uploading the first signed document activates the lease and marks the unit as occupied.

Response `201 Created`:

```json
{
  "document": {
    "id": "uuid",
    "leaseId": "uuid",
    "documentType": "SIGNED"
  },
  "lease": {
    "id": "uuid",
    "status": "ACTIVE"
  },
  "fileName": "sanitized-name-timestamp.pdf"
}
```

### 4.5 Download lease document

**GET** `/download/lease-document/:documentId`

Roles: OWNER if they own the unit, TENANT if it is their lease, ADMIN

Returns the file content.

### 4.6 Terminate lease by tenant

**POST** `/leases/:leaseId/terminate`

Roles: TENANT

Request body:

```json
{
  "reason": "Moving out after lease completion"
}
```

Rules:

- Allowed only for the tenant's own lease.
- Allowed when lease end date has been reached or passed.
- Successful termination updates lease status and frees the unit.

Response `200 OK`:

```json
{
  "lease": {
    "id": "uuid",
    "status": "TERMINATED"
  }
}
```

### 4.7 Submit move-out notice

**POST** `/leases/:leaseId/move-out-notice`

Roles: TENANT

Request body:

```json
{
  "noticeDate": "2026-12-01",
  "note": "Planning to vacate at month end"
}
```

Rules:

- Records the tenant's notice on the lease.
- Creates a notification for the owner.

Response `200 OK`:

```json
{
  "lease": {
    "id": "uuid",
    "moveOutNoticeDate": "2026-12-01"
  },
  "message": "Move-out notice recorded"
}
```

### 4.8 Remove tenant from unit

**POST** `/leases/:leaseId/remove-tenant`

Roles: OWNER

Request body:

```json
{
  "reason": "Payment overdue for more than 30 days"
}
```

Rules:

- Only for owned leases.
- Use when lease has expired or business rules allow owner removal.
- On success, terminate the lease and mark the unit vacant.

Response `200 OK`:

```json
{
  "lease": {
    "id": "uuid",
    "status": "TERMINATED"
  }
}
```

## 5. Invoices and Payments

### 5.1 List invoices

**GET** `/invoices`

Roles:

- TENANT sees own invoices
- OWNER sees invoices for owned leases
- ADMIN sees all

Query parameters:

- `status`
- `leaseId`
- `billingMonth`
- `page`
- `limit`

### 5.2 Get invoice

**GET** `/invoices/:invoiceId`

Response `200 OK`:

```json
{
  "invoice": {
    "id": "uuid",
    "leaseId": "uuid",
    "billingMonth": "2026-03-01",
    "amountDue": 5000,
    "dueDate": "2026-03-05",
    "status": "UNPAID",
    "receipts": []
  }
}
```

### 5.3 Upload payment receipt

**POST** `/upload/payment-receipt/:invoiceId`

Roles: TENANT

Content type: `multipart/form-data`

Form fields:

- `file` required
- `transactionRef` optional
- `paymentMethod` optional

Rules:

- Tenants can upload receipts only for their own invoice.
- Upload sets invoice status to `PENDING_REVIEW`.
- Owner and admin are notified.

Response `201 Created`:

```json
{
  "receipt": {
    "id": "uuid",
    "invoiceId": "uuid",
    "transactionRef": "TX99231",
    "paymentMethod": "BANK_TRANSFER"
  },
  "invoice": {
    "id": "uuid",
    "status": "PENDING_REVIEW"
  },
  "fileName": "sanitized-name-timestamp.pdf"
}
```

### 5.4 Download payment receipt

**GET** `/download/payment-receipt/:receiptId`

Roles: OWNER for owned leases, TENANT for own invoices, ADMIN

Returns the file content.

### 5.5 Review invoice payment status

**PUT** `/invoices/:invoiceId/status`

Roles: OWNER for owned leases, ADMIN

Request body:

```json
{
  "status": "PAID",
  "reviewNote": "Receipt amount verified"
}
```

Allowed transitions:

- `UNPAID` to `PENDING_REVIEW` happens through receipt upload
- `PENDING_REVIEW` to `PAID`
- `PENDING_REVIEW` to `UNPAID` when the receipt is rejected
- `UNPAID` to `OVERDUE` through scheduled job
- `OVERDUE` to `PAID` after valid review

Response `200 OK`:

```json
{
  "invoice": {
    "id": "uuid",
    "status": "PAID",
    "reviewNote": "Receipt amount verified"
  }
}
```

### 5.6 Generate monthly invoices

**POST** `/invoices/generate-monthly`

Roles: ADMIN

Request body optional:

```json
{
  "billingMonth": "2026-04-01"
}
```

Rules:

- This route is a manual trigger for the same logic used by the scheduled monthly invoice job.
- Must be idempotent for a given lease and billing month.

Response `200 OK`:

```json
{
  "message": "Monthly invoice generation completed",
  "billingMonth": "2026-04-01",
  "generatedCount": 42,
  "skippedCount": 3
}
```

### Scheduled payment jobs

These are backend jobs, not user-facing endpoints:

- Monthly invoice generation for active leases
- Daily overdue check that moves unpaid invoices to `OVERDUE`
- Daily rent reminder notifications for unpaid and overdue invoices

## 6. Maintenance Requests

### 6.1 Create maintenance request

**POST** `/maintenance-requests`

Roles: TENANT

Request body:

```json
{
  "unitId": "uuid",
  "category": "Plumbing",
  "priority": "HIGH",
  "description": "Water leakage in bathroom"
}
```

Rules:

- Tenant must belong to the unit through an active lease.
- New request starts in `OPEN`.

Response `201 Created`:

```json
{
  "request": {
    "id": "uuid",
    "unitId": "uuid",
    "tenantId": "uuid",
    "category": "Plumbing",
    "priority": "HIGH",
    "description": "Water leakage in bathroom",
    "status": "OPEN",
    "createdAt": "2026-03-26T09:30:00Z"
  }
}
```

### 6.2 List maintenance requests

**GET** `/maintenance-requests`

Roles:

- TENANT sees own requests
- OWNER sees requests for owned units
- ADMIN sees all

Query parameters:

- `status`
- `unitId`
- `page`
- `limit`

### 6.3 Get maintenance request

**GET** `/maintenance-requests/:requestId`

Response `200 OK`:

```json
{
  "request": {
    "id": "uuid",
    "status": "OPEN",
    "evidence": []
  }
}
```

### 6.4 Update maintenance status

**PUT** `/maintenance-requests/:requestId/status`

Roles: OWNER for owned units, ADMIN

Request body:

```json
{
  "status": "RESOLVED",
  "note": "Plumber visited and replaced the damaged pipe"
}
```

Rules:

- Allowed owner actions: `OPEN` to `IN_PROGRESS`, `OPEN` to `REJECTED`, `IN_PROGRESS` to `RESOLVED`, `IN_PROGRESS` to `REJECTED`
- Set `resolvedAt` when status becomes `RESOLVED`
- Notify the tenant on every status change

Response `200 OK`:

```json
{
  "request": {
    "id": "uuid",
    "status": "RESOLVED",
    "note": "Plumber visited and replaced the damaged pipe",
    "resolvedAt": "2026-03-26T09:30:00Z"
  }
}
```

### 6.5 Upload maintenance evidence

**POST** `/upload/maintenance-evidence/:requestId`

Roles: TENANT

Content type: `multipart/form-data`

Form fields:

- `file` required

Response `201 Created`:

```json
{
  "evidence": {
    "id": "uuid",
    "requestId": "uuid"
  },
  "fileName": "sanitized-name-timestamp.jpg"
}
```

### 6.6 Download maintenance evidence

**GET** `/download/maintenance-evidence/:evidenceId`

Roles: OWNER for owned units, TENANT for own requests, ADMIN

Returns the file content.

## 7. Communication

### 7.1 Send message

**POST** `/messages`

Roles: OWNER, TENANT, ADMIN

Request body:

```json
{
  "receiverId": "uuid",
  "subject": "Question about property",
  "content": "Is the apartment still available?"
}
```

Rules:

- Sender cannot message themselves.
- Create an in-app notification for the receiver.
- Email delivery is an optional side effect and should not block the request.

Response `201 Created`:

```json
{
  "message": {
    "id": "uuid",
    "senderId": "uuid",
    "receiverId": "uuid",
    "subject": "Question about property",
    "content": "Is the apartment still available?",
    "readAt": null,
    "createdAt": "2026-03-26T09:30:00Z"
  }
}
```

### 7.2 List messages

**GET** `/messages`

Roles: OWNER, TENANT, ADMIN

Query parameters:

- `page`
- `limit`

Behavior:

- Returns a flat list of the authenticated user's inbox and sent messages sorted newest first.

### 7.3 List conversations

**GET** `/messages/conversations`

Roles: OWNER, TENANT, ADMIN

Response `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "firstName": "Arthur",
        "lastName": "Sterling"
      },
      "propertyTitle": "THE HEIGHTS - PENTHOUSE B",
      "lastMessage": "The architectural revisions for the terrace look...",
      "time": "2026-03-26T14:20:00Z",
      "unread": true
    }
  ]
}
```

### 7.4 Get message

**GET** `/messages/:messageId`

Roles: sender, receiver, ADMIN

Response `200 OK`:

```json
{
  "message": {
    "id": "uuid",
    "sender": {},
    "receiver": {},
    "readAt": null
  }
}
```

### 7.4 Mark message as read

**PUT** `/messages/:messageId/read`

Roles: receiver, ADMIN

Response `200 OK`:

```json
{
  "message": {
    "id": "uuid",
    "readAt": "2026-03-26T09:30:00Z"
  }
}
```

### 7.5 Send announcement

**POST** `/announcements`

Roles: OWNER

Request body:

```json
{
  "title": "Maintenance Notice",
  "content": "Water will be off tomorrow from 9am to 12pm.",
  "propertyId": "uuid"
}
```

Rules:

- `propertyId` is optional.
- If `propertyId` is present, only tenants with active leases in that property should receive the announcement.
- If `propertyId` is absent, deliver to tenants in the owner's currently occupied properties.

Response `201 Created`:

```json
{
  "announcement": {
    "id": "uuid",
    "ownerId": "uuid",
    "propertyId": "uuid",
    "title": "Maintenance Notice",
    "content": "Water will be off tomorrow from 9am to 12pm.",
    "createdAt": "2026-03-26T09:30:00Z"
  }
}
```

### 7.6 List announcements

**GET** `/announcements`

Roles: OWNER, TENANT, ADMIN

Role behavior:

- OWNER sees announcements they created
- TENANT sees announcements relevant to their active lease or current owner relationship
- ADMIN sees all announcements

Query parameters:

- `propertyId` optional
- `page`
- `limit`

### 7.7 List notifications

**GET** `/notifications`

Roles: OWNER, TENANT, ADMIN

Query parameters:

- `isRead`
- `page`
- `limit`

Response `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "INFO",
      "message": "You have a new message",
      "isRead": false,
      "createdAt": "2026-03-26T09:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 7.8 Mark notification as read

**PUT** `/notifications/:notificationId/read`

Roles: notification owner, ADMIN

Response `200 OK`:

```json
{
  "notification": {
    "id": "uuid",
    "isRead": true
  }
}
```

## 8. Dashboard and Reports

### 8.1 Get owner dashboard stats

**GET** `/dashboard/owner/stats`

Roles: OWNER

Response `200 OK`:

```json
{
  "propertiesCount": 24,
  "unitsCount": 158,
  "occupancyRate": 96,
  "activeLeasesCount": 142,
  "urgentRequestsCount": 12,
  "revenueMTD": 455700
}
```

### 8.2 Get tenant dashboard stats

**GET** `/dashboard/tenant/stats`

Roles: TENANT

Response `200 OK`:

```json
{
  "currentRentAmount": 4250,
  "daysUntilDue": 5,
  "pendingRequestsCount": 2,
  "unreadMessagesCount": 3
}
```

### 8.3 Get cash flow forecast

**GET** `/reports/cash-flow`

Roles: OWNER, ADMIN

Response `200 OK`:

```json
{
  "data": [
    { "month": "MAY", "amount": 12000 },
    { "month": "JUN", "amount": 14000 }
  ]
}
```

### 8.4 Get property performance

**GET** `/reports/property-performance`

Roles: OWNER, ADMIN

Response `200 OK`:

```json
{
  "data": [
    {
      "propertyId": "uuid",
      "name": "The Sterling Heights",
      "revenue": 142500,
      "occupancy": 100,
      "change": 4.2
    }
  ]
}
```

## 9. Admin

### 8.1 List users

**GET** `/admin/users`

Roles: ADMIN

Query parameters:

- `role`
- `accountStatus`
- `page`
- `limit`

### 8.2 Remove user

**DELETE** `/admin/users/:userId`

Roles: ADMIN

Rules:

- Reject removal when the user still owns active dependencies that the system is not prepared to cascade safely.

Response `204 No Content`

### 8.3 Create admin account

**POST** `/admin/create-admin`

Roles:

- Public only when there is no admin account in the system yet
- ADMIN after bootstrap

Request body:

```json
{
  "email": "admin@example.com",
  "password": "secure123",
  "firstName": "Admin",
  "middleName": "System",
  "lastName": "User",
  "phoneNumber": "+251900000000"
}
```

Behavior:

- First system bootstrap: create the initial admin without requiring an existing token.
- After at least one admin exists: require authenticated admin privileges.

Response `201 Created`:

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "ADMIN",
    "accountStatus": "ACTIVE"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

## 9. Deferred From Short-Build MVP

The following requirement from the PDF is acknowledged but intentionally deferred:

- User reports and moderation workflows
- `GET /admin/reports`
- Report submission endpoints
- Ban or suspension workflows beyond existing account status administration

These should not block frontend and backend parallel development for the MVP.

## 10. MVP Coverage Checklist

This contract now covers the non-deferred project use cases:

- Owner and tenant registration and login
- Admin bootstrap and user listing/removal
- Property registration, editing, deletion, and media upload/download
- Rental unit creation, updating, deletion, and search
- Lease creation, viewing, signed document upload/download, tenant notice, termination, and owner removal
- Monthly invoice generation, receipt upload/download, payment review, and overdue reminders
- Maintenance request submission, evidence upload/download, and owner status updates
- Owner-tenant messaging, announcements, and notifications
- User profile picture upload and download
