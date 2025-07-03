import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('OrderMicroservice');

  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 8080;
  await app.listen(port);

  logger.log(`Order microservice is running on port ${port}`);
  logger.log('Order microservice is listening for Kafka events...');
}

bootstrap().catch((error) => {
  console.error('Failed to start order microservice:', error);
  process.exit(1);
});
