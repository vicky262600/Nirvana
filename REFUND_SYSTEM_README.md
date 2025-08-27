# Refund/Return System Documentation

## Overview
This system allows customers to request returns/refunds for their orders, which are then reviewed and processed by administrators through Stripe.

## How It Works

### 1. Customer Return Request
- Customers can click "Request Return/Refund" button on their order in the account page
- They select which items to return and specify quantities
- They provide a reason and optional description
- The request is submitted and stored in the database

### 2. Admin Review Process
- Admins can view all return requests at `/admin/returns`
- They can see customer details, order information, and return reasons
- Admins can approve or reject return requests

### 3. Stripe Refund Processing
- When approved, the system automatically calculates the refund amount
- Stripe refund is processed for the specific items and quantities
- Order and return request statuses are updated accordingly

## API Endpoints

### Customer Endpoints
- `POST /api/returns` - Create a return request
- `GET /api/returns?userId={userId}` - Get user's return requests

### Admin Endpoints
- `GET /api/admin/returns` - Get all return requests
- `PATCH /api/admin/returns` - Approve/reject return requests

## Database Models

### ReturnRequest
- `orderId` - Reference to the order
- `userId` - Reference to the customer
- `items` - Array of items to return with quantities
- `reason` - Reason for return (required)
- `description` - Additional details
- `status` - pending/approved/rejected/refunded

## Features

### Customer Features
- Select specific items to return
- Specify return quantities
- Choose from predefined return reasons
- Add custom descriptions
- View return request status
- Cannot submit multiple requests for the same order

### Admin Features
- View all return requests
- See customer and order details
- Approve requests (triggers automatic Stripe refund)
- Reject requests
- Track refund status

## Security Considerations

### Current Implementation
- Basic validation of required fields
- No authentication middleware for admin endpoints
- Direct database access for admin operations

### Recommended Improvements
- Add admin authentication middleware
- Implement role-based access control
- Add rate limiting for return requests
- Validate user ownership of orders
- Add audit logging for admin actions

## Stripe Integration

### Refund Process
1. Calculate refund amount from selected items and quantities
2. Convert amount to cents (Stripe requirement)
3. Create Stripe refund with metadata
4. Update order and return request statuses

### Requirements
- `STRIPE_SECRET_KEY` environment variable
- Valid payment intent ID in order
- Sufficient funds for refund

## Usage Instructions

### For Customers
1. Go to Account page
2. Find the order you want to return
3. Click "Request Return/Refund"
4. Select items and quantities
5. Choose reason and add description
6. Submit request

### For Admins
1. Go to `/admin/returns`
2. Review return request details
3. Click "Approve & Refund" or "Reject"
4. Monitor refund processing

## Troubleshooting

### Common Issues
- **Refund button not working**: Check if return request already exists
- **Stripe refund fails**: Verify payment intent ID and available funds
- **Admin page not loading**: Check API endpoint accessibility

### Debug Steps
1. Check browser console for errors
2. Verify API endpoint responses
3. Check Stripe dashboard for refund status
4. Review database records for status updates

## Future Enhancements

### Planned Features
- Email notifications for status updates
- Return shipping label generation
- Partial order refunds
- Return policy management
- Analytics and reporting

### Technical Improvements
- Real-time status updates
- Better error handling
- Performance optimization
- Mobile responsiveness improvements
