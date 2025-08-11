// Test script to debug order system
// Run this in your browser console or as a Node.js script

const testOrderData = {
  items: [
    {
      productId: "test_product_id",
      name: "Test Product",
      image: "test-image.jpg",
      price: 29.99,
      selectedSize: "M",
      selectedColor: "Blue",
      selectedQuantity: 1
    }
  ],
  total: 29.99,
  shippingCost: 5.99,
  shippingInfo: {
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    address: "123 Test St",
    city: "Test City",
    state: "ON",
    zipCode: "M5V 2H1",
    country: "CA"
  },
  paymentId: "test_payment_123"
};

console.log('Test Order Data:', testOrderData);

// Test the mock payment API
async function testMockPayment() {
  try {
    const response = await fetch('/api/payment/mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 35.98,
        currency: 'CAD',
        orderId: 'test_order_123'
      })
    });
    
    const result = await response.json();
    console.log('Mock Payment Result:', result);
    return result;
  } catch (error) {
    console.error('Mock Payment Error:', error);
    return null;
  }
}

// Test the orders API (requires authentication)
async function testOrdersAPI() {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrderData)
    });
    
    const result = await response.json();
    console.log('Orders API Result:', result);
    return result;
  } catch (error) {
    console.error('Orders API Error:', error);
    return null;
  }
}

// Test inventory API
async function testInventoryAPI() {
  try {
    const response = await fetch('/api/products/inventory?productIds=test_product_id');
    const result = await response.json();
    console.log('Inventory API Result:', result);
    return result;
  } catch (error) {
    console.error('Inventory API Error:', error);
    return null;
  }
}

// Run tests
console.log('Running tests...');
console.log('1. Testing Mock Payment API...');
testMockPayment().then(() => {
  console.log('2. Testing Inventory API...');
  return testInventoryAPI();
}).then(() => {
  console.log('3. Testing Orders API (requires auth)...');
  return testOrdersAPI();
}).catch(error => {
  console.error('Test sequence failed:', error);
});

console.log('Tests initiated. Check console for results.'); 