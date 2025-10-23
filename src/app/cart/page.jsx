'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { Header } from "@/components/header/Header";
import { Footer } from "@/components/footer/Footer";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  removeItem,
  clearCart,
  updateCartProduct,
} from "@/redux/cartSlice";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";


const CartContent = () => {
  const dispatch = useDispatch();

  const items = useSelector(selectCartItems);
  console.log(items);
  const total = useSelector(selectCartTotal);

  const { currency, rate } = useSelector((state) => state.currency);
  
  // State to track available quantities for each item
  const [availableQuantities, setAvailableQuantities] = useState({});

  // Fetch available quantities for all items when component mounts
  useEffect(() => {
    const fetchAvailableQuantities = async () => {
      const quantities = {};
      
      for (const item of items) {
        try {
          const res = await fetch(`/api/products/${item.productId}`);
          if (res.ok) {
            const product = await res.json();
            const variant = product.variants?.find(v => 
              v.size === item.selectedSize && v.color === item.selectedColor
            );
            quantities[`${item.productId}-${item.selectedSize}-${item.selectedColor}`] = variant?.quantity || 0;
          }
        } catch (error) {
          console.error(`Error fetching availability for ${item.name}:`, error);
          quantities[`${item.productId}-${item.selectedSize}-${item.selectedColor}`] = 0;
        }
      }
      
      setAvailableQuantities(quantities);
    };

    if (items.length > 0) {
      fetchAvailableQuantities();
    }
  }, [items]);

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    
    const itemKey = `${item.productId}-${item.selectedSize}-${item.selectedColor}`;
    const availableQuantity = availableQuantities[itemKey] || 0;
    
    if (newQuantity > availableQuantity) {
      alert(`Only ${availableQuantity} items available in selected size and color.`);
      return;
    }
    
    dispatch(updateCartProduct({
      productId: item.productId,
      oldSize: item.selectedSize,
      oldColor: item.selectedColor,
      oldQuantity: item.selectedQuantity,
      newSize: item.selectedSize,
      newColor: item.selectedColor,
      newQuantity,
    }));
  };

  const handleRemoveItem = (item) => {
    dispatch(removeItem({
      productId: item.productId,
      size: item.selectedSize,
      color: item.selectedColor,
      quantity: item.selectedQuantity,
    }));
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center flex-1">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some items to get started!</p>
          <Link href="/">
            <Button size="lg">Continue Shopping</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const currencySymbols = { USD: "$", CAD: "C$" };

  
  

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart ({items.length} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                  className="bg-white border rounded-lg p-6"
                >
                  <div className="flex gap-2 sm:gap-4">
                    <Link href={`/product/${item.productId}`}>
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-gray-600">{item.category}</p>
                      {item.selectedSize && (
                        <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>
                      )}
                      {item.selectedColor && (
                        <p className="text-sm text-gray-500">Color: {item.selectedColor}</p>
                      )}
                      <div className="flex items-center gap-2 sm:gap-4 mt-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] min-w-[44px] touch-manipulation"
                            onClick={() =>
                              handleUpdateQuantity(item, item.selectedQuantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.selectedQuantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] min-w-[44px] touch-manipulation"
                            disabled={item.selectedQuantity >= (availableQuantities[`${item.productId}-${item.selectedSize}-${item.selectedColor}`] || 0)}
                            onClick={() =>
                              handleUpdateQuantity(item, item.selectedQuantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <button
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-sm font-medium bg-transparent hover:bg-red-50 active:bg-red-100 transition-colors border-none cursor-pointer touch-manipulation relative z-10"
                          onClick={() => handleRemoveItem(item)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right w-20 sm:w-24 flex-shrink-0">
                      <p className="font-bold text-sm sm:text-base">
                      {currencySymbols[currency]}{(item.price * rate * item.selectedQuantity).toFixed(2)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">{currencySymbols[currency]}{(item.price * rate).toFixed(2)} each</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <Link href="/">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              <Button variant="ghost" onClick={() => dispatch(clearCart())}>
                Clear Cart
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currencySymbols[currency]}{(total * rate).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">N/A</span>
              </div>
              <div className="flex justify-between">
                <span>GST/HST</span>
                <span>{currencySymbols[currency]}{(total * rate * 0.13).toFixed(2)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{currencySymbols[currency]}{(total * rate * 1.13).toFixed(2)}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartContent;
