const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END MICROSERVICES SYSTEM VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Gateway & Catalog Check
  console.log('--- 1. Catalog & Inventory Service ---');
  const catalogRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/products',
    method: 'GET'
  });
  assert(catalogRes.status === 200, `Catalog endpoint returned 200`);
  const products = catalogRes.body?.data || catalogRes.body;
  assert(Array.isArray(products) && products.length > 0, `Catalog loaded: ${products.length} products found`);
  const firstProduct = products[0];
  console.log(`   Sample product: ID=${firstProduct?.id}, SKU=${firstProduct?.sku}, Title="${firstProduct?.title || firstProduct?.name}", Price=$${firstProduct?.price}, Stock=${firstProduct?.availableStock}`);

  // Test single product
  const singleRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/v1/products/${firstProduct.id}`,
    method: 'GET'
  });
  const singleProd = singleRes.body?.data || singleRes.body;
  assert(singleRes.status === 200 && singleProd.id === firstProduct.id, `Single product retrieval (ID ${firstProduct.id})`);

  // Test categories
  const categoriesRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/categories',
    method: 'GET'
  });
  const categories = categoriesRes.body?.data || categoriesRes.body;
  assert(categoriesRes.status === 200 && Array.isArray(categories) && categories.length > 0, `Categories loaded: ${categories.length} categories`);

  // 2. Authentication Flow: Customer Test Account
  console.log('\n--- 2. Customer Authentication Flow ---');
  let custToken = '';
  let custId = null;

  // Test registration of a fresh customer
  const timestamp = Date.now();
  const testEmail = `tester_${timestamp}@orderfleet.com`;
  const registerRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    firstName: 'Verified',
    lastName: 'Tester',
    email: testEmail,
    password: 'Password123!',
    phone: '555-0199'
  });
  
  if (registerRes.status === 200 || registerRes.status === 201) {
    const regData = registerRes.body?.data || registerRes.body;
    custToken = regData?.accessToken;
    custId = regData?.user?.id;
    assert(!!custToken, `New customer registration & token issuance (${testEmail})`);
  } else {
    // fallback login
    const loginRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'test@orderflet.com',
      password: 'Password123!'
    });
    const logData = loginRes.body?.data || loginRes.body;
    custToken = logData?.accessToken;
    custId = logData?.user?.id;
    assert(loginRes.status === 200 && !!custToken, `Customer login for test@orderflet.com`);
  }

  // 3. Delivery Address Management
  console.log('\n--- 3. Delivery Address Management ---');
  const addAddressRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/addresses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    }
  }, {
    recipientName: 'Verified Tester',
    phone: '+1 555-432-1000',
    streetLine: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704',
    isDefault: true
  });
  const newAddr = addAddressRes.body?.data || addAddressRes.body;
  const addressId = newAddr?.id;
  assert((addAddressRes.status === 200 || addAddressRes.status === 201) && !!addressId, `Address created with ID: ${addressId} (${newAddr?.streetLine})`);

  // List addresses
  const listAddressesRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/addresses',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const addrList = listAddressesRes.body?.data || listAddressesRes.body;
  assert(listAddressesRes.status === 200 && Array.isArray(addrList) && addrList.length > 0, `Address list contains ${addrList?.length} addresses`);

  // 4. Cart Operations
  console.log('\n--- 4. Shopping Cart Operations ---');
  // Add item to cart
  const addToCartRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/cart/items',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    }
  }, {
    productId: firstProduct.id,
    quantity: 1
  });
  const cartData = addToCartRes.body?.data || addToCartRes.body;
  assert(addToCartRes.status === 200 && cartData?.items?.length > 0, `Add product ${firstProduct.id} to cart (Cart total: $${cartData?.totalAmount})`);

  // Get Cart
  const getCartRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/cart',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const fetchedCart = getCartRes.body?.data || getCartRes.body;
  assert(getCartRes.status === 200 && fetchedCart?.items?.length > 0, `Fetch cart: ${fetchedCart?.items?.length} items present`);

  // 5. Order Placement (Checkout) & Kafka Event Verification
  console.log('\n--- 5. Checkout & Kafka Event Verification ---');
  const checkoutRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/orders/checkout',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    }
  }, {
    addressId: addressId,
    paymentMethod: 'CASH_ON_DELIVERY',
    simulatePaymentSuccess: true
  });
  const order = checkoutRes.body?.data || checkoutRes.body;
  assert(checkoutRes.status === 200 || checkoutRes.status === 201, `Checkout HTTP status ${checkoutRes.status}`);
  assert(order?.orderNumber && order?.status === 'CONFIRMED', `Order created successfully: #${order?.orderId} (${order?.orderNumber}), Status: ${order?.status}`);

  // Check Cart is emptied
  const emptyCartRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/cart',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const emptyCart = emptyCartRes.body?.data || emptyCartRes.body;
  assert(!emptyCart?.items || emptyCart?.items?.length === 0, `Cart auto-cleared post checkout`);

  // 6. Order Tracking & Async Delivery Dispatch (Kafka)
  console.log('\n--- 6. Live Order Tracking & Async Kafka Delivery Consumer ---');
  // Wait 1.5 seconds for Kafka event consumer in delivery-service to process order.created
  await new Promise(r => setTimeout(r, 1500));

  const getOrderRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/v1/orders/${order.orderId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const retrievedOrder = getOrderRes.body?.data || getOrderRes.body;
  assert(getOrderRes.status === 200 && retrievedOrder.orderId === order.orderId, `Get order details by ID: #${retrievedOrder.orderId}`);

  // Check customer's orders history
  const myOrdersRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/orders/my-orders',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const myOrders = myOrdersRes.body?.data || myOrdersRes.body;
  assert(myOrdersRes.status === 200 && Array.isArray(myOrders) && myOrders.length > 0, `Customer order history retrieved: ${myOrders?.length} orders found`);

  // Check delivery dispatch created by Kafka consumer
  const deliveryRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/v1/deliveries/order/${order.orderId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const delivery = deliveryRes.body?.data || deliveryRes.body;
  assert(deliveryRes.status === 200 && !!delivery?.id, `Delivery dispatched via Kafka: Delivery ID #${delivery?.id}, Status=${delivery?.status}`);

  // 7. Admin Operations & Dashboard Feeds
  console.log('\n--- 7. Admin Operations & Dashboard ---');
  const adminLoginRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@orderfleet.com',
    password: 'AdminPassword123!'
  });
  const adminData = adminLoginRes.body?.data || adminLoginRes.body;
  const adminToken = adminData?.accessToken;
  assert(adminLoginRes.status === 200 && !!adminToken, `Admin authentication verified (ROLE_ADMIN)`);

  // Admin view all orders
  const adminOrdersRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/orders/admin/all',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const allOrders = adminOrdersRes.body?.data || adminOrdersRes.body;
  assert(adminOrdersRes.status === 200 && Array.isArray(allOrders), `Admin view all platform orders: ${allOrders.length} orders total`);

  // Admin inventory check
  const invRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/v1/inventory/${firstProduct.id}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const inv = invRes.body?.data || invRes.body;
  assert(invRes.status === 200 && inv?.productId === firstProduct.id, `Inventory stock inspection for Product #${firstProduct.id} (Stock=${inv?.availableQuantity})`);

  // Admin stock patch
  const patchRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/inventory/stock',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    productId: firstProduct.id,
    quantityDelta: 5
  });
  const patchedInv = patchRes.body?.data || patchRes.body;
  assert(patchRes.status === 200 && patchedInv?.availableQuantity === (inv.availableQuantity + 5), `Admin inventory delta patch (+5 units confirmed)`);

  // Restore inventory
  await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/inventory/stock',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    productId: firstProduct.id,
    quantityDelta: -5
  });

  // 8. Frontend Server & Bundle Validation
  console.log('\n--- 8. Frontend Server & Bundle Validation ---');
  const frontendRes = await request({
    hostname: 'localhost',
    port: 4200,
    path: '/',
    method: 'GET'
  });
  assert(frontendRes.status === 200, `Frontend Angular dev server running on port 4200`);
  assert(frontendRes.raw.includes('<app-root>'), `SPA entrypoint contains <app-root>`);

  console.log('\n================================================================');
  console.log(`🏁 TEST COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
