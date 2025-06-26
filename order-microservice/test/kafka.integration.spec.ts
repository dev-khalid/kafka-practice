import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import { AppModule } from '../src/app.module';

describe('Kafka Integration Test', () => {
  let app: INestMicroservice;
  let client: ClientKafka;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'KAFKA_TEST_CLIENT',
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'test-client',
                brokers: ['kafka:9092'],
              },
              consumer: {
                groupId: 'test-consumer-group',
              },
            },
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestMicroservice({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'test-microservice',
          brokers: ['kafka:9092'],
        },
        consumer: {
          groupId: 'test-consumer-group',
        },
      },
    });

    client = moduleFixture.get('KAFKA_TEST_CLIENT');
    await app.listen();
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  it('should send and receive place_order event', (done) => {
    const testOrder = {
      id: '123',
      customerId: 'customer-456',
      items: [{ productId: 'product-789', quantity: 2 }],
      total: 99.99,
    };

    // Listen for the response (if any)
    // For this test, we're just checking if the event is sent without error
    client.emit('place_order', testOrder).subscribe({
      next: () => {
        console.log('Event sent successfully');
        done();
      },
      error: (error) => {
        console.error('Error sending event:', error);
        done(error);
      },
    });
  });
});
