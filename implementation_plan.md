# Phase 1.5 — Multi-Tenant (Multi-Store) SaaS Implementation Plan

## Goal

Convert the existing single-store **InventorAPp** into a fully multi-tenant SaaS where each store (business) operates in complete isolation. Every piece of data becomes store-scoped, and a new **"register a store"** onboarding flow is introduced.

---

## Tech Stack Decision

We are **keeping the exact same stack** — no rewrites needed. The existing stack is already a great fit for a production SaaS:

| Layer | Technology | Reason |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript | Already in use, modern SSR/CSR hybrid |
| **UI** | Tailwind CSS + Radix UI + Lucide React | Already in use, polished component system |
| **API Client** | Axios | Already in use, interceptors for JWT |
| **Realtime** | Socket.io Client | Already in use, will be scoped to `store_id` rooms |
| **Backend** | Node.js + Express.js | Already in use, minimal and production-ready |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Already in use; JWT payload will carry `store_id` |
| **Database** | PostgreSQL (via `pg`) | Already in use; `store_id` columns are the only structural change |
| **Background Jobs** | BullMQ + Redis | Already in use; worker will iterate per-store |
| **Email** | Nodemailer | Already in use |
| **SMS** | Twilio | Already in use |
| **Infra** | Docker Compose (PostgreSQL + Redis) | Already in use |

> **No new dependencies required.** This is a pure refactoring of data architecture and business logic.

---

## Proposed Changes

---

### 1. Database Layer

#### [MODIFY] [schema.sql](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/database/schema.sql)

This is the most foundational change. We will add a `stores` table and add `store_id` columns to all existing tables.

**Changes:**
1. Add a new `stores` table (first, since others reference it).
2. Add `store_id UUID NOT NULL REFERENCES stores(id)` to: `users`, `items`, `suppliers`, `notifications`, `inventory_logs`.
3. Change the `users` UNIQUE index on `email` to be **per-store** (i.e., the same email cannot be used in the same store twice, but can exist across stores). Use a `UNIQUE(email, store_id)` constraint.
4. Change `suppliers.email` UNIQUE to `UNIQUE(email, store_id)`.
5. Add `sku VARCHAR(100)` column to `items`.
6. Add a `UNIQUE(sku, store_id)` constraint to `items`.
7. Add indexes on all new `store_id` foreign keys.
8. Simplify roles from [('admin', 'manager', 'viewer')](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/authController.js#63-76) → [('admin', 'staff')](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/authController.js#63-76) per the spec.

> **⚠️ Note**: Since this is a new architecture, we will write a **new migration file** (`schema_v2.sql`) that drops and recreates the database cleanly. The existing data is development data only.

#### [NEW] [schema_v2.sql](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/database/schema_v2.sql)

A complete replacement schema. The original [schema.sql](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/database/schema.sql) is kept for reference.

---

### 2. Backend — Authentication & JWT

#### [MODIFY] [authController.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/authController.js)

This is the most significant logic change.

**[register](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/authController.js#13-39) endpoint — new flow:**
1. Accept `storeName`, `name`, `email`, `password` in the request body.
2. **Create a new `stores` row** with the given `storeName`.
3. Create the user with `role = 'admin'` and `store_id` of the new store.
4. Include `store_id` in the JWT payload.
5. Return the token and user object.

**[login](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/authController.js#40-62) endpoint:**
- Query user by email + match password as before.
- Include `store_id` in JWT payload.

**[generateToken](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/authController.js#6-12) function:**
```js
// BEFORE
{ id, email, role, name }

// AFTER
{ id, email, role, name, store_id }
```

#### [MODIFY] [auth.js (middleware)](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/middleware/auth.js)

No changes needed — it already decodes the token to `req.user`. Since `store_id` is now in the token, all controllers will access it via `req.user.store_id`.

---

### 3. Backend — Controllers (All)

Every controller must be updated to scope queries by `store_id`. The pattern is the same for all of them.

#### [MODIFY] [itemController.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/itemController.js)

All SQL queries get a `WHERE store_id = $N` (or `AND store_id = $N`) clause. All `INSERT` statements include `store_id` from `req.user.store_id`. The new `sku` field will be added to `createItem` and `updateItem`.

#### [MODIFY] [supplierController.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/supplierController.js)

Same pattern — all queries scoped by `store_id`. Example:
```js
// BEFORE
'SELECT * FROM suppliers WHERE id = $1'

// AFTER
'SELECT * FROM suppliers WHERE id = $1 AND store_id = $2'
// params: [req.params.id, req.user.store_id]
```

#### [MODIFY] [notificationController.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/notificationController.js)

Notifications are currently scoped to `user_id`. Per spec, they should be scoped to `store_id`. We will add `store_id` as the primary scope, keeping `user_id` as an optional additional reference.

#### [MODIFY] [logController.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/logController.js)

All log queries will be filtered by `store_id`.

#### [MODIFY] [dashboardController.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/dashboardController.js)

All aggregate queries (total items, low stock count, etc.) must be filtered by `store_id`.

#### [MODIFY] [settingController.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/settingController.js)

Settings will need a `store_id` column so each store has its own config. Queries will be scoped accordingly.

---

### 4. Backend — Routes & New User Management

#### [MODIFY] [routes/auth.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/routes/auth.js)

- Add `storeName` to the register validation body.

#### [NEW] [routes/users.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/routes/users.js)

New route file per the spec API (`GET /users`, `POST /users`, `DELETE /users/:id`). Only accessible by `admin` role.

#### [NEW] [controllers/userController.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/controllers/userController.js)

- `getUsers`: Fetch all users belonging to `req.user.store_id`.
- `createUser`: Admin creates a new `staff` user in the same store.
- `deleteUser`: Admin deletes a user, scoped to their `store_id`.

#### [MODIFY] [server.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/server.js)

- Register the new `/api/users` route.
- Update Socket.io `join` event: clients join `store_${store_id}` room instead of `user_${userId}`.

---

### 5. Backend — Background Worker (BullMQ)

#### [MODIFY] [workers/stockChecker.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/workers/stockChecker.js)

Currently, `getLowStockItems()` fetches ALL low-stock items globally. With multi-tenancy, it must:
1. Fetch all `store_ids` from the database.
2. Group low-stock items by `store_id`.
3. Emit Socket.io events to the **store-specific room** (`io.to(store_id).emit(...)`) instead of a user-specific room.

#### [MODIFY] [services/notificationService.js](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/backend/services/notificationService.js)

Update notification creation to include `store_id`, and ensure the email/SMS alerts reference the correct store's data.

---

### 6. Frontend — Registration Flow

#### [NEW] [src/app/register/page.tsx](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/frontend/src/app/register/page.tsx)

Update the existing register page to include a **Store Name** field as the first input, since registering now creates both a store and an admin user.

---

### 7. Frontend — Auth Context

#### [MODIFY] [src/contexts/AuthContext.tsx](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/frontend/src/contexts/AuthContext.tsx)

- Ensure the decoded JWT or `/me` response now exposes `store_id`.
- Store `store_id` in context state for potential display (e.g., store name in sidebar).

---

### 8. Frontend — Socket.io & Notifications

#### [MODIFY] [src/lib/socket.ts](file:///c:/Users/ankit/OneDrive/Documents/Desktop/InventorAPp/frontend/src/lib/socket.ts)

Update the socket `join` event emission to pass `store_id` when joining:
```ts
// BEFORE: socket.emit('join', userId)
// AFTER:  socket.emit('join', storeId)
```

---

## Verification Plan

### Manual API Testing (REST Client)

After running the migration and starting the servers with `npm run dev`:

**Step 1 — Register a new store:**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "storeName": "Test Store Alpha",
  "name": "Admin Alice",
  "email": "alice@alpha.com",
  "password": "password123"
}
```
*Expected*: `201 Created`. Response includes a `token`. Decode the JWT at [jwt.io](https://jwt.io) and confirm it contains `store_id`.

**Step 2 — Register a second store:**
Same as above, with `storeName: "Test Store Beta"` and different email. Confirm a **different** `store_id` is in the JWT.

**Step 3 — Data Isolation Test:**
- Log in as Alice (Store Alpha). `POST /api/items` to create Item A.
- Log in as Beta admin. `GET /api/items`. Confirm Item A is **NOT visible**.

**Step 4 — User management by Admin:**
```http
POST http://localhost:5000/api/users
Authorization: Bearer <alice_token>
Content-Type: application/json

{ "name": "Staff Bob", "email": "bob@alpha.com", "password": "password123", "role": "staff" }
```
*Expected*: `201 Created`. Bob is created in Store Alpha.

**Step 5 — Cross-store user conflict:**
- Try to create a user with the same email (`bob@alpha.com`) in Store Beta.
- *Expected*: `201 Created` (emails are unique per-store, not globally).

**Step 6 — Socket.io room isolation:**
Start two browser tabs, logged in as Alice and Beta admin. Check that a low-stock notification triggered for Store Alpha is only visible in Alice's tab.

### Automated Schema Verification

```bash
# In the backend directory
npm run migrate
```
*Expected*: Migration runs without error. Verify in `psql`:
```sql
\d stores
\d users           -- must show store_id column
\d items           -- must show store_id and sku columns
\d suppliers       -- must show store_id column
\d notifications   -- must show store_id column
\d inventory_logs  -- must show store_id column
```
