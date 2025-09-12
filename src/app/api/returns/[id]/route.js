// app/api/returns/[id]/route.js
import Stripe from "stripe";
import connectDB from "@/lib/db";
import ReturnRequest from "@/models/ReturnRequest";
import Order from "@/models/Order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { action, refundPercentage, refundReason } = await req.json(); // "approve" or "reject" + optional refund details

    const request = await ReturnRequest.findById(id).populate("orderId");
    if (!request) return new Response("Request not found", { status: 404 });

    if (action === "approve") {
      const order = await Order.findById(request.orderId);
      if (!order) return new Response("Order not found", { status: 404 });

      if (!order.paymentId) {
        return new Response("No payment ID found for this order", { status: 400 });
      }

      // Get the actual payment intent from Stripe to get the correct currency and amounts
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(order.paymentId);
        console.log('Payment Intent retrieved:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        });
      } catch (error) {
        console.error('Error retrieving payment intent:', error);
        return new Response(JSON.stringify({ 
          error: "Failed to retrieve payment information" 
        }), { status: 500 });
      }

      // Calculate refund based on product cost + proportional tax only (NOT shipping)
      const returnedItemsAmount = request.items.reduce((sum, item) => {
        return sum + (item.price * item.returnQuantity);
      }, 0);
      
      // Calculate product subtotal (products only, no shipping, no tax)
      const productSubtotal = order.total - order.shippingCost - order.tax;
      
      // Calculate the proportion of returned items to product subtotal
      const returnProportion = returnedItemsAmount / productSubtotal;
      
      // Calculate tax on returned items
      const returnedItemsTax = (order.tax * returnProportion);
      
      // Total refund = returned items + proportional tax
      const refundAmount = returnedItemsAmount + returnedItemsTax;
      
      // Convert to cents for Stripe (using the payment intent's currency)
      const refundAmountCents = Math.round(refundAmount * 100);
      
      // Check existing refunds to see how much is left to refund
      let existingRefunds = [];
      try {
        existingRefunds = await stripe.refunds.list({
          payment_intent: order.paymentId,
          limit: 100
        });
        console.log('Existing refunds:', existingRefunds.data.map(r => ({
          id: r.id,
          amount: r.amount,
          status: r.status
        })));
      } catch (error) {
        console.error('Error fetching existing refunds:', error);
      }

      // Calculate total already refunded
      const totalRefunded = existingRefunds.data
        .filter(refund => refund.status === 'succeeded')
        .reduce((sum, refund) => sum + refund.amount, 0);
      
      // Calculate remaining refundable amount
      const remainingRefundable = paymentIntent.amount - totalRefunded;
      const remainingRefundableAmount = remainingRefundable / 100;
      
      console.log('Refund calculation:', {
        items: request.items,
        orderTotal: order.total,
        orderShippingCost: order.shippingCost,
        orderTax: order.tax,
        productSubtotal: productSubtotal,
        returnedItemsAmount,
        returnProportion,
        returnedItemsTax,
        refundAmount,
        refundAmountCents,
        refundPercentage: refundPercentage || 100,
        totalRefunded,
        remainingRefundable,
        remainingRefundableAmount
      });

      if (refundAmountCents <= 0) {
        return new Response(JSON.stringify({ error: "Invalid refund amount" }), { status: 400 });
      }

      // Check if we're trying to refund more than what's available
      if (refundAmountCents > remainingRefundable) {
        return new Response(JSON.stringify({ 
          error: "Refund amount exceeds remaining refundable amount",
          requestedRefund: refundAmount,
          remainingRefundable: remainingRefundableAmount,
          totalRefunded: totalRefunded / 100
        }), { status: 400 });
      }

      // Ensure we're not refunding more than the calculated amount
      const finalRefundAmountCents = Math.min(refundAmountCents, remainingRefundable);
      console.log('Final refund amount:', {
        calculated: refundAmountCents,
        remaining: remainingRefundable,
        final: finalRefundAmountCents
      });

      // Check if already refunded
      let refund;
      let refundSuccessful = false;
      console.log('Creating refund with payment intent:', order.paymentId);
      console.log('Refund amount in cents:', refundAmountCents);
      console.log('Order currency:', order.currency);
      
      try {
        refund = await stripe.refunds.create({
          payment_intent: order.paymentId,
          amount: finalRefundAmountCents,
          metadata: {
            return_request_id: id,
            order_id: order._id.toString(),
            reason: request.reason,
            refund_percentage: (refundPercentage || 100).toString(),
            admin_reason: refundReason || ""
          }
        });
        console.log('Refund created successfully:', refund.id);
        refundSuccessful = true;
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        if (stripeError.code === 'charge_already_refunded') {
          // If already refunded, just update the status without creating new refund
          console.log('Charge already refunded, updating status only');
          refund = { id: 'already_refunded', amount: refundAmountCents };
          refundSuccessful = true; // Consider this successful since refund already exists
        } else {
          // For any other error, don't update the database
          console.error('Refund failed, not updating database');
          refundSuccessful = false; // Explicitly set to false
          return new Response(JSON.stringify({ 
            error: "Failed to create refund", 
            details: stripeError.message 
          }), { status: 500 });
        }
      }

      // Only update database if refund was successful
      if (refundSuccessful) {
        // Update request with refund details
        request.status = "refunded";
        request.refundPercentage = refundPercentage || 100;
        request.refundAmount = refundAmount;
        request.refundReason = refundReason || "";
        
        // Update order payment status (only mark as refunded if it's a full refund)
        if ((refundPercentage || 100) === 100) {
          order.paymentStatus = "refunded";
        } else {
          order.paymentStatus = "refunded"; // Stripe doesn't have partially_refunded, so we use refunded
        }
        
        await request.save();
        await order.save();
        console.log('Database updated successfully after refund');
      } else {
        // Refund was not successful, don't update database
        console.log('Refund was not successful, database NOT updated');
        return new Response(JSON.stringify({ 
          error: "Refund failed", 
          details: "Database was not updated due to refund failure"
        }), { status: 500 });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        refund,
        refundAmount: refundAmount,
        refundAmountCents: refundAmountCents,
        refundPercentage: refundPercentage || 100,
        returnedItemsAmount: returnedItemsAmount,
        productSubtotal: productSubtotal,
        returnProportion: returnProportion,
        returnedItemsTax: returnedItemsTax,
        paymentIntentCurrency: paymentIntent.currency,
        orderCurrency: order.currency
      }), { status: 200 });
    } else if (action === "reject") {
      request.status = "rejected";
      await request.save();
      return new Response(JSON.stringify({ success: true, request }), { status: 200 });
    } else {
      return new Response("Invalid action", { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to update return request" }), { status: 500 });
  }
}
