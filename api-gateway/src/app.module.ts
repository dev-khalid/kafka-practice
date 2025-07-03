import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HealthModule } from './health/health.module';
import { KafkaTopics } from './config';
import { SchemaRegistryService } from './schema-registry.service';
import { KafkaProducerService } from './kafka-producer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: KafkaTopics.ORDER,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'order-service-client',
            brokers: ['kafka:9092'],
            connectionTimeout: 30000,
            requestTimeout: 30000,
            retry: {
              retries: 5,
              initialRetryTime: 300,
              maxRetryTime: 30000,
            },
          },
          consumer: {
            groupId: 'order-consumer-group',
            allowAutoTopicCreation: false,
            retry: {
              retries: 5,
            },
          },
        },
      },
      {
        name: KafkaTopics.AUTH,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-service-client',
            brokers: ['kafka:9092'],
            connectionTimeout: 30000,
            requestTimeout: 30000,
            retry: {
              retries: 5,
              initialRetryTime: 300,
              maxRetryTime: 30000,
            },
          },
          consumer: {
            groupId: 'auth-consumer-group',
            allowAutoTopicCreation: false,
            retry: {
              retries: 5,
            },
          },
        },
      },
    ]),
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, SchemaRegistryService, KafkaProducerService],
})
export class AppModule {}
