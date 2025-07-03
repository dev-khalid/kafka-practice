#!/bin/bash

# Script to register schemas with Confluent Schema Registry
# This script should be run after the schema registry is available

SCHEMA_REGISTRY_URL=${SCHEMA_REGISTRY_URL:-"http://localhost:8081"}
SCHEMA_FILE="../schemas/place-order.avsc"

echo "Registering schemas with Schema Registry at: $SCHEMA_REGISTRY_URL"

# Wait for schema registry to be available
echo "Waiting for Schema Registry to be available..."
while ! curl -f "$SCHEMA_REGISTRY_URL/subjects" > /dev/null 2>&1; do
    echo "Schema Registry not ready, waiting..."
    sleep 5
done

echo "Schema Registry is available. Registering schemas..."

# Register place-order schema
if [ -f "$SCHEMA_FILE" ]; then
    SCHEMA_CONTENT=$(cat "$SCHEMA_FILE" | jq -c .)
    
    curl -X POST \
        -H "Content-Type: application/vnd.schemaregistry.v1+json" \
        --data "{\"schema\":\"$SCHEMA_CONTENT\"}" \
        "$SCHEMA_REGISTRY_URL/subjects/place_order-value/versions"
    
    echo "Schema registration completed for place_order-value"
else
    echo "Schema file not found: $SCHEMA_FILE"
    exit 1
fi

echo "All schemas registered successfully!"
