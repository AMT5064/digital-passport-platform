# Digital Passport API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a valid NextAuth session. Include the session cookie in requests.

## Endpoints

### Authentication

#### Register User

```
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "mobile": "string (optional)",
  "company": "string (optional)",
  "designation": "string (optional)",
  "eventId": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

#### Sign In

```
POST /auth/[...nextauth]
```

Uses NextAuth credentials provider. See NextAuth documentation.

### QR Code Scanning

#### Get Zone Details

```
GET /scan/[slug]
```

**Parameters:**
- `slug`: Zone QR slug (path parameter)

**Response:**
```json
{
  "success": true,
  "data": {
    "zone": {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "points": number
    },
    "activity": {
      "type": "QUIZ|POLL|SURVEY|VIDEO|DOWNLOAD|RAFFLE|CUSTOM_CTA",
      "question": "string",
      "answers": [
        {
          "id": "string",
          "text": "string",
          "isCorrect": boolean
        }
      ]
    },
    "event": {
      "id": "string",
      "name": "string",
      "themeColor": "string"
    }
  }
}
```

#### Complete Zone Activity

```
POST /scan/[slug]
```

**Requires:** Authenticated session

**Request Body:**
```json
{
  "completedAt": "ISO 8601 datetime",
  "activityData": {
    "type": "string",
    "quizAnswer": "string",
    "pollAnswer": "string"
  },
  "device": "string",
  "browser": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scan": {
      "id": "string",
      "pointsEarned": number,
      "completedAt": "ISO 8601 datetime"
    },
    "totalPoints": number
  }
}
```

**Error Responses:**

- `401`: Not authenticated
- `404`: Zone not found
- `409`: Conflict (already scanned, based on scan mode)

### Leaderboard

#### Get Leaderboard

```
GET /leaderboard?eventId=xxx&page=1&pageSize=50
```

**Query Parameters:**
- `eventId`: Event ID (required)
- `page`: Page number (optional, default: 1)
- `pageSize`: Results per page (optional, default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "rank": number,
        "userId": "string",
        "userName": "string",
        "userAvatar": "string",
        "points": number,
        "zonesCompleted": number,
        "activitiesCompleted": number
      }
    ],
    "total": number,
    "page": number,
    "pageSize": number,
    "totalPages": number
  }
}
```

### Analytics

#### Get Event Analytics

```
GET /analytics?eventId=xxx
```

**Requires:** Authenticated session (Admin only)

**Query Parameters:**
- `eventId`: Event ID (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalParticipants": number,
    "uniqueVisitors": number,
    "totalScans": number,
    "zoneStats": [
      {
        "zoneId": "string",
        "zoneName": "string",
        "visits": number,
        "completionRate": number,
        "pointsAwarded": number
      }
    ],
    "activityStats": [
      {
        "activityType": "string",
        "completions": number
      }
    ],
    "hourlyTraffic": [
      {
        "hour": "string",
        "visits": number,
        "completions": number
      }
    ],
    "leaderboardDistribution": [number],
    "topZones": [
      {
        "zoneName": "string",
        "visits": number
      }
    ],
    "topActivities": [
      {
        "activityType": "string",
        "completions": number
      }
    ]
  }
}
```

**Error Responses:**

- `401`: Not authenticated
- `403`: Not authorized to access this event

### Admin - Zones

#### List Zones

```
GET /admin/zones?eventId=xxx
```

**Requires:** Authenticated session (Admin only)

**Query Parameters:**
- `eventId`: Event ID (required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "qrSlug": "string",
      "eventId": "string",
      "points": number,
      "active": boolean,
      "activity": {
        "type": "QUIZ|POLL|...",
        ...
      }
    }
  ]
}
```

#### Create Zone

```
POST /admin/zones?eventId=xxx
```

**Requires:** Authenticated session (Admin only)

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "image": "string (optional)",
  "points": number
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "qrSlug": "string",
    ...
  }
}
```

### Admin - Activities

#### List Activities

```
GET /admin/activities?eventId=xxx
```

**Requires:** Authenticated session (Admin only)

#### Create/Update Activity

```
POST /admin/activities?eventId=xxx
```

**Requires:** Authenticated session (Admin only)

**Request Body:**
```json
{
  "type": "QUIZ|POLL|SURVEY|VIDEO|DOWNLOAD|RAFFLE|CUSTOM_CTA",
  "zoneId": "string",
  "data": {
    "question": "string",
    "answers": [...],
    "pollOptions": [...],
    "videoUrl": "string",
    "downloadUrl": "string",
    "ctaUrl": "string",
    ...
  }
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## Rate Limiting

Currently not implemented. Can be added via middleware.

## CORS

CORS is enabled for authenticated requests from the same origin.

## Examples

### Register and Sign In

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'

# Sign In (handled by NextAuth form)
# Use /auth/callback/credentials endpoint
```

### Scan Zone

```bash
# Get zone details
curl http://localhost:3000/api/scan/hall-a

# Complete activity (requires authentication)
curl -X POST http://localhost:3000/api/scan/hall-a \
  -H "Content-Type: application/json" \
  -b "your-cookie" \
  -d '{
    "completedAt": "2024-06-20T10:30:00Z",
    "activityData": {
      "type": "QUIZ",
      "quizAnswer": "answer-1"
    },
    "device": "Mobile",
    "browser": "Chrome"
  }'
```

### Get Leaderboard

```bash
curl "http://localhost:3000/api/leaderboard?eventId=event-1&page=1&pageSize=10"
```

### Get Analytics

```bash
curl http://localhost:3000/api/analytics?eventId=event-1 \
  -b "your-cookie"
```

## Pagination

For paginated endpoints:

- `page`: 1-based page number
- `pageSize`: Items per page (capped at 100)
- `total`: Total items available
- `totalPages`: Total number of pages

## Webhooks

Currently not implemented. Can be added for real-time integrations.

## Error Handling

All errors return standard format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## API Versioning

Currently on version 1 (implicit). Future versions will use `/api/v2/` etc.

## Testing

Use tools like Postman, curl, or the browser console to test endpoints.

## Notes

- All timestamps are in ISO 8601 format
- IDs are generated using `cuid()` by default
- Authentication uses NextAuth.js with JWT strategy
- Database operations use Prisma ORM
