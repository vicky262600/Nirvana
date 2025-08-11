# Order System Documentation

## Overview
This document explains how the complete order flow works in the Nirvana ecommerce application, including mock payment processing, inventory management, and order creation.

## System Components

### 1. Mock Payment API (`/api/payment/mock`)
- **Purpose**: Simulates payment processing without real payment gateways
- **Features**:
  - 90% success rate for testing
  - 1-second processing delay simulation
  - Generates unique payment IDs
  - Returns payment status and details

### 2. Enhanced Orders API (`/api/orders`)
- **Purpose**: Creates orders with inventory management
- **Features**:
  - Database transactions for data consistency
  - Inventory validation and updates
  - Automatic cart clearing after successful order
  - Payment status tracking

### 3. Inventory Management API (`/api/products/inventory`)
- **Purpose**: Check and manage product inventory
- **Features**:
  - Get current inventory levels
  - Update inventory quantities (admin use)
  - Variant-specific inventory tracking

## Order Flow

### Step 1: User Submits Checkout
1. User fills shipping information
2. Clicks "Complete Order" button
3. Form validation ensures all required fields are filled

### Step 2: Mock Payment Processing
1. Frontend calls `/api/payment/mock`
2. Simulates payment processing (1 second delay)
3. Returns payment result (success/failure)

### Step 3: Order Creation & Inventory Update
1. If payment successful, creates order via `/api/orders`
2. Validates inventory availability for all items
3. Updates product quantities in database
4. Creates order record with payment information
5. Clears user's cart

### Step 4: User Feedback
1. Success: Shows order confirmation with order ID
2. Error: Shows specific error message with retry options

## Database Changes

### Order Model Updates
- Added `paymentId` field
- Added `paymentStatus` field (pending, paid, failed, refunded)
- Added `status` enum (pending, confirmed, shipped, delivered, cancelled)
- Added tracking fields for future use

### Inventory Management
- Uses MongoDB transactions for data consistency
- Updates variant quantities based on order
- Rolls back changes if any step fails

## Error Handling

### Common Error Scenarios
1. **Insufficient Inventory**: Product variant out of stock
2. **Payment Failure**: Mock payment simulation fails
3. **Product Not Found**: Product removed from database
4. **Database Errors**: Connection or transaction issues

### Error Recovery
- Automatic transaction rollback on errors
- User-friendly error messages
- Retry mechanisms for failed orders
- Cart preservation on order failure

## Testing the System

### 1. Add Items to Cart
- Navigate to product pages
- Select size, color, and quantity
- Add to cart

### 2. Complete Checkout
- Fill shipping information
- Click "Complete Order"
- Watch payment processing simulation
- Verify order creation

### 3. Check Results
- Order appears in database
- Product inventory reduced
- Cart cleared
- Success/error message displayed

## Future Enhancements

### Real Payment Integration
- Replace mock payment with Stripe/PayPal
- Add webhook handling for payment confirmations
- Implement payment retry mechanisms

### Inventory Alerts
- Low stock notifications
- Out-of-stock product handling
- Inventory forecasting

### Order Management
- Admin order dashboard
- Order status updates
- Shipping tracking integration
- Email notifications

## Security Considerations

### Current Implementation
- JWT authentication required for all endpoints
- User can only access their own orders
- Admin privileges required for inventory management

### Future Improvements
- Rate limiting for order creation
- Fraud detection systems
- Payment verification
- Order validation rules

## Troubleshooting

### Common Issues
1. **Order Creation Fails**: Check database connection and user authentication
2. **Inventory Not Updated**: Verify product variants exist and have sufficient stock
3. **Cart Not Cleared**: Check Redux state and cart API endpoints
4. **Payment Simulation Fails**: Mock API has 10% failure rate for testing

### Debug Steps
1. Check browser console for error messages
2. Verify API endpoint responses
3. Check database for order and inventory records
4. Validate user authentication tokens 