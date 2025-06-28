import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Controller('receipts')
export class ReceiptGeneratorController {
  private readonly logger = new Logger(ReceiptGeneratorController.name);

  @EventPattern('place_order')
  async handlePlaceOrder(data: any) {
    this.logger.log('Generating receipt for order:', JSON.stringify(data));
    // Simulate generating draft receipt with DEU payment details.
    await new Promise((resolve) => setTimeout(resolve, 5000));

    this.logger.log('Receipt generated successfully.');
  }
}
