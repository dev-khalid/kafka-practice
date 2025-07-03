import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import {
  PlaceOrderEvent,
  SchemaRegistryService,
} from './schema-registry.service';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(
    private readonly configService: ConfigService,
    private readonly schemaRegistryService: SchemaRegistryService,
  ) {}

  async onModuleInit() {
    const kafkaBroker = this.configService.get<string>(
      'KAFKA_BROKER',
      'kafka:9092',
    );

    this.logger.log(`Connecting to Kafka broker: ${kafkaBroker}`);

    this.kafka = new Kafka({
      clientId: 'api-gateway-producer',
      brokers: [kafkaBroker],
      connectionTimeout: 30000,
      requestTimeout: 30000,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });

    this.producer = this.kafka.producer();
    await this.producer.connect();

    this.logger.log('Kafka producer connected successfully');
  }

  async publishPlaceOrder(orderData: PlaceOrderEvent): Promise<void> {
    try {
      this.logger.log('Publishing place_order event with schema registry...');

      // Encode the data using the schema registry
      const encodedData =
        await this.schemaRegistryService.encodePlaceOrder(orderData);

      // Send the encoded message to Kafka
      await this.producer.send({
        topic: 'place_order',
        messages: [
          {
            key: orderData.orderId,
            value: encodedData,
            headers: {
              'content-type': 'application/avro',
              'schema-id': this.schemaRegistryService
                .getPlaceOrderSchemaId()
                .toString(),
            },
          },
        ],
      });

      this.logger.log(
        `Successfully published place_order event for order: ${orderData.orderId}`,
      );
    } catch (error) {
      this.logger.error('Failed to publish place_order event:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }
  }
}
