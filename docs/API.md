# FlatFlow API Documentation

This document provides complete reference for all FlatFlow API endpoints.

## Base URL
- **Development:** `http://localhost:3001`
- **Production:** `{VERCEL_DEPLOYMENT_URL}`

## Authentication

All endpoints (except health checks) require authentication using a Supabase JWT token.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

The JWT token is obtained after user login via Supabase Authentication. The backend validates the token and extracts the user ID and email.

## Response Format

All responses are JSON. Successful responses include the requested data:

```json
{
  "expense": { ... },
  "expenses": [ ... ],
  "message": "Success message"
}
```

Error responses include an error object:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description"
}
```

## Error Codes

- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks permission (not a flat member, insufficient role)
- `404 Not Found` - Resource not found
- `400 Bad Request` - Invalid request parameters or validation error
- `409 Conflict` - Resource conflict (e.g., duplicate entry)
- `500 Internal Server Error` - Server error

---

## Health Check

### GET /api/health

No authentication required.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Authentication Endpoints

### GET /api/users/profile

Get the current user's profile.

**Auth Required:** Yes

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "fullName": "string",
    "avatarUrl": "string | null",
    "phone": "string | null",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

### PATCH /api/users/profile

Update current user's profile information.

**Auth Required:** Yes

**Request Body:**
```json
{
  "fullName": "string (optional)",
  "avatarUrl": "string | null (optional)",
  "phone": "string | null (optional)"
}
```

**Response:**
```json
{
  "profile": { ... }
}
```

---

## Household (Flat) Endpoints

### GET /api/flats

Get all households the user is a member of.

**Auth Required:** Yes

**Query Parameters:** None

**Response:**
```json
{
  "flats": [
    {
      "id": "uuid",
      "name": "string",
      "addressLabel": "string | null",
      "currency": "string",
      "createdBy": "uuid",
      "createdAt": "ISO 8601 timestamp",
      "role": "owner | admin | member",
      "memberCount": "number"
    }
  ]
}
```

### POST /api/flats

Create a new household.

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "string (required)",
  "addressLabel": "string (optional)",
  "currency": "string (default: INR)"
}
```

**Response:**
```json
{
  "flat": {
    "id": "uuid",
    "name": "string",
    "addressLabel": "string | null",
    "currency": "string",
    "createdBy": "uuid",
    "createdAt": "ISO 8601 timestamp"
  },
  "invitation": {
    "code": "string",
    "expiresAt": "ISO 8601 timestamp"
  }
}
```

### GET /api/flats/:flatId

Get details of a specific household.

**Auth Required:** Yes (user must be a member)

**Response:**
```json
{
  "flat": { ... },
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "role": "owner | admin | member",
      "status": "active | invited | left",
      "joinedAt": "ISO 8601 timestamp",
      "profile": {
        "fullName": "string",
        "avatarUrl": "string | null"
      }
    }
  ]
}
```

### POST /api/flats/:flatId/invite

Create an invitation code for the household.

**Auth Required:** Yes (owner/admin only)

**Request Body:**
```json
{
  "expiresInHours": "number (default: 168)",
  "maxUses": "number (default: 10)"
}
```

**Response:**
```json
{
  "invitation": {
    "code": "string",
    "expiresAt": "ISO 8601 timestamp",
    "maxUses": "number",
    "useCount": "number"
  }
}
```

### POST /api/flats/join

Join an existing household using an invitation code.

**Auth Required:** Yes

**Request Body:**
```json
{
  "code": "string"
}
```

**Response:**
```json
{
  "flat": { ... },
  "membership": {
    "id": "uuid",
    "userId": "uuid",
    "flatId": "uuid",
    "role": "member",
    "status": "active",
    "joinedAt": "ISO 8601 timestamp"
  }
}
```

---

## Expense Endpoints

### GET /api/flats/:flatId/expenses

Get all expenses for a household.

**Auth Required:** Yes (user must be a member)

**Query Parameters:**
- `category` - Filter by category (optional)
- `payerId` - Filter by payer user ID (optional)
- `search` - Search in description (optional)

**Response:**
```json
{
  "expenses": [
    {
      "id": "uuid",
      "flatId": "uuid",
      "payerId": "uuid",
      "description": "string",
      "category": "string",
      "amountPaise": "number",
      "expenseDate": "YYYY-MM-DD",
      "receiptPath": "string | null",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "splits": [
        {
          "id": "uuid",
          "userId": "uuid",
          "sharePaise": "number",
          "paidAmountPaise": "number",
          "profile": { ... }
        }
      ]
    }
  ],
  "count": "number"
}
```

### POST /api/flats/:flatId/expenses

Create a new shared expense.

**Auth Required:** Yes (user must be a member)

**Request Body:**
```json
{
  "description": "string",
  "category": "food | utilities | rent | entertainment | other",
  "amountPaise": "number (amount in smallest currency unit)",
  "expenseDate": "YYYY-MM-DD",
  "participantUserIds": ["uuid", "uuid", ...],
  "splitStrategy": "equal | proportional",
  "receiptPath": "string (optional)"
}
```

**Response:**
```json
{
  "expense": {
    "id": "uuid",
    "flatId": "uuid",
    "payerId": "uuid",
    "description": "string",
    "category": "string",
    "amountPaise": "number",
    "expenseDate": "YYYY-MM-DD",
    "receiptPath": "string | null",
    "createdAt": "ISO 8601 timestamp",
    "splits": [ ... ]
  }
}
```

### DELETE /api/expenses/:id

Delete an expense (creator only).

**Auth Required:** Yes

**Response:**
```json
{
  "message": "Expense deleted successfully",
  "id": "uuid"
}
```

### PATCH /api/expenses/:id/settle

Mark an expense split as paid/settled.

**Auth Required:** Yes

**Request Body:**
```json
{
  "amountPaise": "number (optional, full amount if not provided)"
}
```

**Response:**
```json
{
  "expense": { ... }
}
```

---

## Bill Endpoints

### GET /api/flats/:flatId/bills

Get all bills for a household.

**Auth Required:** Yes (user must be a member)

**Response:**
```json
{
  "bills": [
    {
      "id": "uuid",
      "flatId": "uuid",
      "description": "string",
      "totalAmountPaise": "number",
      "dueDate": "YYYY-MM-DD",
      "createdBy": "uuid",
      "createdAt": "ISO 8601 timestamp",
      "shares": [
        {
          "id": "uuid",
          "userId": "uuid",
          "sharePaise": "number",
          "paidAmountPaise": "number",
          "status": "pending | paid",
          "profile": { ... }
        }
      ]
    }
  ]
}
```

### POST /api/flats/:flatId/bills

Create a new household bill.

**Auth Required:** Yes (user must be a member)

**Request Body:**
```json
{
  "description": "string",
  "totalAmountPaise": "number",
  "dueDate": "YYYY-MM-DD",
  "participantUserIds": ["uuid", "uuid", ...]
}
```

**Response:**
```json
{
  "bill": { ... }
}
```

### PATCH /api/bills/:id/pay

Record a payment for a bill.

**Auth Required:** Yes (must be a participant)

**Request Body:** (empty)

**Response:**
```json
{
  "bill": { ... },
  "updatedShare": {
    "id": "uuid",
    "status": "paid",
    "paidAmountPaise": "number"
  }
}
```

---

## Chore Endpoints

### GET /api/flats/:flatId/chores

Get all chores for a household.

**Auth Required:** Yes (user must be a member)

**Response:**
```json
{
  "chores": [
    {
      "id": "uuid",
      "flatId": "uuid",
      "title": "string",
      "description": "string",
      "assignedTo": "uuid",
      "frequency": "once | daily | weekly | monthly",
      "completionRate": "number (0-100)",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "assignee": {
        "fullName": "string",
        "avatarUrl": "string | null"
      }
    }
  ],
  "fairnessScores": {
    "uuid": "number (0-100)"
  }
}
```

### POST /api/flats/:flatId/chores

Create a new chore.

**Auth Required:** Yes (user must be a member)

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "frequency": "once | daily | weekly | monthly",
  "assignedTo": "uuid (optional, auto-assigned if not provided)"
}
```

**Response:**
```json
{
  "chore": { ... }
}
```

### POST /api/chores/:id/complete

Mark a chore as completed.

**Auth Required:** Yes

**Response:**
```json
{
  "message": "Chore completed",
  "chore": { ... }
}
```

### POST /api/flats/:flatId/chores/rotate

Rotate a chore to the next roommate (fairness-based assignment).

**Auth Required:** Yes (owner/admin)

**Request Body:**
```json
{
  "choreId": "uuid"
}
```

**Response:**
```json
{
  "message": "Chore rotated successfully",
  "chore": { ... }
}
```

---

## Grocery Endpoints

### GET /api/flats/:flatId/groceries

Get shared grocery list.

**Auth Required:** Yes (user must be a member)

**Response:**
```json
{
  "groceries": [
    {
      "id": "uuid",
      "item": "string",
      "quantity": "number",
      "unit": "string",
      "addedBy": "uuid",
      "purchased": "boolean",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

### POST /api/flats/:flatId/groceries

Add item to grocery list.

**Auth Required:** Yes

**Request Body:**
```json
{
  "item": "string",
  "quantity": "number",
  "unit": "string"
}
```

**Response:**
```json
{
  "grocery": { ... }
}
```

### PATCH /api/groceries/:id

Mark item as purchased or update quantity.

**Auth Required:** Yes

**Request Body:**
```json
{
  "purchased": "boolean (optional)",
  "quantity": "number (optional)"
}
```

**Response:**
```json
{
  "grocery": { ... }
}
```

### DELETE /api/groceries/:id

Remove item from grocery list.

**Auth Required:** Yes

**Response:**
```json
{
  "message": "Item removed",
  "id": "uuid"
}
```

---

## Maintenance Endpoints

### GET /api/flats/:flatId/maintenance

Get maintenance requests.

**Auth Required:** Yes (user must be a member)

**Response:**
```json
{
  "requests": [
    {
      "id": "uuid",
      "description": "string",
      "priority": "low | medium | high",
      "status": "open | in-progress | resolved",
      "reportedBy": "uuid",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

### POST /api/flats/:flatId/maintenance

Report a maintenance issue.

**Auth Required:** Yes

**Request Body:**
```json
{
  "description": "string",
  "priority": "low | medium | high"
}
```

**Response:**
```json
{
  "request": { ... }
}
```

---

## Visitor Endpoints

### GET /api/flats/:flatId/visitors

Get visitor log.

**Auth Required:** Yes (user must be a member)

**Response:**
```json
{
  "visitors": [
    {
      "id": "uuid",
      "name": "string",
      "date": "YYYY-MM-DD",
      "reportedBy": "uuid",
      "notes": "string | null",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

### POST /api/flats/:flatId/visitors

Log a visitor.

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "string",
  "date": "YYYY-MM-DD",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "visitor": { ... }
}
```

---

## Announcements Endpoints

### GET /api/flats/:flatId/announcements

Get household announcements.

**Auth Required:** Yes (user must be a member)

**Response:**
```json
{
  "announcements": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "createdBy": "uuid",
      "priority": "low | medium | high",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

### POST /api/flats/:flatId/announcements

Post a new announcement.

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "string",
  "content": "string",
  "priority": "low | medium | high (default: medium)"
}
```

**Response:**
```json
{
  "announcement": { ... }
}
```

### DELETE /api/announcements/:id

Delete announcement (creator or admin only).

**Auth Required:** Yes

**Response:**
```json
{
  "message": "Announcement deleted",
  "id": "uuid"
}
```

---

## Data Isolation & Security

All endpoints enforce household isolation:

1. **Authentication Check**: Every endpoint requires a valid JWT token
2. **Flat Membership Verification**: User must be an active member of the flat
3. **Query Isolation**: All database queries filter by `flatId` to prevent cross-household data access
4. **Role-Based Access**: Admin-only endpoints verify the user's role within the household

This ensures users can only access data from households they're members of.
