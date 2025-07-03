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
      `Processing order: ${orderData.orderId} for customer: ${orderData.customerId}`,
    );
    this.logger.log(`Order items: ${JSON.stringify(orderData.items)}`);
    this.logger.log(
      `Total amount: ${orderData.totalAmount} ${orderData.currency}`,
    );

    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`Order ${orderData.orderId} processed successfully`);
  }
}
