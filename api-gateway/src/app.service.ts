import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaTopics } from './config';

@Injectable()
export class AppService {
  constructor(
    @Inject(KafkaTopics.AUTH) private readonly authClient: ClientKafka,
    @Inject(KafkaTopics.ORDER) private readonly orderClient: ClientKafka,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  placeOrder(order: any) {
    const result = this.orderClient.emit('place_order', order);
    console.log('Order placed:', order);
    return result;
  }
}
