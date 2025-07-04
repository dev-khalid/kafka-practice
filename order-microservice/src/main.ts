import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('OrderMicroservice');

  // Create the HTTP app
  const app = await NestFactory.create(AppModule);

  // Connect the Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'order-microservice',
        brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
        connectionTimeout: 30000,
        requestTimeout: 30000,
        retry: {
          retries: 5,
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
      },
      consumer: {
        groupId:
          process.env.KAFKA_ORDER_CONSUMER_GROUP_ID || 'order-consumer-group',
        allowAutoTopicCreation: true,
        retry: {
          retries: 5,
        },
      },
    },
  });

  // Start the microservices
  await app.startAllMicroservices();

  // Start the HTTP server
  const port = process.env.PORT || 8080;
  await app.listen(port);

  logger.log(`Order microservice HTTP server running on port ${port}`);
  logger.log('Order microservice is listening for Kafka events...');
}

bootstrap().catch((error) => {
  console.error('Failed to start order microservice:', error);
  process.exit(1);
});
