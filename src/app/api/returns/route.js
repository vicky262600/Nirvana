// app/api/returns/route.js
import connectDB from "@/lib/db";
import ReturnRequest from "@/models/ReturnRequest";
import User from "@/models/User";

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

    const request = new ReturnRequest({
      orderId,
      userId,
      items,
      reason,
      description: description || "",
    });

    await request.save();
    return new Response(JSON.stringify({ success: true, request }), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to create return request" }), { status: 500 });
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
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch requests" }), { status: 500 });
  }
}
