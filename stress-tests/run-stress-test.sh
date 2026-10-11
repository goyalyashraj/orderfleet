#!/bin/bash
set -e

echo "================================================================================"
echo "      ORDERFLEET DISTRIBUTED FLASH SALE STRESS TEST & OVERSELLING AUDIT        "
echo "================================================================================"

GATEWAY_URL="http://localhost:8080"
PRODUCT_ID=12

# Step 1: Obtain Customer JWT Token
echo "[1/4] Authenticating test user to obtain JWT claims..."
LOGIN_RESP=$(curl -s -X POST "${GATEWAY_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"stress_tester@orderfleet.com","password":"Password123!"}')

AUTH_TOKEN=$(echo "$LOGIN_RESP" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
  echo "Error: Failed to obtain JWT token. Response: $LOGIN_RESP"
  exit 1
fi
echo "JWT Token acquired successfully."

# Step 2: Initialize Flash Sale Stock in MySQL to strictly 10 units
echo "[2/4] Initializing Product #${PRODUCT_ID} inventory: Available=10, Reserved=0..."
mysql -u app_user -papp_password -e "USE catalog_db; UPDATE inventory_items SET available_quantity = 10, reserved_quantity = 0 WHERE product_id = ${PRODUCT_ID}; DELETE FROM inventory_reservations WHERE product_id = ${PRODUCT_ID};"

INITIAL_STOCK=$(mysql -u app_user -papp_password -N -e "USE catalog_db; SELECT available_quantity FROM inventory_items WHERE product_id = ${PRODUCT_ID};")
echo "Initial Available Stock verified in MySQL: ${INITIAL_STOCK} units"

# Step 3: Run k6 High-Concurrency Stress Test (50 VUs, 100 requests)
echo "[3/4] Launching k6 Flash Sale Simulation (50 VUs, 100 burst concurrent requests)..."
docker run --rm -i \
  --add-host=host.docker.internal:host-gateway \
  -e GATEWAY_URL="http://host.docker.internal:8080" \
  -e PRODUCT_ID="${PRODUCT_ID}" \
  -e AUTH_TOKEN="${AUTH_TOKEN}" \
  grafana/k6 run - < /Users/yashraj/Desktop/project/stress-tests/flash-sale-overselling.js

# Step 4: Post-Test MySQL Database Audit
echo "[4/4] Auditing MySQL Database for Overselling and Invariants..."
FINAL_ROW=$(mysql -u app_user -papp_password -e "USE catalog_db; SELECT product_id, available_quantity, reserved_quantity, version FROM inventory_items WHERE product_id = ${PRODUCT_ID};")
RESERVATION_COUNT=$(mysql -u app_user -papp_password -N -e "USE catalog_db; SELECT COUNT(*) FROM inventory_reservations WHERE product_id = ${PRODUCT_ID} AND status = 'RESERVED';")

echo ""
echo "================================================================================"
echo "                          DATABASE AUDIT RESULTS                               "
echo "================================================================================"
echo "$FINAL_ROW"
echo "Total Active Reservations in Database: ${RESERVATION_COUNT}"
echo ""

FINAL_AVAILABLE=$(mysql -u app_user -papp_password -N -e "USE catalog_db; SELECT available_quantity FROM inventory_items WHERE product_id = ${PRODUCT_ID};")
FINAL_RESERVED=$(mysql -u app_user -papp_password -N -e "USE catalog_db; SELECT reserved_quantity FROM inventory_items WHERE product_id = ${PRODUCT_ID};")

if [ "$FINAL_AVAILABLE" -eq 0 ] && [ "$FINAL_RESERVED" -eq 10 ] && [ "$RESERVATION_COUNT" -eq 10 ]; then
  echo ">>> AUDIT PASSED: ZERO OVERSELLING DETECTED! <<<"
  echo "Pessimistic row locking successfully serialized all 100 concurrent requests."
  echo "Available stock stopped precisely at 0. Exactly 10 units were reserved."
else
  echo ">>> AUDIT FAILED: Overselling or stock inconsistency detected! <<<"
  exit 1
fi
echo "================================================================================"
