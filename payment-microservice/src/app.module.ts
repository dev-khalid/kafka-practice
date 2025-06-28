import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReceiptGeneratorController } from './receipt-generator.controller';

@Module({
  imports: [],
  controllers: [AppController, ReceiptGeneratorController],
  providers: [AppService],
})
export class AppModule {}
