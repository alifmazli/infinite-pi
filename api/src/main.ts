import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Add timeout to app creation
    const app = await Promise.race([
      NestFactory.create(AppModule),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('App creation timeout after 30s')),
          30000,
        ),
      ),
    ]);

    // Enable CORS
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3002',
        ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    const port = process.env.PORT ?? 3001;

    // Add timeout to listen
    await Promise.race([
      app.listen(port),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Server listen timeout after 10s')),
          10000,
        ),
      ),
    ]);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📦 Runtime: Node.js ${process.version}`);
  } catch (error) {
    logger.error(
      `Failed to bootstrap application: ${error.message}`,
      error.stack,
    );
    process.exit(1);
  }
}
bootstrap();
