import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @EventPattern('place_order')
  async handlePlaceOrder(@Payload() data: any) {
    this.logger.log('Received place_order event:', JSON.stringify(data));
    try {
      // Handle the order placement logic here
      await this.appService.processOrder(data);
      this.logger.log('Successfully processed order');
    } catch (error) {
      this.logger.error('Error processing order:', error);
      throw error;
    }
  }
}
