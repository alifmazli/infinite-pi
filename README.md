# Infinite Pi

App for calculating Pi to arbitrary precision using the Chudnovsky algorithm, implemented in NestJS and Next.js.

## Setup

### Prerequisites

- Node.js 18+
- npm

<!-- ### Environment Variables

Create a `.env` file in the `api` directory (or copy from `.env.example`):

```env
# Application Configuration
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

# Database Configuration
DATABASE_URL="file:./prisma/dev.db"

# Pi Computation Configuration
PI_INCREMENT_LOW=10
PI_INCREMENT_MEDIUM=1000
PI_INCREMENT_HIGH_PERCENT=5
PI_WRITE_BATCH_SIZE=10
PI_WRITE_BATCH_INTERVAL_MS=5000
PI_DB_CLEANUP_ENABLED=false
PI_DB_CLEANUP_KEEP_MILESTONES=true
PI_DB_CLEANUP_MIN_PRECISION=1000

# Rate Limiting Configuration
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

See `api/.env.example` for a complete template with all available options. -->

### Installation

**Backend (API):**

```bash
cd api
# Copy environment variables template
# Edit .env with your configuration
cp .env.example .env

npm install
npm run db:generate
npm run db:push

```

**Frontend (Web):**

```bash
cd web
npm install

# Optional: Create .env.local if you need to customize API URL
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Running

**Development Mode (Run both API and Web):**

You'll need two terminal windows:

**Terminal 1 - API:**

```bash
cd api
npm run start:dev
```

The API will run on `http://localhost:3001`

**Terminal 2 - Web:**

```bash
cd web
npm run dev
```

The web app will run on `http://localhost:3002`

**Production Mode:**

**API:**

```bash
cd api
npm run build
npm run start:prod
```

**Web:**

```bash
cd web
npm run build
npm run start
```

### Application URLs

- **API**: `http://localhost:3001` (default, configurable via `PORT` env variable)
- **Web App**: `http://localhost:3002` (default)
- **API Docs**: `http://localhost:3001/api/docs` (development only)

### API Endpoints

All endpoints are prefixed with `/api` and use versioning:

- `GET /api/` - API root with endpoint information
- `GET /api/v1/pi` - Returns the current most accurate Pi value
- `GET /api/health` - Comprehensive health check (database, computation service)
- `GET /api/docs` - Swagger/OpenAPI documentation (development only)

**Example Pi response:**

```json
{
  "success": true,
  "data": {
    "value": "3.141592653589793238462643383279",
    "decimalPlaces": 30,
    "cached": true,
    "cachedAt": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "correlationId": "uuid-here"
  }
}
```

**Example Health response:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "All services are healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "services": {
      "database": {
        "status": "healthy"
      },
      "computation": {
        "status": "healthy",
        "message": "Latest precision: 1000"
      }
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "correlationId": "uuid-here"
  }
}
```

---

## Frontend Structure

The web application is built with **Next.js 16** (App Router) and **React 19**, using **TypeScript** and **Tailwind CSS** for styling.

### Architecture Overview

```
web/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main home page (client component)
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles and Tailwind
│
├── components/            # React components
│   ├── page-header.tsx    # Page header with title and description
│   ├── pi-value-card.tsx  # Card displaying Pi value and precision
│   ├── sun-circumference-card.tsx  # Card calculating sun circumference
│   ├── sun-icon-3d.tsx    # 3D animated sun icon component
│   └── ui/                # Reusable UI components (shadcn/ui style)
│       ├── badge.tsx
│       └── card.tsx
│
├── hooks/                 # Custom React hooks
│   └── use-pi-data.ts     # Hook for fetching Pi data from API
│
├── lib/                   # Utility functions and types
│   ├── types.ts           # TypeScript type definitions
│   ├── calculations.ts    # Calculation utilities (sun circumference)
│   └── utils.ts           # General utilities (cn helper for Tailwind)
│
└── public/                # Static assets
```

### Key Features

**Data Fetching:**

- Uses custom `usePiData` hook that:
  - Fetches from `/api/v1/pi` endpoint
  - Auto-refreshes every 3 seconds
  - Handles loading and error states
  - Extracts data from standardized API response format

**Component Structure:**

- **Page Component** (`app/page.tsx`): Main page layout with responsive grid
- **PiValueCard**: Displays the current Pi value with precision and cache status
- **SunCircumferenceCard**: Calculates and displays sun's circumference using Pi
- **PageHeader**: Header section with app title and description

**Styling:**

- Tailwind CSS for utility-first styling
- Dark mode support (via Tailwind dark mode)
- Responsive design (mobile-first, adapts to large screens)
- Gradient backgrounds and modern UI components

**Type Safety:**

- Full TypeScript coverage
- Shared types between frontend and backend (mirrored in `lib/types.ts`)
- Type-safe API responses

**API Integration:**

- Fetches from `http://localhost:3001/api/v1/pi` (configurable via `NEXT_PUBLIC_API_URL`)
- Handles the standardized response format: `{ success, data, meta }`
- Extracts `data` field for component consumption

---

## Technical Writeup: Production Considerations & Architecture

### Problem Statement

Build a system that continuously computes Pi to increasing precision levels, making the latest value available via API while maintaining good performance and data persistence. The challenge is balancing computation speed, database write frequency, API responsiveness, and system reliability.

### Core Technical Decisions

#### 1. Algorithm Choice: Chudnovsky

Chudnovsky algorithm is used because it converges very quickly—each term adds approximately 14.18 decimal digits. This means computing 1000 digits requires only ~70 terms, making it practical for real-time computation.

**Tradeoff**: While faster than alternatives like Leibniz or Machin formulas, it requires arbitrary precision arithmetic since intermediate calculations involve extremely large numbers. The implementation uses `decimal.js` which handles this but is slower than native number operations.

#### 2. Write Batching Strategy

Early iterations wrote to the database after every computation (<1ms per calculation). This created a bottleneck—database writes became the limiting factor, not computation.

**Solution**: Implemented a write buffer that batches multiple computed values:

- Values accumulate in memory
- Flush triggers when buffer reaches a threshold (default: 10 values) OR after a time interval (default: 5 seconds)
- Uses database transactions for atomic batch writes
- Buffer is checked first when serving API requests, so users see the latest value even before it's persisted

**Tradeoff**: Small risk of data loss if the process crashes before a flush. This is acceptable because:

- The computation is deterministic (can recompute)
- The buffer is small (typically <10 values)
- The time window is short (5 seconds max)
- For production, you'd add periodic checkpoints or use a message queue

#### 3. Adaptive Increment Strategy

The precision increment strategy adapts based on current precision level:

- **Low precision (< 1000)**: Small fixed increments (default: 10) for frequent updates
- **Medium precision (1k-100k)**: Moderate increments (default: 1000) to balance progress and restart safety
- **High precision (> 100k)**: Percentage-based increments (default: 5%) to ensure progress without losing too much work on restart

**Why**: At low precision, computations are fast and users expect frequent updates. At high precision, each computation takes longer, so larger jumps are made. Percentage-based increments at very high precision prevent tiny steps that would take hours but only add a few digits.

**Tradeoff**: The "right" increment values depend on your hardware and use case. These are made configurable via environment variables with sensible defaults.

#### 4. In-Memory Caching

API requests check three sources in order:

1. Write buffer (most recent, not yet persisted)
2. In-memory cache (last flushed value)
3. Database (fallback)

This ensures API responses are fast (<1ms) even when the database is under load from batch writes.

**Tradeoff**: Cache invalidation is simple (update on flush) but means potentially stale data may be served if the cache isn't updated. In practice, this is fine because the system is always moving forward—the "latest" value is always the highest precision, and the cache is updated with the highest precision from each flush.

#### 5. Non-Blocking Initialization

The computation service initializes asynchronously after the server starts, with timeouts to prevent hanging. This ensures the API is responsive immediately, even if database initialization is slow.

**Tradeoff**: There's a brief window where the API might return "no value found" if queried immediately after startup. This is accepted for better startup reliability.

#### 6. Event Loop Yielding

For high-precision calculations (>1000 digits), the computation can take seconds. An async version is used that yields to the event loop every 5 iterations, allowing HTTP requests to be processed even during long computations.

**Tradeoff**: Slightly slower computation (due to yield overhead), but the server remains responsive. For very high precision, you might want to move computation to a worker thread or separate service.

### Architecture Overview

```
┌─────────────────────────────┐
│   API Request               │
│   GET /api/v1/pi            │
│   (with correlation ID)     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│   Interceptors & Middleware                 │
│   - Correlation ID                          │
│   - Rate Limiting                           │
│   - DB Retry Logic                          │
│   - Input Validation                        │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│   PiController (v1)                         │
│   - Standardized Response Format            │
│   - Swagger Documentation                   │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│   PiService                                 │
│   - Check write buffer (fast)               │
│   - Check cache (fast)                      │
│   - Fallback to DB (with retry)             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│   PiComputationService                      │
│   (Background Process)                      │
│                                             │
│   1. Compute next precision                 │
│   2. Add to write buffer                    │
│   3. Flush buffer periodically              │
│   4. Update cache on flush                  │
│   5. Error handling with retry              │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│   PiCalculatorService                       │
│   - Chudnovsky algorithm                    │
│   - Uses decimal.js                         │
│   - Async for high precision                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│   ConfigService                             │
│   - Centralized configuration               │
│   - Environment validation                  │
│   - Type-safe config access                 │
└─────────────────────────────────────────────┘
```

### Production Considerations

**Implemented Features:**

- ✅ Write batching to reduce database load
- ✅ In-memory caching for fast API responses
- ✅ Configurable parameters for different environments
- ✅ Graceful error handling and logging
- ✅ Non-blocking initialization
- ✅ **Rate limiting** - Configurable throttling to prevent abuse
- ✅ **Health checks** - Comprehensive health endpoint with database and service status
- ✅ **API versioning** - URI-based versioning (v1) for future compatibility
- ✅ **Standardized responses** - Consistent API response format with correlation IDs
- ✅ **Input validation** - Global validation pipe with whitelist and transformation
- ✅ **Error handling** - Prisma error handling with retry logic and exponential backoff
- ✅ **Request tracing** - Correlation IDs for distributed tracing
- ✅ **API documentation** - Swagger/OpenAPI docs available at `/api/docs`
- ✅ **Type safety** - Full TypeScript type safety with shared interfaces
- ✅ **Configuration validation** - Joi schema validation for environment variables
- ✅ **Unit tests** - Test coverage for core services

**Additional Production Enhancements (Future):**

- **Authentication & Authorization**: Add API key authentication or JWT-based auth for protected endpoints, role-based access control (RBAC) if needed
- **Monitoring**: Add metrics (computation rate, buffer size, flush frequency, API latency)
- **Persistence**: For critical data, use a message queue (Redis/RabbitMQ) instead of in-memory buffer
- **Scaling**: Move computation to worker threads or separate services for very high precision
- **Database**: Consider PostgreSQL for better concurrency if serving many clients
- **CORS**: In production, consider handling at the reverse proxy (nginx/Cloudflare) level for better security and performance
- **Security Headers**: Add Helmet.js for security headers (XSS protection, content security policy, etc.)

### Performance Characteristics

- **Computation**: ~1ms per term for low precision, scales roughly linearly
- **API Response**: <1ms (served from memory)
- **Database Write**: ~10-50ms per batch (depends on batch size and hardware)
- **Memory**: Minimal—only stores latest value in cache and small buffer

### Tradeoffs Summary

| Decision                  | Benefit                                | Cost                                                 |
| ------------------------- | -------------------------------------- | ---------------------------------------------------- |
| Write batching            | Reduces DB load, faster API            | Small risk of data loss on crash                     |
| In-memory cache           | Fast API responses                     | Potential for stale data (minimal in practice)       |
| Adaptive increments       | Balances progress vs. restart safety   | Requires tuning for specific use cases               |
| JavaScript implementation | Simple, maintainable, works everywhere | Slower than native C/WASM (acceptable for our scale) |
| Async computation         | Server stays responsive                | Slightly slower computation                          |

The system prioritizes **reliability and maintainability** over raw performance, which is appropriate for a continuous computation service where correctness and uptime matter more than microsecond optimizations.
