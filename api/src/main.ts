import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

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

    const configService = app.get(ConfigService);
    const appConfig = configService.app;

    // Enable CORS from config
    app.enableCors({
      origin: appConfig.cors.origins,
      methods: appConfig.cors.methods,
      allowedHeaders: appConfig.cors.allowedHeaders,
      credentials: appConfig.cors.credentials,
    });

    // Enable API versioning
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger/OpenAPI documentation
    if (appConfig.nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Infinite Pi API')
        .setDescription('API for calculating Pi to arbitrary precision')
        .setVersion('1.0')
        .addTag('Pi', 'Pi computation endpoints')
        .addTag('Health', 'Health check endpoints')
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      logger.log('📚 Swagger documentation available at /api/docs');
    }

    const port = appConfig.port;

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
    logger.log(`🌍 Environment: ${appConfig.nodeEnv}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error(`Failed to bootstrap application: ${errorMessage}`, errorStack);
    process.exit(1);
  }
}
bootstrap();
