// import { NextResponse } from "next/server";
// import connectDB from "@/lib/db";
// import Product from "@/models/Product";
// import { verifyJWT } from "@/lib/auth";


// export async function GET(req, { params }) {
//     await connectDB();
//     const id = params.id;
  
//   try {
//     const product = await Product.findById(id);
//     if (!product) {
//       return NextResponse.json({ message: "Product not found" }, { status: 404 });
//     }
//     return NextResponse.json(product);
//   } catch (error) {
//     return NextResponse.json(
//       { message: "Invalid product ID", error: error.message },
//       { status: 400 }
//     );
//   }
// }

// // Update product (only admin)
// export async function PUT(req, context) {
//     await connectDB();
//     const { id } = context.params;
  
//     const token = req.cookies.get("token")?.value;
//     if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
//     try {
//       const decoded = verifyJWT(token);
//       if (!decoded.isAdmin) {
//         return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
//       }
  
//       const data = await req.json();
//       const updatedProduct = await Product.findByIdAndUpdate(id, data, {
//         new: true,
//         runValidators: true,
//       });
  
//       return NextResponse.json({ message: "Product updated", product: updatedProduct });
//     } catch (error) {
//       return NextResponse.json({ message: "Error updating", error: error.message }, { status: 500 });
//     }
//   }
  
//   // DELETE - Remove product (admin only)
//   export async function DELETE(req, context) {
//     await connectDB();
//     const { id } = context.params;
  
//     const token = req.cookies.get("token")?.value;
//     if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
//     try {
//       const decoded = verifyJWT(token);
//       if (!decoded.isAdmin) {
//         return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
//       }
  
//       await Product.findByIdAndDelete(id);
//       return NextResponse.json({ message: "Product deleted" });
//     } catch (error) {
//       return NextResponse.json({ message: "Error deleting", error: error.message }, { status: 500 });
//     }
//   }
  

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { verifyJWT } from "@/lib/auth";
import { setCorsHeaders } from "@/lib/cors"; // your cors header setter
import { bucket } from "@/lib/firebaseAdmin";


// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(req) {
  const res = new NextResponse(null, { status: 204 }); // no content, no body
  setCorsHeaders(res);
  return res;
}

export async function GET(req, { params }) {
  await connectDB();
  const id = params.id;

  try {
    const product = await Product.findById(id);
    if (!product) {
      const res = NextResponse.json({ message: "Product not found" }, { status: 404 });
      setCorsHeaders(res);
      return res;
    }
    const res = NextResponse.json(product);
    setCorsHeaders(res);
    return res;
  } catch (error) {
    const res = NextResponse.json(
      { message: "Invalid product ID", error: error.message },
      { status: 400 }
    );
    setCorsHeaders(res);
    return res;
  }
}

// Update product (only admin)
export async function PUT(req, context) {
  await connectDB();
  const { id } = context.params;

  const token = req.cookies.get("token")?.value;
  if (!token) {
    const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    setCorsHeaders(res);
    return res;
  }

  try {
    const decoded = verifyJWT(token);
    if (!decoded.isAdmin) {
      const res = NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
      setCorsHeaders(res);
      return res;
    }

    const data = await req.json();

    // Fetch old product
    const oldProduct = await Product.findById(id);
    if (!oldProduct) {
      const res = NextResponse.json({ message: "Product not found" }, { status: 404 });
      setCorsHeaders(res);
      return res;
    }

    // Determine which images were removed
    const oldImages = oldProduct.images || [];
    const newImages = data.images || [];

    // Images removed = oldImages not in newImages
    const removedImages = oldImages.filter(oldImg => !newImages.includes(oldImg));

    // Delete removed images from Firebase Storage
    const deletePromises = removedImages.map(async (url) => {
      // Extract file path from URL — adapt your regex if needed
      const pathMatch = url.match(/%2F(.+)\?/);
      const path = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
      if (path) {
        try {
          await bucket.file(`products/${path}`).delete();
          console.log(`Deleted image from storage: ${path}`);
        } catch (err) {
          console.error(`Failed to delete image: ${path}`, err.message);
        }
      }
    });
    await Promise.all(deletePromises);

    // Now update the product with new data
    const updatedProduct = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    const res = NextResponse.json({ message: "Product updated", product: updatedProduct });
    setCorsHeaders(res);
    return res;

  } catch (error) {
    const res = NextResponse.json({ message: "Error updating", error: error.message }, { status: 500 });
    setCorsHeaders(res);
    return res;
  }
}


// // DELETE - Remove product (admin only)
// export async function DELETE(req, context) {
//   await connectDB();
//   const { id } = context.params;

//   const token = req.cookies.get("token")?.value;
//   if (!token) {
//     const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     setCorsHeaders(res);
//     return res;
//   }

//   try {
//     const decoded = verifyJWT(token);
//     if (!decoded.isAdmin) {
//       const res = NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
//       setCorsHeaders(res);
//       return res;
//     }

//     await Product.findByIdAndDelete(id);

//     const res = NextResponse.json({ message: "Product deleted" });
//     setCorsHeaders(res);
//     return res;
//   } catch (error) {
//     const res = NextResponse.json({ message: "Error deleting", error: error.message }, { status: 500 });
//     setCorsHeaders(res);
//     return res;
//   }
// }

// DELETE /api/products/:id

export async function DELETE(req, { params }) {
  await connectDB();
  const { id } = params;

  const token = req.cookies.get("token")?.value;
  if (!token) {
    const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    setCorsHeaders(res);
    return res;
  }

  try {
    const decoded = verifyJWT(token);
    if (!decoded.isAdmin) {
      const res = NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
      setCorsHeaders(res);
      return res;
    }

    const product = await Product.findById(id);
    if (!product) {
      const res = NextResponse.json({ message: "Product not found" }, { status: 404 });
      setCorsHeaders(res);
      return res;
    }

    // Delete Firebase images
    const imagePaths = product.images || [];
    const deletePromises = imagePaths.map(async (url) => {
      const pathMatch = url.match(/%2F(.+)\?/); // Extracts after %2F and before ?
      const path = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
      if (path) {
        try {
          await bucket.file(`products/${path}`).delete();
        } catch (err) {
          console.error(`Failed to delete image: ${path}`, err.message);
        }
      }
    });
    await Promise.all(deletePromises);

    // Delete product
    await Product.findByIdAndDelete(id);

    const res = NextResponse.json({ message: "Product and images deleted" }, { status: 200 });
    setCorsHeaders(res);
    return res;
  } catch (err) {
    console.error("Error deleting product:", err.message);
    const res = NextResponse.json({ message: "Server error" }, { status: 500 });
    setCorsHeaders(res);
    return res;
  }
}

