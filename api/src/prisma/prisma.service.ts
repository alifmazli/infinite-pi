import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  // Removed onModuleInit - PrismaClient connects lazily on first query
  // This prevents blocking server startup if database is slow/unavailable

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

