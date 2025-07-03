import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PaymentMicroservice');

  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 8080;
  await app.listen(port);

  logger.log(`Payment microservice is running on port ${port}`);
  logger.log('Payment microservice is listening for Kafka events...');
}

bootstrap().catch((error) => {
  console.error('Failed to start payment microservice:', error);
  process.exit(1);
});
