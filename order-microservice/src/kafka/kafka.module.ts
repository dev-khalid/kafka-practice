import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaController } from './kafka.controller';
import { AppService } from '../app.service';
import { SchemaRegistryService } from '../schema-registry.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
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
              process.env.KAFKA_ORDER_CONSUMER_GROUP_ID ||
              'order-consumer-group',
            allowAutoTopicCreation: true,
            retry: {
              retries: 5,
            },
          },
        },
      },
    ]),
  ],
  controllers: [KafkaController],
  providers: [AppService, SchemaRegistryService],
  exports: [],
})
export class KafkaModule {}
