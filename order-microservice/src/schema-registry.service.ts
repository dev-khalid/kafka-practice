/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Schema Registry types are incomplete
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

export interface PlaceOrderEvent {
  orderId: string;
  customerId: string;
  timestamp: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  currency: string;
  shippingAddress: {
    street: string;
    city: string;
    state?: string | null;
    zipCode: string;
    country: string;
  };
  paymentMethod:
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'PAYPAL'
    | 'BANK_TRANSFER'
    | 'CASH_ON_DELIVERY';
  metadata: Record<string, string>;
}

@Injectable()
export class SchemaRegistryService implements OnModuleInit {
  private readonly logger = new Logger(SchemaRegistryService.name);
  private registry: any; // Using any due to incomplete types

  onModuleInit() {
    const schemaRegistryUrl =
      process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081';

    this.logger.log(`Connecting to Schema Registry at: ${schemaRegistryUrl}`);

    this.registry = new SchemaRegistry({
      host: schemaRegistryUrl,
    });

    this.logger.log('Schema Registry connected successfully');
  }

  async decodePlaceOrder(buffer: Buffer): Promise<PlaceOrderEvent> {
    try {
      const decoded = (await this.registry.decode(buffer)) as PlaceOrderEvent;
      this.logger.debug('Successfully decoded place_order event');
      return decoded;
    } catch (error) {
      this.logger.error('Failed to decode place_order event:', error);
      throw error;
    }
  }

  async getSchemaById(schemaId: number): Promise<any> {
    return await this.registry.getSchema(schemaId);
  }

  async getLatestSchema(subject: string): Promise<any> {
    return await this.registry.getLatestSchemaMetadata(subject);
  }
}
