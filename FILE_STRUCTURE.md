# File Structure & Navigation Guide

Complete file listing for the Digital Passport Event Engagement Platform.

## 📁 Root Configuration Files

```
.env.example                     Environment variables template
.eslintrc.json                   ESLint configuration
.gitignore                       Git ignore rules
.prettierrc                       Code formatter configuration
Dockerfile                       Docker image definition
docker-compose.yml               Development docker setup
docker-compose.prod.yml          Production docker setup
next.config.js                   Next.js configuration
package.json                     Node.js dependencies and scripts
postcss.config.js                PostCSS configuration
tailwind.config.ts               Tailwind CSS configuration
tsconfig.json                    TypeScript configuration
```

## 📚 Documentation Files

Essential guides and references:

```
README.md                         Main documentation (start here!)
QUICKSTART.md                     5-minute setup guide
DEPLOYMENT.md                     Production deployment instructions
API.md                            API reference and examples
FEATURES.md                       Feature overview and checklist
PROJECT_SUMMARY.md                Project completion summary
FILE_STRUCTURE.md                 This file - navigation guide
```

## 📄 Pages (Application Routes)

### Public Pages
```
pages/
├── index.tsx                     🏠 Home page - landing
├── login.tsx                     🔐 User login
├── register.tsx                  📝 User registration
├── event.tsx                     ℹ️ Event details page
├── leaderboard.tsx               🏆 Public leaderboard
├── passport.tsx                  👤 Attendee dashboard
├── 404.tsx                       ❌ Page not found
├── _app.tsx                      🔧 App wrapper (SessionProvider)
└── _document.tsx                 📄 HTML document structure
```

### Admin Pages
```
pages/admin/
├── index.tsx                     📊 Admin dashboard
├── events.tsx                    📅 Event management
├── zones.tsx                     📍 Zone management
├── activities.tsx                🎮 Activity builder
├── analytics.tsx                 📈 Analytics dashboard
├── leaderboard.tsx               🏆 Leaderboard management
├── participants.tsx              👥 Participant management
└── settings.tsx                  ⚙️ Event settings
```

### QR Scanning
```
pages/scan/
└── [slug].tsx                    🔲 QR scan experience page
```

## 🔌 API Routes

### Authentication
```
pages/api/auth/
├── [...]nextauth].ts             NextAuth provider
└── register.ts                   User registration endpoint
```

### Public API
```
pages/api/
├── scan/[slug].ts                GET: Zone details | POST: Record scan
├── leaderboard.ts                GET: Leaderboard rankings
└── analytics.ts                  GET: Event analytics (admin)
```

### Admin API
```
pages/api/admin/
├── zones.ts                      GET: List | POST: Create zones
└── activities.ts                 GET: List | POST: Create activities
```

## 🛠️ Library & Utilities

```
lib/
├── auth.ts                       NextAuth configuration & setup
├── prisma.ts                     Prisma client initialization
└── utils.ts                      Helper utility functions
```

### Auth Functions (lib/auth.ts)
- `authOptions` - NextAuth configuration
- Credentials provider setup
- JWT callbacks
- Session callbacks

### Utility Functions (lib/utils.ts)
- `classNames()` - Conditional CSS classes
- `generateSlug()` - URL slug generation
- `formatDate()` - Date formatting
- `generateRandomString()` - String generation
- `getInitials()` - Name initials
- `parseDevice()` - Device detection
- `parseBrowser()` - Browser detection
- Plus 10+ more utilities

## 📦 Type Definitions

```
types/
└── index.ts                      TypeScript interfaces and types
```

### Main Types Defined
- `AuthUser` - Authenticated user
- `ApiResponse<T>` - API response format
- `EventData` - Event structure
- `ZoneData` - Zone structure
- `ActivityData` - Activity structure
- `LeaderboardEntry` - Ranking entry
- `DashboardData` - Dashboard metrics
- `AnalyticsData` - Analytics structure
- Plus 20+ more types

## 🎨 Styling

```
styles/
└── globals.css                   Global CSS styles
```

### CSS Features
- Tailwind CSS base styles
- Custom animations (@keyframes)
- Component utilities
- Responsive utilities

## 🗄️ Database (Prisma)

```
prisma/
├── schema.prisma                 Database schema & models
└── seed.ts                       Sample data for development
```

### Database Models (15 tables)
- `User` - Event attendees
- `Admin` - Platform admins
- `Event` - Events
- `Zone` - Event zones
- `Activity` - Zone activities
- `Scan` - QR scan records
- `Badge` - Achievement badges
- `Reward` - Reward definitions
- `Leaderboard` - Rankings
- `PointsTransaction` - Point tracking
- `ActivityLog` - Activity logs
- `AuditLog` - Audit logs
- `PointsConfig` - Points config
- `RegistrationConfig` - Registration config
- `EventSettings` - Event settings

## 📊 Component Breakdown

### Pages by Purpose

**Authentication**
- `pages/login.tsx` - User login
- `pages/register.tsx` - User signup

**Attendee Experience**
- `pages/passport.tsx` - Dashboard
- `pages/leaderboard.tsx` - Rankings
- `pages/scan/[slug].tsx` - QR scanning
- `pages/event.tsx` - Event info

**Admin Management**
- `pages/admin/index.tsx` - Dashboard
- `pages/admin/events.tsx` - Event management
- `pages/admin/zones.tsx` - Zone management
- `pages/admin/activities.tsx` - Activity setup
- `pages/admin/analytics.tsx` - Analytics
- `pages/admin/leaderboard.tsx` - Rankings mgmt
- `pages/admin/participants.tsx` - User mgmt
- `pages/admin/settings.tsx` - Settings

**System**
- `pages/_app.tsx` - App wrapper
- `pages/_document.tsx` - HTML shell
- `pages/404.tsx` - Error page
- `pages/index.tsx` - Home

## 🔌 API Endpoints by Resource

### Auth (/api/auth)
- `POST /register` - Create new account
- `POST /signin` - Login
- `POST /signout` - Logout
- `GET /session` - Get current session

### Zones (/api)
- `GET /scan/[slug]` - Get zone details
- `POST /scan/[slug]` - Record scan
- `GET /admin/zones` - List zones (admin)
- `POST /admin/zones` - Create zone (admin)

### Activities (/api)
- `GET /admin/activities` - List activities (admin)
- `POST /admin/activities` - Create activity (admin)

### Public
- `GET /leaderboard` - Get rankings
- `GET /analytics` - Get analytics (admin)

## 🔐 Authentication Flow

1. **pages/login.tsx** → Form input
2. **pages/api/auth/[...nextauth].ts** → NextAuth provider
3. **lib/auth.ts** → Credentials verification
4. **pages/api/auth/register.ts** → New account creation
5. **Session available** → Can access protected pages

## 📡 Data Flow

1. **pages/*.tsx** → Display UI components
2. **API calls** → Fetch/POST from axios
3. **pages/api/*.ts** → Handle requests
4. **lib/prisma.ts** → Database queries
5. **prisma/schema.prisma** → Database operations

## 🎯 Key File Purposes

### Setup & Configuration
- `package.json` - Dependencies & scripts
- `.env.example` - Environment template
- `docker-compose.yml` - Local development
- `docker-compose.prod.yml` - Production

### Documentation
- `README.md` - Main guide
- `QUICKSTART.md` - Fast setup
- `DEPLOYMENT.md` - Production guide
- `API.md` - API reference
- `FEATURES.md` - Feature list

### Core Application
- `pages/_app.tsx` - Root wrapper
- `lib/auth.ts` - Authentication
- `lib/prisma.ts` - Database
- `types/index.ts` - Type definitions
- `prisma/schema.prisma` - Database schema

### User Interfaces
- `pages/index.tsx` - Home
- `pages/login.tsx` - Auth
- `pages/passport.tsx` - Dashboard
- `pages/leaderboard.tsx` - Rankings
- `pages/admin/` - Admin pages

### API Layer
- `pages/api/auth/` - Authentication
- `pages/api/scan/` - QR scanning
- `pages/api/admin/` - Admin operations

## 📋 Dependencies

### Frontend
- react, react-dom - UI
- next - Framework
- next-auth - Authentication
- tailwindcss - Styling
- recharts - Charts
- qrcode.react - QR generation
- axios - HTTP client

### Backend
- @prisma/client - ORM
- bcrypt - Password hashing
- jsonwebtoken - JWT tokens
- uuid - ID generation

### Dev Tools
- typescript - Type safety
- eslint - Code linting
- prettier - Code formatting
- prisma - Database toolkit

## 🚀 Getting Started

1. **Read**: `README.md` - Complete overview
2. **Quick Setup**: Follow `QUICKSTART.md` - 5 minutes
3. **Deploy**: See `DEPLOYMENT.md` - Production ready
4. **API Usage**: Check `API.md` - Endpoint reference
5. **Features**: Review `FEATURES.md` - What's included

## 🔍 Finding Things

### Need to add a new page?
→ Create in `pages/` directory

### Need to add an API endpoint?
→ Create in `pages/api/` directory

### Need to add a database model?
→ Edit `prisma/schema.prisma`

### Need to customize styling?
→ Edit `styles/globals.css` or use Tailwind classes

### Need to add a utility function?
→ Add to `lib/utils.ts`

### Need to define types?
→ Add to `types/index.ts`

## 📊 Statistics

- **Total Files**: 50+
- **Pages**: 18
- **API Routes**: 8
- **Database Tables**: 15
- **TypeScript Files**: 35+
- **Documentation**: 7 files
- **Configuration**: 12 files

## 🎓 Learning Path

1. Start with README.md
2. Run QUICKSTART.md setup
3. Explore pages/ structure
4. Review API.md endpoints
5. Check FEATURES.md
6. Read DATABASE schema
7. Review lib/ utilities
8. Study types/index.ts

## 🆘 Troubleshooting

**Connection issues?**
→ Check .env.example and DATABASE_URL

**API not working?**
→ Review pages/api/auth/register.ts and scan/[slug].ts

**Styling issues?**
→ Check styles/globals.css

**Database errors?**
→ Run npm run db:push or check prisma/schema.prisma

**Build errors?**
→ Check tsconfig.json and types/index.ts

---

**Happy Exploring!** 🚀

All files are documented and ready to use.
