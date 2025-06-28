import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Hello World!';
  }

  async processOrder(orderData: any): Promise<void> {
    this.logger.log('Processing order:', JSON.stringify(orderData));

    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log('Order processed successfully');
  }
}
