import { Injectable } from '@nestjs/common';
import { PlaceOrderEvent } from './schema-registry.service';
import { KafkaProducerService } from './kafka-producer.service';

export interface PlaceOrderInput {
  orderId?: string;
  customerId?: string;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount?: number;
  currency?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  paymentMethod?:
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'PAYPAL'
    | 'BANK_TRANSFER'
    | 'CASH_ON_DELIVERY';
  metadata?: Record<string, string>;
}

@Injectable()
export class AppService {
  constructor(private readonly kafkaProducerService: KafkaProducerService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async placeOrder(
    orderInput: PlaceOrderInput,
  ): Promise<{ success: boolean; orderId: string }> {
    // Transform the input data to match the PlaceOrderEvent schema
    const placeOrderEvent: PlaceOrderEvent = {
      orderId: orderInput.orderId || `order-${Date.now()}`,
      customerId: orderInput.customerId || 'default-customer',
      timestamp: Date.now(),
      items: orderInput.items || [
        {
          productId: 'default-product',
          productName: 'Default Product',
          quantity: 1,
          unitPrice: 10.0,
        },
      ],
      totalAmount: orderInput.totalAmount || 10.0,
      currency: orderInput.currency || 'USD',
      shippingAddress: orderInput.shippingAddress || {
        street: '123 Default St',
        city: 'Default City',
        state: 'Default State',
        zipCode: '12345',
        country: 'US',
      },
      paymentMethod: orderInput.paymentMethod || 'CREDIT_CARD',
      metadata: orderInput.metadata || {},
    };

    console.log('Processing order with schema registry:', placeOrderEvent);

    await this.kafkaProducerService.publishPlaceOrder(placeOrderEvent);

    return {
      success: true,
      orderId: placeOrderEvent.orderId,
    };
  }
}
