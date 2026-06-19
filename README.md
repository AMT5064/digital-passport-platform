# Digital Passport Event Engagement Platform

A production-ready web application for managing event engagement through QR code scanning, gamification, and leaderboards.

## Features

### Core Features
- **Event Management**: Create and manage multiple events
- **Zone Management**: Create unlimited zones with unique QR codes
- **Activity Builder**: Support for Quiz, Poll, Survey, Video, Download, Raffle, and Custom CTA
- **Attendee Registration**: Flexible registration with configurable fields
- **QR Scanning**: Scan QR codes to participate in activities
- **Real-time Leaderboard**: Dynamic rankings with real-time updates
- **Points System**: Configurable point allocation
- **Badges & Rewards**: Gamification with achievements
- **Analytics Dashboard**: Comprehensive event analytics

### User Roles
- **Super Admin**: Manage platform-wide settings
- **Event Admin**: Manage specific events
- **Attendee**: Participate in events and earn points

## Tech Stack

- **Frontend**: Next.js 15+, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Deployment**: Docker & Docker Compose
- **Charts**: Recharts
- **QR Codes**: qrcode.react

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development without Docker)
- PostgreSQL 16+ (if running without Docker)

## Quick Start with Docker

### 1. Clone or Extract the Project

```bash
cd Digital\ passport-Claude
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

The default `.env.local` is pre-configured for Docker. Only edit if needed.

### 3. Start the Application

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Run Prisma migrations
- Seed sample data
- Start the Next.js application in development mode

### 4. Access the Application

- **Application**: http://localhost:3000
- **Database**: postgresql://postgres:postgres@localhost:5432/digital_passport

## Local Development (Without Docker)

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Create a `.env.local` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digital_passport"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="development"
```

### 3. Setup PostgreSQL

```bash
# Using PostgreSQL CLI
createdb digital_passport

# Or using psql
psql -U postgres -c "CREATE DATABASE digital_passport;"
```

### 4. Run Migrations and Seed

```bash
npm run db:push
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Demo Credentials

### Super Admin
- Email: `admin@digitialpassport.com`
- Password: `Admin@123`

### Event Admin
- Email: `admin@techsummit.com`
- Password: `Manager@123`

### Sample Attendee
- Email: `john@example.com`
- Password: `User@123`

## Project Structure

```
.
├── pages/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── scan/              # QR scan endpoints
│   │   ├── leaderboard.ts     # Leaderboard endpoint
│   │   └── analytics.ts       # Analytics endpoint
│   ├── admin/                 # Admin pages
│   ├── index.tsx              # Home page
│   ├── login.tsx              # Login page
│   ├── register.tsx           # Registration page
│   ├── scan/[slug].tsx        # QR scan experience
│   ├── passport.tsx           # Attendee dashboard
│   └── leaderboard.tsx        # Public leaderboard
├── components/                # React components
├── lib/                       # Utility functions
│   ├── auth.ts               # NextAuth configuration
│   ├── prisma.ts             # Prisma client
│   └── utils.ts              # Helper utilities
├── types/                     # TypeScript definitions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Sample data seed
├── styles/                    # Global styles
├── public/                    # Static assets
├── Dockerfile                # Docker image
└── docker-compose.yml        # Docker Compose config
```

## Database Schema

### Core Tables

- **User**: Event attendees
- **Admin**: Event organizers
- **Event**: Event definitions
- **Zone**: Event zones/booths
- **Activity**: Zone activities (Quiz, Poll, etc.)
- **Scan**: QR code scans by users
- **Badge**: Achievement badges
- **Reward**: Reward definitions
- **Leaderboard**: Real-time rankings
- **PointsTransaction**: Point tracking
- **ActivityLog**: Audit logs
- **AuditLog**: Admin action logs

See `prisma/schema.prisma` for complete schema.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new attendee
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Scanning & Engagement
- `GET /api/scan/[slug]` - Get zone details
- `POST /api/scan/[slug]` - Record scan and activity

### Leaderboard
- `GET /api/leaderboard?eventId=xxx` - Get leaderboard

### Analytics
- `GET /api/analytics?eventId=xxx` - Get event analytics

## Configuration

### Event Settings

Configure via Database or Admin Panel:

```prisma
EventSettings {
  scanMode: ONE_SCAN | DAILY | UNLIMITED
  enableNotifications: boolean
  enableLeaderboard: boolean
}
```

### Registration Fields

Configure which fields are required/optional:

```prisma
RegistrationConfig {
  requiredFields: string[]
  optionalFields: string[]
  hiddenFields: string[]
}
```

### Points Configuration

```prisma
PointsConfig {
  pointsPerZone: int
  pointsPerQuiz: int
  pointsPerPoll: int
  pointsPerSurvey: int
}
```

## QR Code Generation

QR codes are automatically generated for each zone:

- Unique slug per zone
- QR format: `/scan/[zone-slug]`
- Download as PNG from zone management

## Customization

### Theme Colors

Events can have custom theme colors:

```typescript
event.themeColor = "#3B82F6" // Example: Blue
```

### Activity Types

Supported activities:
- `QUIZ`: Multiple choice questions
- `POLL`: Quick polling
- `SURVEY`: Detailed surveys
- `VIDEO`: Video watching
- `DOWNLOAD`: Document downloads
- `RAFFLE`: Raffle entries
- `CUSTOM_CTA`: Custom action buttons

## Security Features

- ✅ Role-Based Access Control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ CSRF protection via NextAuth
- ✅ XSS protection via React escaping
- ✅ Input validation with Zod
- ✅ SQL injection protection via Prisma
- ✅ Rate limiting ready (implement as needed)

## Performance Optimizations

- Database indexing on frequently queried fields
- Leaderboard ranking optimization
- Efficient point calculation
- Minimal database round-trips
- Next.js image optimization ready

## Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)

```env
DATABASE_URL=postgresql://user:password@prod-db:5432/digital_passport
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-a-strong-secret
NODE_ENV=production
```

### VPS/Cloud Deployment

1. **Build and push Docker image**:
   ```bash
   docker build -t digital-passport:latest .
   docker tag digital-passport:latest yourreg/digital-passport:latest
   docker push yourreg/digital-passport:latest
   ```

2. **Deploy to cloud**:
   - AWS ECS
   - Google Cloud Run
   - DigitalOcean App Platform
   - Heroku (with buildpacks)
   - VPS with Docker

3. **Database**:
   - AWS RDS
   - Google Cloud SQL
   - Supabase
   - Self-hosted PostgreSQL

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps

# Verify DATABASE_URL in .env.local
# Format: postgresql://user:password@host:port/database
```

### Port Already in Use

```bash
# Change port in docker-compose.yml
# Or kill existing process:
lsof -i :3000
kill -9 <PID>
```

### Prisma Client Error

```bash
npm run generate
npm run db:push
```

### Migrations Out of Sync

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
npm run db:seed
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npm run db:migrate

# Push schema changes
npm run db:push

# Open Prisma Studio (GUI)
npm run db:studio

# Seed sample data
npm run db:seed

# Generate Prisma client
npm run generate

# Linting
npm run lint
```

## Monitoring & Logging

- Application logs: Docker container logs
- Database logs: PostgreSQL logs
- Request logging: Implement with middleware

```bash
# View logs
docker logs digital-passport-app
docker logs digital-passport-db

# Follow logs in real-time
docker logs -f digital-passport-app
```

## Performance Metrics

Monitor these in production:

- **Response Time**: < 200ms for API calls
- **Database Queries**: < 50ms average
- **Leaderboard Updates**: Real-time < 100ms
- **Concurrent Users**: Design for 1000+ concurrent attendees

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions:
1. Check troubleshooting section
2. Review logs and error messages
3. Verify environment configuration

## Roadmap

- [ ] Email notifications (Resend integration)
- [ ] SMS notifications (Twilio)
- [ ] WebSocket real-time updates
- [ ] Mobile app (React Native)
- [ ] Social media integration
- [ ] Advanced analytics (BI integration)
- [ ] Multi-language support
- [ ] Payment integration for premium features

## Notes

- Default admin password: Change in production
- NEXTAUTH_SECRET: Generate with `openssl rand -base64 32`
- Database backups: Implement automated daily backups
- SSL/TLS: Enable in production
- Rate limiting: Implement for public endpoints
