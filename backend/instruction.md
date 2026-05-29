# Backend Agent Instruction

## Goal

Build the backend for the Rental Property Management System quickly, but do it in a way that preserves the API contract in `api_doc.md`, keeps the existing route paths for implemented modules, and avoids hidden product decisions.

## Non-Negotiable Rules

- Treat `api_doc.md` as the source of truth for route paths, payloads, role behavior, and response envelopes.
- Do not rename existing auth, property, unit, or admin routes.
- Prefer adding missing models, controllers, services, and route handlers over changing public paths.
- Return wrapped single-resource responses and paginated list responses exactly as documented.
- Use UUID primary keys for all new entities.
- Use ISO 8601 UTC timestamps in API responses.
- Enforce ownership and tenant scoping in the backend even if the frontend also hides inaccessible UI.
- Do not invent extra states, extra endpoints, or alternative workflows unless the contract explicitly requires them.
- If a choice is not documented here, choose the smallest implementation that preserves the contract and testability.

## Existing Stack And Structure

- Runtime: Express + TypeScript
- ORM: Sequelize with PostgreSQL
- Existing backend structure:
  - `src/routes`
  - `src/controllers`
  - `src/models`
  - `src/middleware`
  - `src/config`
  - `src/tests`
- Existing implemented areas:
  - auth
  - admin user listing and deletion
  - properties
  - rental units
- Missing major subsystems:
  - leases
  - invoices and receipts
  - maintenance
  - messages
  - announcements
  - notifications

## Canonical Response Shape

- Single resource:
  - `{"property": {...}}`
  - `{"unit": {...}}`
  - `{"lease": {...}}`
  - `{"invoice": {...}}`
  - `{"request": {...}}`
  - `{"message": {...}}`
  - `{"announcement": {...}}`
  - `{"notification": {...}}`
- Lists:
  - `{"data": [...], "total": number, "page": number, "totalPages": number}`
- Errors:
  - `{"error": "...", "errors": [...]}` when validation details exist

## Access Control Matrix

- `OWNER`
  - manage owned properties
  - manage units under owned properties
  - create leases for owned units
  - upload signed lease documents
  - list invoices for owned leases
  - review uploaded receipts for owned leases
  - view and update maintenance requests for owned units
  - send messages
  - send announcements to relevant tenants
- `TENANT`
  - manage own session and profile
  - browse properties and units
  - view own leases
  - submit move-out notice
  - terminate own lease only after the lease end date
  - view own invoices
  - upload receipts to own invoices
  - create and view own maintenance requests
  - upload maintenance evidence to own requests
  - send and read own messages
  - view relevant announcements and notifications
- `ADMIN`
  - manage users
  - bootstrap or create further admins
  - view all records
  - run monthly invoice generation manually
  - override access checks only where the contract explicitly allows it

## Target Data Model

Use these tables and relationships. Keep naming aligned with the existing Sequelize style.

### Users

- Table: `users`
- Core fields:
  - `id`
  - `email`
  - `password`
  - `firstName`
  - `middleName`
  - `lastName`
  - `phoneNumber`
  - `role`
  - `accountStatus`
  - `profilePictureUrl`
  - `createdAt`
  - `updatedAt`

### Properties

- Table: `properties`
- Fields:
  - `id`
  - `ownerId`
  - `title`
  - `description`
  - `type`
  - `addressCity`
  - `addressStreet`
  - `addressSubCity`
  - `addressWoreda`
  - `addressHouseNumber`
  - `status`
  - `createdAt`
  - `updatedAt`

### Property Building Details

- Table: `property_buildings`
- One-to-one with `properties`
- Fields:
  - `propertyId`
  - `buildingType`
  - `totalFloors`
  - `totalUnits`
  - `hasParking`
  - `hasElevator`
  - `hasSecurity`
  - `yearBuilt`
  - `amenities`

### Property Vehicle Details

- Table: `property_vehicles`
- One-to-one with `properties`
- Fields:
  - `propertyId`
  - `plateNumber`
  - `vehicleType`
  - `brand`
  - `model`
  - `manufactureYear`
  - `color`
  - `transmissionType`
  - `fuelType`
  - `engineCapacity`
  - `mileage`

### Rental Units

- Table: `rental_units`
- Fields:
  - `id`
  - `propertyId`
  - `unitIdentifier`
  - `bedrooms`
  - `bathrooms`
  - `areaSqMeters`
  - `rentAmount`
  - `depositAmount`
  - `status`
  - `description`
  - `amenities`
  - `floorNumber`
  - `createdAt`
  - `updatedAt`
- Unique constraint:
  - `(propertyId, unitIdentifier)`

### Property Media

- Table: `property_media`
- Fields:
  - `id`
  - `propertyId`
  - `unitId` nullable
  - `fileName`
  - `originalName`
  - `filePath`
  - `fileSize`
  - `mimeType`
  - `mediaType`
  - `isPrimary`
  - `description`
  - `uploadedBy`
  - `createdAt`
  - `updatedAt`

### Leases

- Table: `leases`
- Fields:
  - `id`
  - `unitId`
  - `tenantId`
  - `startDate`
  - `endDate`
  - `monthlyRent`
  - `depositAmount`
  - `status`
  - `moveOutNoticeDate` nullable
  - `moveOutNoticeNote` nullable
  - `terminationReason` nullable
  - `terminatedAt` nullable
  - `createdAt`
  - `updatedAt`
- Business rule:
  - only one lease in `DRAFT` or `ACTIVE` per unit

### Lease Documents

- Table: `lease_documents`
- Fields:
  - `id`
  - `leaseId`
  - `documentType`
  - `filePath`
  - `uploadedBy`
  - `createdAt`

### Invoices

- Table: `invoices`
- Fields:
  - `id`
  - `leaseId`
  - `billingMonth`
  - `amountDue`
  - `dueDate`
  - `status`
  - `reviewNote` nullable
  - `reviewedBy` nullable
  - `reviewedAt` nullable
  - `createdAt`
  - `updatedAt`
- Unique constraint:
  - `(leaseId, billingMonth)`

### Payment Receipts

- Table: `payment_receipts`
- Fields:
  - `id`
  - `invoiceId`
  - `filePath`
  - `transactionRef` nullable
  - `paymentMethod` nullable
  - `uploadedBy`
  - `uploadedAt`

### Maintenance Requests

- Table: `maintenance_requests`
- Fields:
  - `id`
  - `unitId`
  - `tenantId`
  - `category`
  - `priority`
  - `description`
  - `status`
  - `note` nullable
  - `resolvedAt` nullable
  - `resolvedBy` nullable
  - `createdAt`
  - `updatedAt`

### Maintenance Evidence

- Table: `maintenance_evidence`
- Fields:
  - `id`
  - `requestId`
  - `filePath`
  - `uploadedBy`
  - `uploadedAt`

### Messages

- Table: `messages`
- Fields:
  - `id`
  - `senderId`
  - `receiverId`
  - `subject`
  - `content`
  - `readAt` nullable
  - `createdAt`

### Announcements

- Table: `announcements`
- Fields:
  - `id`
  - `ownerId`
  - `propertyId` nullable
  - `title`
  - `content`
  - `createdAt`

### Notifications

- Table: `notifications`
- Fields:
  - `id`
  - `userId`
  - `type`
  - `message`
  - `entityType` nullable
  - `entityId` nullable
  - `isRead`
  - `createdAt`

## Implementation Phases

Complete phases in order. Do not skip forward until the current phase passes its tests.

## Phase 1: Foundation, Auth, And Admin Bootstrap

### Objectives

- Normalize shared API behavior.
- Finish user management rules.
- Make admin bootstrap deterministic.

### Tasks

1. Introduce shared response helpers or a strict controller pattern for wrapped single-resource and paginated list responses.
2. Keep existing auth route paths unchanged.
3. Keep email-based authentication only. Do not add username login.
4. Update validation rules so public registration rejects `ADMIN`.
5. Implement bootstrap logic for `POST /admin/create-admin`.
6. If zero admins exist, allow public bootstrap.
7. If one or more admins exist, require an authenticated admin.
8. Keep `GET /admin/users` and `DELETE /admin/users/:userId`.
9. Preserve safe user serialization and never expose password hashes.

### Validation Rules

- Email unique and valid.
- Password required.
- Role for public registration must be `OWNER` or `TENANT`.
- Only admins can list users after bootstrap.
- User deletion must fail if protected dependencies still exist and cascade is not explicitly safe.

### Tests

- register owner
- register tenant with default role
- reject public admin creation
- login with valid credentials
- reject inactive or suspended users if the route already enforces that
- bootstrap first admin without auth
- reject second admin creation without admin auth
- create second admin with admin auth
- list users as admin
- reject list users as non-admin

### Done Criteria

- Auth routes keep the current path names.
- First admin bootstrap behavior is documented in tests.
- Response shapes match `api_doc.md`.

## Phase 2: Properties, Units, Media, And Search

### Objectives

- Keep the existing property and unit route paths.
- Align payloads with the revised contract.
- Support property-level and unit-level media from the existing media route.

### Tasks

1. Expand property model support for `addressSubCity`, `addressWoreda`, `addressHouseNumber`, and `status` if any field is missing in response serialization.
2. Ensure building details and vehicle details support the expanded contract fields.
3. Expand property media storage to allow optional `unitId`.
4. Keep `POST /properties/:propertyId/media` and use `unitId` as an optional form field instead of adding a new endpoint.
5. Make sure `GET /properties` uses `status` as property status only.
6. Keep nested unit creation at `POST /properties/:propertyId/units`.
7. Ensure unit payloads include `areaSqMeters`, `depositAmount`, `description`, `amenities`, and `floorNumber`.
8. Keep `GET /units`, `GET /units/:unitId`, `PUT /units/:unitId`, and `DELETE /units/:unitId`.
9. For tenant browsing, allow active browseable properties and units rather than owner-only filtering.
10. Preserve owner-only write access.

### Access Rules

- Owner can create, update, and delete only owned properties and units.
- Tenant can browse properties and units but cannot modify them.
- Admin can read all and may delete where allowed by the contract.

### Tests

- create building property
- create vehicle property
- list owner properties
- list tenant browseable properties
- get property details with units and media
- update property fields
- reject property update by non-owner
- add unit to owned property
- reject duplicate unit identifier in same property
- search units by city, rent, bedrooms, and status
- upload property media without `unitId`
- upload unit media with `unitId`
- reject property deletion when occupied or leased

### Done Criteria

- Existing property and unit route paths remain unchanged.
- List and detail responses include the fields the frontend needs for dashboards and forms.
- Media uploads can represent both property gallery and unit gallery items.

## Phase 3: Lease Lifecycle

### Objectives

- Introduce lease models and routes.
- Support owner-created draft leases, signed document upload, tenant notice, and termination rules.

### Tasks

1. Add routes for:
   - `POST /leases`
   - `GET /leases`
   - `GET /leases/:leaseId`
   - `POST /leases/:leaseId/documents`
   - `POST /leases/:leaseId/terminate`
   - `POST /leases/:leaseId/move-out-notice`
   - `POST /leases/:leaseId/remove-tenant`
2. Accept either `tenantId` or `tenantEmail` on lease creation.
3. Resolve `tenantEmail` to a tenant record and reject ambiguous or missing tenants.
4. Start all new leases in `DRAFT`.
5. Uploading the first signed document moves the lease to `ACTIVE` and the unit to `OCCUPIED`.
6. Tenant move-out notice stores `moveOutNoticeDate` and `moveOutNoticeNote`.
7. Tenant termination is allowed only for their own lease and only after the end date.
8. Owner removal terminates the lease and marks the unit vacant.
9. Add lease-document storage for uploaded PDFs.

### State Transitions

- `DRAFT` to `ACTIVE` when signed document uploaded
- `ACTIVE` to `TERMINATED` on owner removal or valid tenant termination
- `ACTIVE` to `EXPIRED` by scheduled maintenance or query-time rule once end date passes

### Tests

- create lease with `tenantId`
- create lease with `tenantEmail`
- reject create lease when unit already has draft or active lease
- upload signed document and activate lease
- get lease with tenant, unit, and documents
- tenant submit move-out notice
- tenant terminate before end date should fail
- tenant terminate after end date should succeed
- owner remove tenant should succeed when allowed
- non-owner cannot manage unrelated lease

### Done Criteria

- Lease endpoints exist and follow the response envelopes exactly.
- Unit occupancy stays consistent with lease state.

## Phase 4: Invoices, Receipts, And Scheduled Jobs

### Objectives

- Support monthly rent billing and receipt review.
- Keep payment logic small but deterministic.

### Tasks

1. Add routes for:
   - `GET /invoices`
   - `GET /invoices/:invoiceId`
   - `POST /invoices/:invoiceId/receipts`
   - `PUT /invoices/:invoiceId/status`
   - `POST /invoices/generate-monthly`
2. Generate one invoice per active lease per billing month.
3. Enforce uniqueness on `(leaseId, billingMonth)`.
4. Receipt upload moves invoice to `PENDING_REVIEW`.
5. `PUT /invoices/:invoiceId/status` supports owner and admin review.
6. Save `reviewNote`, `reviewedBy`, and `reviewedAt`.
7. Implement scheduled job functions for:
   - monthly invoice generation
   - daily overdue update
   - daily reminder notifications
8. The scheduled logic can first live in service functions with a manual invocation path. Do not block on external cron infrastructure.

### Status Rules

- `UNPAID` to `PENDING_REVIEW` on receipt upload
- `PENDING_REVIEW` to `PAID` on approval
- `PENDING_REVIEW` to `UNPAID` on rejection
- `UNPAID` to `OVERDUE` when due date passes
- `OVERDUE` to `PAID` on valid later approval

### Tests

- generate monthly invoices for active leases
- second generation for same month is idempotent
- tenant can list only own invoices
- owner can list invoices for owned leases
- tenant uploads receipt
- unrelated tenant cannot upload receipt
- owner approves receipt and invoice becomes `PAID`
- owner rejects receipt and invoice becomes `UNPAID`
- overdue job marks past-due unpaid invoices

### Done Criteria

- Billing month duplication is prevented.
- Receipt review route exists and drives invoice state transitions.

## Phase 5: Maintenance

### Objectives

- Support tenant-submitted tickets with evidence and owner status updates.

### Tasks

1. Add routes for:
   - `POST /maintenance-requests`
   - `GET /maintenance-requests`
   - `GET /maintenance-requests/:requestId`
   - `PUT /maintenance-requests/:requestId/status`
   - `POST /maintenance-requests/:requestId/evidence`
2. Restrict request creation to tenants with an active lease on the unit.
3. Default new requests to `OPEN`.
4. Store evidence files separately from property media.
5. `PUT /maintenance-requests/:requestId/status` must accept `status` and `note`.
6. Set `resolvedAt` and `resolvedBy` when status becomes `RESOLVED`.
7. Create notifications on new request submission and on every owner status change.

### Allowed Status Changes

- `OPEN` to `IN_PROGRESS`
- `OPEN` to `REJECTED`
- `IN_PROGRESS` to `RESOLVED`
- `IN_PROGRESS` to `REJECTED`

### Tests

- tenant submits request for own unit
- tenant cannot submit request for unrelated unit
- tenant uploads evidence
- owner sees requests for owned units
- owner changes status to `IN_PROGRESS`
- owner resolves request and `resolvedAt` is set
- unrelated owner cannot update request

### Done Criteria

- Maintenance lifecycle is fully covered for MVP without extra states or approval loops.

## Phase 6: Messages, Announcements, Notifications, And Hardening

### Objectives

- Implement the communication subsystem required by the PDF and contract.

### Tasks

1. Add routes for:
   - `POST /messages`
   - `GET /messages`
   - `GET /messages/:messageId`
   - `PUT /messages/:messageId/read`
   - `POST /announcements`
   - `GET /announcements`
   - `GET /notifications`
   - `PUT /notifications/:notificationId/read`
2. Messages are direct one-to-one records with `readAt`.
3. `PUT /messages/:messageId/read` may be used only by the receiver or admin.
4. Creating a message also creates a notification for the receiver.
5. Announcements accept optional `propertyId`.
6. If `propertyId` is present, target tenants with active leases in that property only.
7. If `propertyId` is absent, target tenants in the owner's occupied properties.
8. Notifications should include enough metadata to link back to the relevant entity.
9. Email sending can be designed as a side effect hook or service interface. Do not block MVP on real SMTP delivery.
10. Do not implement reports or moderation.

### Hardening Tasks

1. Add validation middleware for all new routes.
2. Add file type and file size restrictions for documents and images.
3. Normalize ownership checks into shared helpers where helpful.
4. Ensure Swagger and route docs match the final contract.

### Tests

- send message
- list conversation with `otherUserId`
- receiver marks message as read
- sender cannot mark the message as read
- owner sends property-scoped announcement
- tenant sees only relevant announcements
- list notifications filtered by `isRead`
- mark notification as read

### Done Criteria

- Messaging and notification flows are usable without websockets.
- Announcement scoping is enforced in the backend.
- Reports remain explicitly out of scope.

## File And Module Boundaries

- Keep route registration in `src/routes`
- Keep request handling in `src/controllers`
- Introduce service modules if controller logic becomes too large
- Define every new table as a Sequelize model in `src/models`
- Register all model associations in `src/config/database.ts`
- Keep upload handling in `src/middleware/upload.ts` or closely related upload utilities
- Add tests in `src/tests`

## Testing Strategy

- Prefer integration-style route tests with Supertest, matching the current repo style.
- Add one test file per subsystem when practical:
  - `lease.test.ts`
  - `invoice.test.ts`
  - `maintenance.test.ts`
  - `message.test.ts`
  - `notification.test.ts`
- Keep auth helpers reusable across tests.
- Assert exact status codes and exact response envelope keys.

## Final Acceptance Checklist

- Every non-deferred use case from the PDF has a matching backend capability.
- Existing auth, property, unit, and admin paths are preserved.
- Admin bootstrap works exactly once publicly, then becomes admin-only.
- Ownership and tenant scoping are enforced server-side.
- Monthly billing logic is idempotent.
- Reports and moderation are not partially implemented.
