import { Controller } from '@nestjs/common';

@Controller('health')
export class HealthController {
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
