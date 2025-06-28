import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('OrderMicroservice');

  // Get Kafka broker from environment or use default
  const kafkaBroker = process.env.KAFKA_BROKER || 'kafka:9092';
  const consumerGroupId =
    process.env.KAFKA_PAYMENT_CONSUMER_GROUP_ID || 'payment-consumer-group';

  logger.log(`Connecting to Kafka broker: ${kafkaBroker}`);
  logger.log(`Using consumer group: ${consumerGroupId}`);
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'payment-microservice-client',
        brokers: [kafkaBroker],
        connectionTimeout: 30000,
        requestTimeout: 30000,
        retry: {
          retries: 5,
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
      },
      consumer: {
        groupId: consumerGroupId,
        allowAutoTopicCreation: true,
        retry: {
          retries: 5,
        },
      },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'payment-microservice-client',
        brokers: [kafkaBroker],
        connectionTimeout: 30000,
        requestTimeout: 30000,
        retry: {
          retries: 5,
          initialRetryTime: 300,
          maxRetryTime: 30000,
        },
      },
      consumer: {
        groupId: 'receipt-generator-group',
        allowAutoTopicCreation: true,
        retry: {
          retries: 5,
        },
      },
    },
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);

  await app.startAllMicroservices();

  app.useLogger(logger);

  logger.log(`Order microservice is running on port ${port}`);
  logger.log('Order microservice is listening for Kafka events...');
}

bootstrap().catch((error) => {
  console.error('Failed to start order microservice:', error);
  process.exit(1);
});
