import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import {
  PlaceOrderEvent,
  SchemaRegistryService,
} from './schema-registry.service';
import { AppService } from './app.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly schemaRegistryService: SchemaRegistryService,
    private readonly appService: AppService,
  ) {}

  async onModuleInit() {
    const kafkaBroker = process.env.KAFKA_BROKER || 'kafka:9092';
    const consumerGroupId =
      process.env.KAFKA_ORDER_CONSUMER_GROUP_ID || 'order-consumer-group';

    this.logger.log(`Connecting to Kafka broker: ${kafkaBroker}`);
    this.logger.log(`Using consumer group: ${consumerGroupId}`);

    this.kafka = new Kafka({
      clientId: 'order-microservice-consumer',
      brokers: [kafkaBroker],
      connectionTimeout: 30000,
      requestTimeout: 30000,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: consumerGroupId,
      allowAutoTopicCreation: true,
      retry: {
        retries: 5,
      },
    });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: 'place_order',
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          this.logger.log(
            `Received message from topic ${topic}, partition ${partition}`,
          );

          if (message.value) {
            // Check if message is Avro-encoded
            const contentType = message.headers?.['content-type']?.toString();

            let orderData: PlaceOrderEvent;

            if (contentType === 'application/avro') {
              // Decode using schema registry
              orderData = await this.schemaRegistryService.decodePlaceOrder(
                message.value,
              );
              this.logger.log('Successfully decoded Avro message');
            } else {
              // Fallback to JSON for backward compatibility
              orderData = JSON.parse(
                message.value.toString(),
              ) as PlaceOrderEvent;
              this.logger.log('Parsed JSON message (fallback mode)');
            }

            // Process the order
            await this.appService.processOrder(orderData);
          }
        } catch (error) {
          this.logger.error('Error processing message:', error);
          // In production, you might want to send to a dead letter queue
        }
      },
    });

    this.logger.log('Kafka consumer started successfully');
  }

  async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    }
  }
}
