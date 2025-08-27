// app/api/returns/[id]/route.js
import Stripe from "stripe";
import connectDB from "@/lib/db";
import ReturnRequest from "@/models/ReturnRequest";
import Order from "@/models/Order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const { action, refundPercentage, refundReason } = await req.json(); // "approve" or "reject" + optional refund details

    const request = await ReturnRequest.findById(id).populate("orderId");
    if (!request) return new Response("Request not found", { status: 404 });

    if (action === "approve") {
      const order = await Order.findById(request.orderId);
      if (!order) return new Response("Order not found", { status: 404 });

      if (!order.paymentId) {
        return new Response("No payment ID found for this order", { status: 400 });
      }

      // Calculate refund total for the requested items
      const fullRefundAmount = request.items.reduce((sum, item) => {
        return sum + (item.price * item.returnQuantity);
      }, 0);

      // Apply refund percentage (default to 100% if not specified)
      const actualRefundPercentage = refundPercentage || 100;
      const refundAmount = (fullRefundAmount * actualRefundPercentage) / 100;

      // Convert to cents for Stripe
      const refundAmountCents = Math.round(refundAmount * 100);

      if (refundAmountCents <= 0) {
        return new Response("Invalid refund amount", { status: 400 });
      }

      // Issue Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentId,
        amount: refundAmountCents,
        metadata: {
          return_request_id: id,
          order_id: order._id.toString(),
          reason: request.reason,
          refund_percentage: actualRefundPercentage.toString(),
          admin_reason: refundReason || ""
        }
      });

      // Update request with refund details
      request.status = "refunded";
      request.refundPercentage = actualRefundPercentage;
      request.refundAmount = refundAmount;
      request.refundReason = refundReason || "";
      
      // Update order status (only mark as refunded if it's a full refund)
      if (actualRefundPercentage === 100) {
        order.paymentStatus = "refunded";
      } else {
        order.paymentStatus = "partially_refunded";
      }
      
      await request.save();
      await order.save();

      return new Response(JSON.stringify({ 
        success: true, 
        refund,
        refundAmount: refundAmount,
        refundAmountCents: refundAmountCents,
        refundPercentage: actualRefundPercentage,
        fullRefundAmount: fullRefundAmount
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
