// app/api/returns/route.js
import connectDB from "@/lib/db";
import ReturnRequest from "@/models/ReturnRequest";
import User from "@/models/User";
import Order from "@/models/Order";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Customer creates a return request
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderId, userId, items, reason, description } = body;

    // Validate required fields
    if (!orderId || !userId || !items || !reason) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Items array is required and cannot be empty" }), { status: 400 });
    }

    // Check if any of the requested items have already been returned
    const existingRequests = await ReturnRequest.find({ orderId });
    
    // Create a set of already returned items (productId + size + color combination)
    const alreadyReturnedItems = new Set();
    existingRequests.forEach(request => {
      request.items.forEach(item => {
        const itemKey = `${item.productId}-${item.selectedSize}-${item.selectedColor}`;
        alreadyReturnedItems.add(itemKey);
      });
    });

    // Check if any requested items are already being returned
    const duplicateItems = [];
    items.forEach(item => {
      const itemKey = `${item.productId}-${item.selectedSize}-${item.selectedColor}`;
      if (alreadyReturnedItems.has(itemKey)) {
        duplicateItems.push(item.title);
      }
    });

    if (duplicateItems.length > 0) {
      return new Response(JSON.stringify({ 
        error: "Some items have already been requested for return",
        duplicateItems: duplicateItems
      }), { status: 400 });
    }

    // Get the order details for shipping information
    const order = await Order.findById(orderId);
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    // Map the return items to use actual order prices instead of product database prices
    const orderItems = order.items;
    const returnItemsWithActualPrices = items.map(returnItem => {
      // Find the corresponding order item
      const orderItem = orderItems.find(oi => 
        oi.productId.toString() === returnItem.productId &&
        oi.selectedSize === returnItem.selectedSize &&
        oi.selectedColor === returnItem.selectedColor
      );
      
      return {
        ...returnItem,
        price: orderItem ? orderItem.price : returnItem.price // Use actual order price, fallback to product price
      };
    });

    const request = new ReturnRequest({
      orderId,
      userId,
      items: returnItemsWithActualPrices,
      reason,
      description: description || "",
    });

    await request.save();

    // Create Stallion return shipment
    let stallionSuccess = false;
    let stallionError = null;
    
    try {
      const shipmentPayload = {
        to_address: {
          name: `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
          address1: order.shippingInfo.address,
          city: order.shippingInfo.city,
          province_code: order.shippingInfo.state,
          postal_code: order.shippingInfo.zipCode,
          country_code: order.shippingInfo.country || "US",
          phone: "1234567890", // You might want to add phone to shipping info
          email: order.shippingInfo.email,
          is_residential: true,
        },
        return_address: {
          name: "Vikas Joshi",
          address1: "7268 9TH LINE",
          city: "BEETON",
          province_code: "ON",
          postal_code: "L0G 1A0",
          country_code: "CA",
          phone: "2268864692",
          email: "vikasjoshi2604@gmail.com",
          is_residential: true,
        },
        is_return: true, // This is the key change for return shipments
        weight_unit: "lbs",
        weight: 2, // TODO: calculate from return items if needed
        length: 30,
        width: 20,
        height: 5,
        size_unit: "cm",
        items: items.map((item) => ({
          description: item.title,
          sku: item.productId,
          quantity: item.returnQuantity,
          value: item.price,
          currency: order.currency || "CAD",
          country_of_origin: "CA",
          hs_code: "123456",
          manufacturer_name: "Your Company",
          manufacturer_address1: "123 Manufacturing Blvd",
          manufacturer_city: "Toronto",
          manufacturer_province_code: "ON",
          manufacturer_postal_code: "M5V 2H1",
          manufacturer_country_code: "CA",
        })),
        package_type: "Parcel",
        signature_confirmation: false,
        postage_type: order.postageType || "Cheapest Tracked",
        label_format: "pdf",
        is_fba: false,
        is_draft: true,
        insured: true,
        tax_identifier: {
          tax_type: "IOSS",
          number: "IM1234567890",
          issuing_authority: "CA"
        },
      };

      const idempotencyKey = `return-${orderId}-${uuidv4()}`;

      // Call Stallion API for return shipment
      const stallionRes = await axios.post(
        "https://ship.stallionexpress.ca/api/v4/shipments",
        shipmentPayload,
        {
          headers: {
            Authorization: `Bearer ${process.env.STALLION_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      console.log("Stallion return shipment response status:", stallionRes.status);
      console.log("Stallion return shipment response data:", JSON.stringify(stallionRes.data, null, 2));
      console.log("Stallion return shipment response headers:", stallionRes.headers);

      const returnTrackingNumber = stallionRes.data.shipment?.tracking_code || null;
      console.log("Stallion return tracking number:", returnTrackingNumber);

      // Update the return request with the tracking number
      if (returnTrackingNumber) {
        request.returnTrackingNumber = returnTrackingNumber;
        await request.save();
      }

      stallionSuccess = true;

    } catch (error) {
      stallionError = error;
      console.error("Stallion return shipment creation failed:", error.response?.data || error.message);
    }

    // Only proceed if Stallion API call was successful
    if (!stallionSuccess) {
      // Delete the return request since Stallion failed
      await ReturnRequest.findByIdAndDelete(request._id);
      
      console.error('Stallion API call failed:', stallionError);
      console.error('Stallion error details:', {
        status: stallionError?.response?.status,
        statusText: stallionError?.response?.statusText,
        data: stallionError?.response?.data,
        message: stallionError?.message
      });
      
      const errorMessage = stallionError?.response?.data?.message || 
                          stallionError?.response?.data?.error || 
                          stallionError?.message || 
                          "Failed to create return shipment";
      
      return new Response(JSON.stringify({ 
        error: "Return request failed", 
        details: errorMessage,
        stallionError: stallionError?.response?.data || stallionError?.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, request }), { status: 201 });
  } catch (err) {
    console.error('Return request creation error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    const errorMessage = err.message || "Failed to create return request";
    return new Response(JSON.stringify({ 
      error: "Failed to create return request",
      details: errorMessage 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Admin fetches all return requests
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = {};
    if (userId) {
      query.userId = userId;
    }

    const requests = await ReturnRequest.find(query).populate("orderId userId");
    return new Response(JSON.stringify({ requests }), { status: 200 });
  } catch (err) {
    console.error('Error fetching return requests:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    const errorMessage = err.message || "Failed to fetch requests";
    return new Response(JSON.stringify({ 
      error: "Failed to fetch requests",
      details: errorMessage 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
