import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT', 8080);
  await app.listen(port);

  console.log(`🚀 API Gateway is running on: http://localhost:${port}`);
  console.log(
    `📊 Health check available at: http://localhost:${port}/api/health`,
  );
}

void bootstrap();
