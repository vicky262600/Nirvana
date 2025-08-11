// Mock payment processing API
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { amount, currency, orderId } = await req.json();
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate payment success (90% success rate for testing)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      // Simulate successful payment
      const paymentResult = {
        success: true,
        paymentId: `mock_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: currency,
        status: 'succeeded',
        orderId: orderId,
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(paymentResult, { status: 200 });
    } else {
      // Simulate payment failure
      return NextResponse.json({
        success: false,
        error: 'Payment failed - insufficient funds',
        status: 'failed'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Mock payment error:', error);
    return NextResponse.json({
      success: false,
      error: 'Payment processing error',
      status: 'error'
    }, { status: 500 });
  }
} 