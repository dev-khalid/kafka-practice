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
  private receiptConsumer: Consumer;

  constructor(
    private readonly schemaRegistryService: SchemaRegistryService,
    private readonly appService: AppService,
  ) {}

  async onModuleInit() {
    const kafkaBroker = process.env.KAFKA_BROKER || 'kafka:9092';
    const paymentConsumerGroupId =
      process.env.KAFKA_PAYMENT_CONSUMER_GROUP_ID || 'payment-consumer-group';
    const receiptConsumerGroupId = 'receipt-generator-group';

    this.logger.log(`Connecting to Kafka broker: ${kafkaBroker}`);

    this.kafka = new Kafka({
      clientId: 'payment-microservice-consumer',
      brokers: [kafkaBroker],
      connectionTimeout: 30000,
      requestTimeout: 30000,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });

    // Set up payment processing consumer
    this.consumer = this.kafka.consumer({
      groupId: paymentConsumerGroupId,
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
            `Payment consumer received message from topic ${topic}, partition ${partition}`,
          );

          if (message.value) {
            const orderData = await this.decodeMessage(
              message.value,
              message.headers,
            );
            await this.appService.processOrder(orderData);
          }
        } catch (error) {
          this.logger.error('Error processing payment message:', error);
        }
      },
    });

    // Set up receipt generator consumer
    this.receiptConsumer = this.kafka.consumer({
      groupId: receiptConsumerGroupId,
      allowAutoTopicCreation: true,
      retry: {
        retries: 5,
      },
    });

    await this.receiptConsumer.connect();
    await this.receiptConsumer.subscribe({
      topic: 'place_order',
      fromBeginning: false,
    });

    await this.receiptConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          this.logger.log(
            `Receipt consumer received message from topic ${topic}, partition ${partition}`,
          );

          if (message.value) {
            const orderData = await this.decodeMessage(
              message.value,
              message.headers,
            );
            await this.generateReceipt(orderData);
          }
        } catch (error) {
          this.logger.error('Error processing receipt message:', error);
        }
      },
    });

    this.logger.log('Kafka consumers started successfully');
  }

  private async decodeMessage(
    value: Buffer,
    headers: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<PlaceOrderEvent> {
    // Check if message is Avro-encoded
    const contentType = headers?.['content-type']?.toString() as string;

    let orderData: PlaceOrderEvent;

    if (contentType === 'application/avro') {
      // Decode using schema registry
      orderData = await this.schemaRegistryService.decodePlaceOrder(value);
      this.logger.log('Successfully decoded Avro message');
    } else {
      // Fallback to JSON for backward compatibility
      orderData = JSON.parse(value.toString()) as PlaceOrderEvent;
      this.logger.log('Parsed JSON message (fallback mode)');
    }

    return orderData;
  }

  private async generateReceipt(orderData: PlaceOrderEvent): Promise<void> {
    this.logger.log(`Generating receipt for order: ${orderData.orderId}`);
    this.logger.log(`Receipt data: ${JSON.stringify(orderData)}`);

    // Simulate generating draft receipt with payment details.
    await new Promise((resolve) => setTimeout(resolve, 5000));

    this.logger.log(
      `Receipt generated successfully for order: ${orderData.orderId}`,
    );
  }

  async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.logger.log('Payment Kafka consumer disconnected');
    }
    if (this.receiptConsumer) {
      await this.receiptConsumer.disconnect();
      this.logger.log('Receipt Kafka consumer disconnected');
    }
  }
}
