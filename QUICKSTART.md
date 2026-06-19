# Quick Start Guide

Get the Digital Passport Event Engagement Platform running in 5 minutes.

## Option 1: Docker (Recommended)

### Prerequisites
- Docker Desktop installed and running

### Steps

1. **Navigate to project directory:**
   ```bash
   cd path/to/Digital\ passport-Claude
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to start:**
   ```bash
   # Watch logs (optional)
   docker-compose logs -f app
   ```

4. **Access the application:**
   - Open http://localhost:3000 in your browser
   - All services should be ready in 30-60 seconds

5. **Test the application:**
   - Login with demo credentials (see credentials below)
   - Navigate through admin and attendee features

### Stopping the Application

```bash
docker-compose down
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just the database
docker-compose logs -f postgres
```

## Option 2: Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

3. **Setup PostgreSQL:**
   ```bash
   # Create database
   createdb digital_passport
   
   # Or using psql
   psql -U postgres -c "CREATE DATABASE digital_passport;"
   ```

4. **Run migrations:**
   ```bash
   npm run db:push
   ```

5. **Seed sample data:**
   ```bash
   npm run db:seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

7. **Access application:**
   - Open http://localhost:3000

## Demo Credentials

### Super Admin
```
Email: admin@digitialpassport.com
Password: Admin@123
```

### Event Admin
```
Email: admin@techsummit.com
Password: Manager@123
```

### Sample Attendee
```
Email: john@example.com
Password: User@123
```

Alternatively, register a new account via the registration page.

## First Steps

### As Super Admin
1. Login with super admin credentials
2. Navigate to Admin Dashboard
3. View pre-created event "Tech Summit 2024"
4. Explore zones, activities, and analytics

### As Event Admin
1. Login with event admin credentials
2. Manage event zones and activities
3. View event analytics and leaderboard

### As Attendee
1. Register or login
2. Scan a QR code (use zone slug: `hall-a`, `hall-b`, etc.)
   - Test URL: http://localhost:3000/scan/hall-a
3. Complete an activity
4. View your dashboard
5. Check the leaderboard

## Sample QR Codes

Scan these zones during event:

| Zone | URL | Points |
|------|-----|--------|
| Hall A | /scan/hall-a | 10 |
| Hall B | /scan/hall-b | 15 |
| Hall C | /scan/hall-c | 20 |
| Networking | /scan/networking | 15 |

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill existing process on port 3000
lsof -i :3000
kill -9 <PID>

# Or change port in docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps

# Verify DATABASE_URL in .env.local
# Format: postgresql://user:password@host:port/database
```

### Migrations Failed

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or manually:
npm run db:push
npm run db:seed
```

### Node Modules Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Create Your First Event:**
   - Login as admin
   - Navigate to Admin > Events
   - Click "Create Event"

2. **Add Zones:**
   - Go to Admin > Zones
   - Create zones for your event locations

3. **Configure Activities:**
   - Go to Admin > Activities
   - Attach activities to zones (Quiz, Poll, etc.)

4. **Generate QR Codes:**
   - Each zone gets a unique QR code
   - Download from Admin > Zones
   - Print or display at event locations

5. **Launch Event:**
   - Change event status to "LIVE"
   - Attendees can start scanning QR codes
   - Monitor real-time analytics

## Performance Tips

- For large events (1000+ attendees), consider:
  - Using a dedicated database server
  - Setting up a reverse proxy (nginx)
  - Implementing caching (Redis)
  - Using a CDN for static assets

## Support

- Check README.md for detailed documentation
- Review API.md for API documentation
- Check logs for error messages
- Ensure all prerequisites are installed

## Clean Up

### Reset All Data (Docker)

```bash
# Stop containers and remove volumes
docker-compose down -v

# Restart fresh
docker-compose up -d
```

### Reset All Data (Local)

```bash
# Reset database
npx prisma migrate reset

# Reseed
npm run db:seed
```

## What's Included

✅ Event management  
✅ Multiple zones with QR codes  
✅ Activity builder (Quiz, Poll, Survey, etc.)  
✅ Real-time leaderboard  
✅ Attendee registration  
✅ Points and badges system  
✅ Analytics dashboard  
✅ Admin interface  
✅ Responsive design  
✅ Docker setup  

## Production Deployment

See DEPLOYMENT.md for detailed deployment instructions.

---

**Estimated Setup Time:** 5 minutes with Docker, 10 minutes locally
