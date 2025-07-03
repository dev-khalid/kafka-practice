#!/bin/bash

# Test script for Schema Registry implementation
# This script tests the place_order endpoint and verifies schema registry functionality

API_GATEWAY_URL="http://localhost:8080"
SCHEMA_REGISTRY_URL="http://localhost:8081"

echo "🧪 Testing Schema Registry Implementation"
echo "======================================="

# Check if services are running
echo "🔍 Checking service availability..."

if ! curl -f "$API_GATEWAY_URL/api/health" > /dev/null 2>&1; then
    echo "❌ API Gateway not available at $API_GATEWAY_URL"
    exit 1
fi

if ! curl -f "$SCHEMA_REGISTRY_URL/subjects" > /dev/null 2>&1; then
    echo "❌ Schema Registry not available at $SCHEMA_REGISTRY_URL"
    exit 1
fi

echo "✅ All services are available"

# Check schema registration
echo ""
echo "🔍 Checking schema registration..."
SCHEMA_RESPONSE=$(curl -s "$SCHEMA_REGISTRY_URL/subjects/place_order-value/versions/latest")
if echo "$SCHEMA_RESPONSE" | grep -q "subject"; then
    echo "✅ place_order schema is registered"
    echo "📋 Schema ID: $(echo "$SCHEMA_RESPONSE" | jq -r '.id')"
else
    echo "⚠️  place_order schema not found, it will be registered on first message"
fi

# Test 1: Valid order with full schema
echo ""
echo "🧪 Test 1: Valid order with complete data"
echo "==========================================="

FULL_ORDER='{
  "orderId": "test-order-001",
  "customerId": "test-customer-001",
  "items": [
    {
      "productId": "laptop-001",
      "productName": "Gaming Laptop",
      "quantity": 1,
      "unitPrice": 1299.99
    },
    {
      "productId": "mouse-001", 
      "productName": "Wireless Mouse",
      "quantity": 2,
      "unitPrice": 29.99
    }
  ],
  "totalAmount": 1359.97,
  "currency": "USD",
  "shippingAddress": {
    "street": "123 Tech Street",
    "city": "Silicon Valley",
    "state": "CA", 
    "zipCode": "94000",
    "country": "US"
  },
  "paymentMethod": "CREDIT_CARD",
  "metadata": {
    "source": "web",
    "campaign": "holiday-sale"
  }
}'

echo "📤 Sending order..."
RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/api/order" \
  -H "Content-Type: application/json" \
  -d "$FULL_ORDER")

if echo "$RESPONSE" | grep -q "success"; then
    ORDER_ID=$(echo "$RESPONSE" | jq -r '.orderId')
    echo "✅ Order placed successfully: $ORDER_ID"
else
    echo "❌ Order failed: $RESPONSE"
fi

# Test 2: Minimal order (using defaults)
echo ""
echo "🧪 Test 2: Minimal order (schema defaults)"
echo "============================================"

MINIMAL_ORDER='{
  "customerId": "test-customer-002",
  "items": [
    {
      "productId": "book-001",
      "productName": "TypeScript Handbook", 
      "quantity": 1,
      "unitPrice": 39.99
    }
  ],
  "totalAmount": 39.99,
  "shippingAddress": {
    "street": "456 Book Lane",
    "city": "Reading",
    "zipCode": "12345",
    "country": "US"
  }
}'

echo "📤 Sending minimal order..."
RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/api/order" \
  -H "Content-Type: application/json" \
  -d "$MINIMAL_ORDER")

if echo "$RESPONSE" | grep -q "success"; then
    ORDER_ID=$(echo "$RESPONSE" | jq -r '.orderId')
    echo "✅ Minimal order placed successfully: $ORDER_ID"
else
    echo "❌ Minimal order failed: $RESPONSE"
fi

# Wait for processing
echo ""
echo "⏳ Waiting for message processing..."
sleep 3

# Check schema registry again
echo ""
echo "🔍 Checking schema registry after messages..."
SCHEMA_RESPONSE=$(curl -s "$SCHEMA_REGISTRY_URL/subjects/place_order-value/versions/latest")
if echo "$SCHEMA_RESPONSE" | grep -q "subject"; then
    echo "✅ Schema registered successfully"
    echo "📋 Schema ID: $(echo "$SCHEMA_RESPONSE" | jq -r '.id')"
    echo "📄 Schema version: $(echo "$SCHEMA_RESPONSE" | jq -r '.version')"
else
    echo "❌ Schema registration failed"
fi

# List all subjects
echo ""
echo "📋 All registered schemas:"
curl -s "$SCHEMA_REGISTRY_URL/subjects" | jq -r '.[]'

echo ""
echo "🎉 Schema Registry testing completed!"
echo ""
echo "💡 Tips:"
echo "   - Check Kafdrop at http://localhost:9000 for Kafka message details"
echo "   - Check Schema Registry UI at http://localhost:8081/subjects"
echo "   - Monitor microservice logs for Avro encoding/decoding messages"
