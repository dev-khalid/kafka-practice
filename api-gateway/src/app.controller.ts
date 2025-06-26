import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Observable } from 'rxjs';

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
  placeOrder(@Body() order: any): Observable<any> {
    return this.appService.placeOrder(order);
  }
}
