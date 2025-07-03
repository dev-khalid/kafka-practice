import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService, PlaceOrderInput } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Post('order')
  async placeOrder(
    @Body() order: PlaceOrderInput,
  ): Promise<{ success: boolean; orderId: string }> {
    return await this.appService.placeOrder(order);
  }
}
