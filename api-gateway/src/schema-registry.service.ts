/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Schema Registry types are incomplete
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import * as fs from 'fs';
import * as path from 'path';

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
  private placeOrderSchemaId: number;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const schemaRegistryUrl = this.configService.get<string>(
      'SCHEMA_REGISTRY_URL',
      'http://localhost:8081',
    );

    this.logger.log(`Connecting to Schema Registry at: ${schemaRegistryUrl}`);

    this.registry = new SchemaRegistry({
      host: schemaRegistryUrl,
    });

    await this.registerSchemas();
  }

  private async registerSchemas() {
    try {
      // Load and register the place-order schema
      const schemaPath = path.join(
        process.cwd(),
        '..',
        'schemas',
        'place-order.avsc',
      );
      const placeOrderSchema = JSON.parse(
        fs.readFileSync(schemaPath, 'utf8'),
      ) as Record<string, any>;

      this.logger.log('Registering place-order schema...');

      const { id } = await this.registry.register(
        {
          type: 'AVRO',
          schema: JSON.stringify(placeOrderSchema),
        },
        {
          subject: 'place_order-value',
        },
      );

      this.placeOrderSchemaId = id;
      this.logger.log(`Registered place-order schema with ID: ${id}`);
    } catch (error) {
      this.logger.error('Failed to register schemas:', error);
      throw error;
    }
  }

  async encodePlaceOrder(data: PlaceOrderEvent): Promise<Buffer> {
    try {
      const encoded = await this.registry.encode(this.placeOrderSchemaId, data);
      this.logger.debug('Successfully encoded place_order event');
      return encoded as Buffer;
    } catch (error) {
      this.logger.error('Failed to encode place_order event:', error);
      throw error;
    }
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

  getPlaceOrderSchemaId(): number {
    return this.placeOrderSchemaId;
  }
}
