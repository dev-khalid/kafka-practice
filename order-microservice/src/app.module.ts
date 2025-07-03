import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchemaRegistryService } from './schema-registry.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, SchemaRegistryService, KafkaConsumerService],
})
export class AppModule {}
