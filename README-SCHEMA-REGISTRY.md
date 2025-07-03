# Schema Registry Implementation for Kafka Practice

This project now includes Confluent Schema Registry integration for the `place_order` event, providing schema evolution capabilities and ensuring data compatibility across all microservices.

## Overview

The implementation uses Avro schemas to serialize and deserialize Kafka messages, providing:

- **Schema Evolution**: Safe schema changes with backward/forward compatibility
- **Data Validation**: Automatic validation of message structure at runtime
- **Type Safety**: Strong typing for event data structures
- **Centralized Schema Management**: Single source of truth for all event schemas

## Architecture

### Components Added

1. **Schema Registry Service**: Confluent Schema Registry container
2. **Avro Schema**: Place order event schema definition
3. **Producer Integration**: API Gateway uses schema registry to encode messages
4. **Consumer Integration**: Order and Payment microservices decode messages using schema registry

### Data Flow

```
API Gateway → Schema Registry (encode) → Kafka → Schema Registry (decode) → Microservices
```

## Schema Definition

The `place_order` event schema is defined in `/schemas/place-order.avsc`:

```json
{
  "type": "record",
  "name": "PlaceOrder",
  "namespace": "com.kafkapractice.events",
  "fields": [
    {
      "name": "orderId",
      "type": "string"
    },
    {
      "name": "customerId",
      "type": "string"
    },
    {
      "name": "timestamp",
      "type": "long",
      "logicalType": "timestamp-millis"
    },
    {
      "name": "items",
      "type": {
        "type": "array",
        "items": {
          "type": "record",
          "name": "OrderItem",
          "fields": [
            { "name": "productId", "type": "string" },
            { "name": "productName", "type": "string" },
            { "name": "quantity", "type": "int" },
            { "name": "unitPrice", "type": "double" }
          ]
        }
      }
    },
    {
      "name": "totalAmount",
      "type": "double"
    },
    {
      "name": "currency",
      "type": "string",
      "default": "USD"
    },
    {
      "name": "shippingAddress",
      "type": {
        "type": "record",
        "name": "Address",
        "fields": [
          { "name": "street", "type": "string" },
          { "name": "city", "type": "string" },
          { "name": "state", "type": ["null", "string"], "default": null },
          { "name": "zipCode", "type": "string" },
          { "name": "country", "type": "string" }
        ]
      }
    },
    {
      "name": "paymentMethod",
      "type": {
        "type": "enum",
        "name": "PaymentMethod",
        "symbols": [
          "CREDIT_CARD",
          "DEBIT_CARD",
          "PAYPAL",
          "BANK_TRANSFER",
          "CASH_ON_DELIVERY"
        ]
      }
    },
    {
      "name": "metadata",
      "type": {
        "type": "map",
        "values": "string"
      },
      "default": {}
    }
  ]
}
```

## Services Modified

### API Gateway

- **SchemaRegistryService**: Manages schema registration and encoding
- **KafkaProducerService**: Custom Kafka producer with Avro encoding
- **AppService**: Updated to use typed interfaces and schema-aware producer

### Order Microservice

- **SchemaRegistryService**: Handles Avro decoding
- **KafkaConsumerService**: Custom Kafka consumer with schema registry integration
- **AppService**: Updated to handle typed PlaceOrderEvent

### Payment Microservice

- **SchemaRegistryService**: Handles Avro decoding
- **KafkaConsumerService**: Dual consumer setup for payment processing and receipt generation
- **AppService**: Updated to handle typed PlaceOrderEvent

## Running the Application

1. **Start Infrastructure**:

   ```bash
   cd api-gateway
   docker-compose up -d
   ```

   This starts:

   - Zookeeper
   - Kafka
   - Schema Registry
   - Kafdrop (Kafka UI)

2. **Install Dependencies**:

   ```bash
   # In each microservice directory
   npm install
   ```

3. **Start Microservices**:

   ```bash
   # Terminal 1 - API Gateway
   cd api-gateway && npm run start:dev

   # Terminal 2 - Order Microservice
   cd order-microservice && npm run start:dev

   # Terminal 3 - Payment Microservice
   cd payment-microservice && npm run start:dev
   ```

4. **Test the System**:
   ```bash
   curl -X POST http://localhost:8080/api/order \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "order-123",
       "customerId": "customer-456",
       "items": [
         {
           "productId": "product-789",
           "productName": "Test Product",
           "quantity": 2,
           "unitPrice": 25.50
         }
       ],
       "totalAmount": 51.00,
       "currency": "USD",
       "shippingAddress": {
         "street": "123 Test St",
         "city": "Test City",
         "state": "CA",
         "zipCode": "12345",
         "country": "US"
       },
       "paymentMethod": "CREDIT_CARD"
     }'
   ```

## Monitoring

- **Kafdrop**: http://localhost:9000 - Kafka topics and messages
- **Schema Registry**: http://localhost:8081 - Schema management
  - `/subjects` - List all subjects
  - `/subjects/place_order-value/versions` - Schema versions

## Backward Compatibility

The implementation includes fallback support for JSON messages to ensure backward compatibility during migration. Messages are checked for Avro content-type headers before attempting schema registry decoding.

## Future Enhancements

1. **Schema Evolution**: Test forward/backward compatibility with schema changes
2. **Multiple Event Types**: Add schemas for other events (payment_processed, order_shipped, etc.)
3. **Schema Validation**: Add pre-deployment schema validation
4. **Dead Letter Queues**: Handle schema incompatibility gracefully
5. **Metrics**: Add schema registry metrics and monitoring
