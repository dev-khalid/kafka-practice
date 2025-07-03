import { Injectable, Logger } from '@nestjs/common';
import { PlaceOrderEvent } from './schema-registry.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello World!';
  }

  async processOrder(orderData: PlaceOrderEvent): Promise<void> {
    this.logger.log(
      `Initiating payment for order: ${orderData.orderId} for customer: ${orderData.customerId}`,
    );
    this.logger.log(
      `Payment amount: ${orderData.totalAmount} ${orderData.currency}`,
    );
    this.logger.log(`Payment method: ${orderData.paymentMethod}`);

    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Add your order processing logic here
    // For example: save to database, validate order, etc.

    this.logger.log(
      `Payment initiated successfully for order: ${orderData.orderId}`,
    );
  }
}
