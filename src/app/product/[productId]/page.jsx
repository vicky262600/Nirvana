'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { addItem } from '@/redux/cartSlice';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, RotateCcw, Shield } from 'lucide-react';
// import { products } from '@/data/products';

const ProductDetail = () => {
  const router = useRouter();
  const { productId } = useParams();
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        setProduct(data);
        // console.log(product);
      } catch (err) {
        console.error('Error fetching product:', err.message);
      }
    };
  
    if (productId) {
      fetchProduct();
    }
  }, [productId]);
  

  useEffect(() => {
    console.log('Current cart items:', items);
  }, [items]);

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes?.length > 1) {
      alert('Please select a size');
      return;
    }

    dispatch(
      addItem({
        product,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity,
      })
    );
  };
  console.log(product?.variants.size);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/">
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <nav className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-black">
            Shop
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-black">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <img
              src={product.images}
              alt={product.name}
              className="w-full h-96 lg:h-[600px] object-cover rounded-lg"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {product.isOnSale && product.originalPrice && (
                    <span className="text-gray-400 line-through text-lg">
                      ${product.originalPrice}
                    </span>
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      product.isOnSale ? 'text-red-600' : 'text-black'
                    }`}
                  >
                    ${product.price}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-gray-600">
                    {product.rating} (124 reviews)
                  </span>
                </div>
              </div>

              {product.isOnSale && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm font-medium">
                    🔥 Sale: Save $
                    {((product.originalPrice || 0) - product.price).toFixed(2)}!
                  </p>
                </div>
              )}
            </div>

            {/* Size Selection */}
            {product?.variants?.length > 1 && (
              <div>
                <h3 className="font-medium mb-2">Size</h3>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full bg-white border border-gray-300 rounded-md px-3 py-2">
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md">
                    {product?.variants.map((variant) => (
                      <SelectItem
                        key={variant._id}
                        value={variant.size}
                        className="hover:bg-gray-100 px-3 py-2"
                      >
                        {variant.size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color Selection */}
            {product?.variants?.length > 1 && (
              <div>
                <h3 className="font-semibold mb-2">Color</h3>
                <div className="flex gap-2">
                  {[...new Set(product.variants.map((v) => v.color))].map((color) => (
                    <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded-md ${
                      selectedColor === color
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div>
              <h3 className="font-medium mb-2">Quantity</h3>
              <Select
                value={quantity.toString()}
                onValueChange={(value) => setQuantity(parseInt(value))}
              >
                <SelectTrigger className="w-32 bg-white border border-gray-300 rounded-md px-3 py-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem
                      key={num}
                      value={num.toString()}
                      className="hover:bg-gray-100 px-3 py-2"
                    >
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add to Cart Button */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1"
                disabled={product.sizes?.length > 1 && !selectedSize}
              >
                Add to Cart
              </Button>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Free Shipping</p>
                  <p className="text-xs text-gray-600">On orders over $100</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Easy Returns</p>
                  <p className="text-xs text-gray-600">30-day return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">Secure Payment</p>
                  <p className="text-xs text-gray-600">SSL encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;