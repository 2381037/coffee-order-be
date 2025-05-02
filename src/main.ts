import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global Prefix
  app.setGlobalPrefix('api');

  // Enable CORS (Configure properly for production)
  app.enableCors({
    origin: '*', // Allow all origins for now (restrict in production)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not defined in DTO
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Allow auto-conversion for primitives like :id
      },
    }),
  );

  // Swagger Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Coffee Ordering API')
    .setDescription('API documentation for the Coffee Ordering application')
    .setVersion('1.0')
    .addBearerAuth(
      // Define Bearer Auth security scheme
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // Name to reference in @ApiBearerAuth decorator
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document); // Serve Swagger UI at /api/docs

  // Get port from environment variables or default to 3000
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(
    `Swagger documentation available at: ${await app.getUrl()}/api/docs`,
  );
}
bootstrap();
