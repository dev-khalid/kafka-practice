import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Transport } from '@nestjs/microservices';
import { AppService } from '../app.service';
import {
  SchemaRegistryService,
  PlaceOrderEvent,
} from '../schema-registry.service';

interface KafkaMessage {
  topic: string;
  partition: number;
  headers?: Record<string, any>;
  key?: any;
  value: any;
  timestamp?: string;
  size?: number;
  offset?: string;
}

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);

  constructor(
    private readonly appService: AppService,
    private readonly schemaRegistryService: SchemaRegistryService,
  ) {}

  @EventPattern('place_order', Transport.KAFKA)
  async handlePlaceOrderEvent(@Payload() message: KafkaMessage): Promise<void> {
    this.logger.log(`Received place_order event`);

    try {
      let orderData: PlaceOrderEvent;

      // Check if message is Avro-encoded or JSON
      if (
        message.headers?.['content-type'] === 'application/avro' &&
        message.value
      ) {
        // Decode using schema registry - cast Buffer explicitly to any to satisfy TypeScript
        // This is necessary because the schema registry expects a specific Buffer type
        const buffer = Buffer.from(message.value as Buffer | Uint8Array);
        orderData = await this.schemaRegistryService.decodePlaceOrder(buffer);
        this.logger.log('Successfully decoded Avro message');
      } else if (message.value) {
        // Fallback to JSON for backward compatibility
        orderData =
          typeof message.value === 'object'
            ? (message.value as PlaceOrderEvent)
            : (JSON.parse(
                typeof message.value === 'string'
                  ? message.value
                  : Buffer.from(message.value).toString(),
              ) as PlaceOrderEvent);
        this.logger.log('Parsed JSON message (fallback mode)');
      } else {
        throw new Error('Empty message value received');
      }

      // Process the order
      await this.appService.processOrder(orderData);
    } catch (error) {
      this.logger.error('Error processing message:', error);
      // In production, you might want to send to a dead letter queue
    }
  }
}
