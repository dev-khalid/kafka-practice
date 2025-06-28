import { Controller, Get, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @EventPattern('place_order')
  async handlePlaceOrder(@Payload() data: any) {
    try {
      // Handle the order placement logic here
      await this.appService.processOrder(data);
    } catch (error) {
      this.logger.error('Error processing order:', error);
      throw error;
    }
  }
}
