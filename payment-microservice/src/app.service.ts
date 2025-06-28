import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello World!';
  }

  async processOrder(orderData: any): Promise<void> {
    this.logger.log('Initiating payment for order:', JSON.stringify(orderData));
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Add your order processing logic here
    // For example: save to database, validate order, etc.

    this.logger.log('Payment initiated successfully.');
  }
}
