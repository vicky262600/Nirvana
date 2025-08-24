// app/api/orders/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Cart from "@/models/Cart";
import { verifyJWT } from "@/lib/auth";
import mongoose from "mongoose"; 

export async function POST(req) {
  try {
    await connectDB();
    console.log('Database connected successfully');

    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
      decoded = verifyJWT(token);
      console.log('JWT verified for user:', decoded.id);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 403 });
    }

    const userId = decoded.id;
    const { items, total, shippingCost, shippingInfo, paymentId, currency } = await req.json();
    
    console.log('Received order data:', {
      userId,
      itemsCount: items?.length,
      total,
      paymentId,
      shippingInfo: {
        email: shippingInfo?.email,
        firstName: shippingInfo?.firstName,
        lastName: shippingInfo?.lastName,
        city: shippingInfo?.city,
        state: shippingInfo?.state
      }
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
    }
    if (!total || total <= 0) {
      return NextResponse.json({ message: "Invalid total amount" }, { status: 400 });
    }

    if (
      !shippingInfo ||
      !shippingInfo.email ||
      !shippingInfo.firstName ||
      !shippingInfo.lastName ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.state ||
      !shippingInfo.zipCode
    ) {
      return NextResponse.json({ message: "Incomplete shipping information" }, { status: 400 });
    }

    // Start a database transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log('Database transaction started');

    try {
      // Check inventory availability and update quantities
      console.log('Processing inventory updates for', items.length, 'items');
      
      for (const item of items) {
        console.log('Processing item:', {
          productId: item.productId,
          name: item.name,
          size: item.selectedSize,
          color: item.selectedColor,
          quantity: item.selectedQuantity
        });

        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          throw new Error(`Product ${item.name} not found with ID: ${item.productId}`);
        }

        console.log('Found product:', {
          productId: product._id,
          title: product.title,
          variantsCount: product.variants.length
        });

        // Find the specific variant
        const variant = product.variants.find(v => 
          v.size === item.selectedSize && v.color === item.selectedColor
        );

        if (!variant) {
          console.log('Available variants:', product.variants.map(v => ({ size: v.size, color: v.color, quantity: v.quantity })));
          throw new Error(`Variant not found for ${item.name} - Size: ${item.selectedSize}, Color: ${item.selectedColor}`);
        }

        // console.log('Found variant:', {
        //   size: variant.size,
        //   color: variant.color,
        //   currentQuantity: variant.quantity,
        //   requestedQuantity: item.selectedQuantity
        // });

        // if (variant.quantity < item.selectedQuantity) {
        //   throw new Error(`Insufficient inventory for ${item.name} - Size: ${item.selectedSize}, Color: ${item.selectedColor}. Available: ${variant.quantity}, Requested: ${item.selectedQuantity}`);
        // }

        // // Update inventory
        // const oldQuantity = variant.quantity;
        // variant.quantity -= item.selectedQuantity;
        // await product.save({ session });
        
        // console.log('Inventory updated:', {
        //   productId: product._id,
        //   size: variant.size,
        //   color: variant.color,
        //   oldQuantity,
        //   newQuantity: variant.quantity
        // });
      }

      console.log('All inventory updates completed successfully');

      // Create the order
      const orderData = {
        userId,
        items,
        total,
        currency: currency,
        shippingCost: shippingCost || 0,
        tax: tax || 0,           // Add this
        taxRate: taxRate || 0, 
        shippingInfo,
        status: "confirmed",
        paymentId: paymentId || null,
        paymentStatus: paymentId ? "paid" : "pending"
      };
      
      console.log('Creating order with data:', orderData);
      
      const newOrder = await Order.create([orderData], { session });
      console.log('Order created successfully:', newOrder[0]._id);

      // Clear the user's cart
      const cartDeleteResult = await Cart.findOneAndDelete({ userId }, { session });
      console.log('Cart cleared:', cartDeleteResult ? 'success' : 'no cart found');

      // Commit the transaction
      await session.commitTransaction();
      console.log('Database transaction committed successfully');

      return NextResponse.json({ 
        message: "Order placed successfully", 
        order: newOrder[0] 
      }, { status: 201 });

    } catch (error) {
      // Rollback the transaction on error
      console.error('Error during order processing, rolling back transaction:', error);
      await session.abortTransaction();
      console.log('Transaction rolled back');
      
      return NextResponse.json({ 
        message: "Failed to place order", 
        error: error.message 
      }, { status: 500 });
    } finally {
      session.endSession();
      console.log('Database session ended');
    }
  } catch (error) {
    console.error('Critical error in order API:', error);
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(req) {
  await connectDB();

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let decoded;
  try {
    decoded = verifyJWT(token);
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 403 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const search = url.searchParams.get("search") || "";

  // Build search filter
  let searchFilter = {};
  if (search) {
    const regex = new RegExp(search, "i"); // case-insensitive regex

    // Check if search is a valid ObjectId for _id search
    const isValidObjectId = mongoose.Types.ObjectId.isValid(search);

    // Compose $or array conditionally
    const orConditions = [
      { "shippingInfo.email": regex },
      { "shippingInfo.firstName": regex },
      { "shippingInfo.lastName": regex },
    ];

    if (isValidObjectId) {
      orConditions.push({ _id: search }); // exact match for ObjectId
    }

    searchFilter = { $or: orConditions };
  }

  if (userId) {
    if (decoded.id !== userId && !decoded.isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    try {
      const orders = await Order.find({ userId, ...searchFilter });
      return NextResponse.json({ orders });
    } catch (err) {
      return NextResponse.json({ message: "Failed to fetch orders", error: err.message }, { status: 500 });
    }
  } else {
    if (!decoded.isAdmin) {
      return NextResponse.json({ message: "Admins only" }, { status: 403 });
    }
    try {
      const orders = await Order.find(searchFilter);
      return NextResponse.json({ orders });
    } catch (err) {
      return NextResponse.json({ message: "Failed to fetch orders", error: err.message }, { status: 500 });
    }
  }
}