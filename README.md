# Infinite Pi API

A high-performance NestJS API for calculating Pi to arbitrary precision using the Chudnovsky algorithm, implemented in TypeScript/JavaScript.

## Setup

### Prerequisites

- Node.js 18+
- npm

### Environment Variables

Create a `.env` file in the `api` directory:

```env
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
ALLOWED_ORIGINS="http://localhost:3000"

# Optional: Pi computation configuration
PI_INCREMENT_LOW=10
PI_INCREMENT_MEDIUM=1000
PI_INCREMENT_HIGH_PERCENT=5
PI_WRITE_BATCH_SIZE=10
PI_WRITE_BATCH_INTERVAL_MS=5000
PI_DB_CLEANUP_ENABLED=false
```

### Installation

```bash
cd api
npm install
npm run db:generate
npm run db:push
```

### Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API runs on `http://localhost:3001` by default (configure via `PORT` env variable).

### API Endpoints

- `GET /pi` - Returns the current most accurate Pi value
- `GET /health` - Health check

Example response:

```json
{
  "value": "3.141592653589793238462643383279",
  "decimalPlaces": 30,
  "cached": true
}
```

---

## Technical Writeup: Production Considerations & Architecture

### Problem Statement

Build a system that continuously computes Pi to increasing precision levels, making the latest value available via API while maintaining good performance and data persistence. The challenge is balancing computation speed, database write frequency, API responsiveness, and system reliability.

### Core Technical Decisions

#### 1. Algorithm Choice: Chudnovsky

We use the Chudnovsky algorithm because it converges very quickly—each term adds approximately 14.18 decimal digits. This means computing 1000 digits requires only ~70 terms, making it practical for real-time computation.

**Tradeoff**: While faster than alternatives like Leibniz or Machin formulas, it requires arbitrary precision arithmetic since intermediate calculations involve extremely large numbers. We use `decimal.js` which handles this but is slower than native number operations.

#### 2. Write Batching Strategy

Early iterations wrote to the database after every computation (<1ms per calculation). This created a bottleneck—database writes became the limiting factor, not computation.

**Solution**: Implemented a write buffer that batches multiple computed values:

- Values accumulate in memory
- Flush triggers when buffer reaches a threshold (default: 10 values) OR after a time interval (default: 5 seconds)
- Uses database transactions for atomic batch writes
- Buffer is checked first when serving API requests, so users see the latest value even before it's persisted

**Tradeoff**: Small risk of data loss if the process crashes before a flush. We accept this because:

- The computation is deterministic (can recompute)
- The buffer is small (typically <10 values)
- The time window is short (5 seconds max)
- For production, you'd add periodic checkpoints or use a message queue

#### 3. Adaptive Increment Strategy

The precision increment strategy adapts based on current precision level:

- **Low precision (< 1000)**: Small fixed increments (default: 10) for frequent updates
- **Medium precision (1k-100k)**: Moderate increments (default: 1000) to balance progress and restart safety
- **High precision (> 100k)**: Percentage-based increments (default: 5%) to ensure progress without losing too much work on restart

**Why**: At low precision, computations are fast and users expect frequent updates. At high precision, each computation takes longer, so we make larger jumps. Percentage-based increments at very high precision prevent tiny steps that would take hours but only add a few digits.

**Tradeoff**: The "right" increment values depend on your hardware and use case. We made them configurable via environment variables with sensible defaults.

#### 4. In-Memory Caching

API requests check three sources in order:

1. Write buffer (most recent, not yet persisted)
2. In-memory cache (last flushed value)
3. Database (fallback)

This ensures API responses are fast (<1ms) even when the database is under load from batch writes.

**Tradeoff**: Cache invalidation is simple (update on flush) but means we're serving potentially stale data if the cache isn't updated. In practice, this is fine because we're always moving forward—the "latest" value is always the highest precision, and we update the cache with the highest precision from each flush.

#### 5. Non-Blocking Initialization

The computation service initializes asynchronously after the server starts, with timeouts to prevent hanging. This ensures the API is responsive immediately, even if database initialization is slow.

**Tradeoff**: There's a brief window where the API might return "no value found" if queried immediately after startup. We accept this for better startup reliability.

#### 6. Event Loop Yielding

For high-precision calculations (>1000 digits), the computation can take seconds. We use an async version that yields to the event loop every 5 iterations, allowing HTTP requests to be processed even during long computations.

**Tradeoff**: Slightly slower computation (due to yield overhead), but the server remains responsive. For very high precision, you might want to move computation to a worker thread or separate service.

### Architecture Overview

```
┌─────────────────┐
│   API Request   │
│   GET /pi       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   PiService                     │
│   - Check write buffer (fast)   │
│   - Check cache (fast)          │
│   - Fallback to DB (slow)      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   PiComputationService           │
│   (Background Process)           │
│                                  │
│   1. Compute next precision     │
│   2. Add to write buffer         │
│   3. Flush buffer periodically   │
│   4. Update cache on flush       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   PiCalculatorService            │
│   - Chudnovsky algorithm         │
│   - Uses decimal.js              │
│   - Async for high precision     │
└─────────────────────────────────┘
```

### Production Considerations

**What We Did:**

- Write batching to reduce database load
- In-memory caching for fast API responses
- Configurable parameters for different environments
- Graceful error handling and logging
- Non-blocking initialization

**What We'd Add for True Production:**

- **CORS**: Currently handled in NestJS. In production, this should be done at the reverse proxy (nginx/Cloudflare) level for better security and performance
- **Monitoring**: Add metrics (computation rate, buffer size, flush frequency, API latency)
- **Persistence**: For critical data, use a message queue (Redis/RabbitMQ) instead of in-memory buffer
- **Scaling**: Move computation to worker threads or separate services for very high precision
- **Database**: Consider PostgreSQL for better concurrency if serving many clients
- **Rate Limiting**: Add rate limits to prevent abuse
- **Health Checks**: More comprehensive health endpoint that checks computation service status

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
