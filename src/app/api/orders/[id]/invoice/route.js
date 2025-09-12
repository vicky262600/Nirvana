// app/api/orders/[id]/invoice/route.js
import Stripe from "stripe";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req, { params }) {
  try {
    console.log("Invoice generation started for order:", params.id);
    
    await connectDB();
    const { id } = params;
    const { email } = await req.json();

    console.log("Request body:", { email, orderId: id });

    // Find the order
    const order = await Order.findById(id).populate('userId');
    if (!order) {
      console.log("Order not found:", id);
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    console.log("Order found:", {
      id: order._id,
      paymentId: order.paymentId,
      items: order.items.length,
      currency: order.currency
    });

    // Check if order has a Stripe payment intent
    if (!order.paymentId) {
      console.log("Order has no payment ID");
      return new Response(JSON.stringify({ error: "Order has no payment information" }), { status: 400 });
    }

    // Create or retrieve customer
    let customer;
    try {
      const customerEmail = email || order.shippingInfo.email;
      console.log("Looking for customer with email:", customerEmail);
      
      // Try to find existing customer by email
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log("Found existing customer:", customer.id);
      } else {
        console.log("Creating new customer...");
        // Create new customer
        customer = await stripe.customers.create({
          email: customerEmail,
          name: `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
          phone: order.shippingInfo.phone,
          address: {
            line1: order.shippingInfo.address,
            city: order.shippingInfo.city,
            state: order.shippingInfo.state,
            postal_code: order.shippingInfo.zipCode,
            country: order.shippingInfo.country || 'US'
          }
        });
        console.log("New customer created:", customer.id);
      }
    } catch (stripeError) {
      console.error("Stripe customer creation error:", stripeError);
      return new Response(JSON.stringify({ error: "Failed to create customer" }), { status: 500 });
    }

    // Create invoice
    let invoice;
    try {
      console.log("Creating Stripe invoice for customer:", customer.id);
      
      invoice = await stripe.invoices.create({
        customer: customer.id,
        collection_method: 'send_invoice',
        days_until_due: 30,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order._id.toString()
        }
      });
      
      console.log("Invoice created:", invoice.id);

      // Add invoice items
      console.log("Adding invoice items...");
      for (const item of order.items) {
        console.log("Adding item:", {
          title: item.title,
          price: item.price,
          quantity: item.selectedQuantity,
          currency: order.currency?.toLowerCase() || 'usd',
          unitAmountDecimal: (item.price).toFixed(2)
        });
        
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          unit_amount_decimal: (item.price).toFixed(2), // Use decimal format (e.g., "40.99")
          currency: order.currency?.toLowerCase() || 'usd',
          description: `${item.title} - Size: ${item.selectedSize}, Color: ${item.selectedColor}`,
          quantity: item.selectedQuantity
        });
      }
      console.log("All invoice items added successfully");

      // Add shipping cost if applicable
      if (order.shippingCost > 0) {
        const shippingAmount = Math.round(order.shippingCost * 100);
        console.log("Shipping cost:", order.shippingCost, "-> cents:", shippingAmount);
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          amount: shippingAmount,
          currency: order.currency?.toLowerCase() || 'usd',
          description: 'Shipping & Handling'
        });
      }

      // Add tax if applicable
      if (order.tax > 0) {
        const taxAmount = Math.round(order.tax * 100);
        console.log("Tax amount:", order.tax, "-> cents:", taxAmount);
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          amount: taxAmount,
          currency: order.currency?.toLowerCase() || 'usd',
          description: 'Tax'
        });
      }

      // Finalize and send the invoice
      console.log("Finalizing invoice...");
      await stripe.invoices.finalizeInvoice(invoice.id);
      console.log("Invoice finalized successfully");
      
      console.log("Sending invoice...");
      const sentInvoice = await stripe.invoices.sendInvoice(invoice.id);
      console.log("Invoice sent successfully:", {
        id: sentInvoice.id,
        status: sentInvoice.status,
        hosted_invoice_url: sentInvoice.hosted_invoice_url,
        invoice_pdf: sentInvoice.invoice_pdf
      });

      // Update order with invoice ID
      order.stripeInvoiceId = invoice.id;
      await order.save();

      return new Response(JSON.stringify({ 
        success: true, 
        invoiceId: invoice.id,
        hostedInvoiceUrl: sentInvoice.hosted_invoice_url,
        invoicePdfUrl: sentInvoice.invoice_pdf,
        message: "Invoice sent successfully" 
      }), { status: 200 });

    } catch (stripeError) {
      console.error("Stripe invoice creation error:", stripeError);
      return new Response(JSON.stringify({ error: "Failed to create invoice" }), { status: 500 });
    }

  } catch (error) {
    console.error("Invoice generation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}

// Get invoice details
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const order = await Order.findById(id);
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    if (!order.stripeInvoiceId) {
      return new Response(JSON.stringify({ error: "No invoice found for this order" }), { status: 404 });
    }

    // Retrieve invoice from Stripe
    const invoice = await stripe.invoices.retrieve(order.stripeInvoiceId);
    
    return new Response(JSON.stringify({ 
      invoice: {
        id: invoice.id,
        status: invoice.status,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
        created: invoice.created,
        due_date: invoice.due_date
      }
    }), { status: 200 });

  } catch (error) {
    console.error("Invoice retrieval error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
