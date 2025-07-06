// 'use client'

// import { createContext, useContext, useState } from "react";

// const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//   const [items, setItems] = useState([]);

//   const addItem = (product, size, color) => {
//     setItems((prev) => {
//       const existingItem = prev.find(
//         (item) =>
//           item.id === product.id &&
//           item.selectedSize === size &&
//           item.selectedColor === color
//       );
//       if (existingItem) {
//         console.log(`Item updated: ${product.name} quantity updated in cart`);
//         return prev.map((item) =>
//           item.id === product.id &&
//           item.selectedSize === size &&
//           item.selectedColor === color
//             ? { ...item, quantity: item.quantity + 1 }
//             : item
//         );
//       } else {
//         console.log(`Added to cart: ${product.name} has been added to your cart`);
//         return [
//           ...prev,
//           { ...product, quantity: 1, selectedSize: size, selectedColor: color },
//         ];
//       }
//     });
//   };

//   const removeItem = (productId, size, color) => {
//     setItems((prev) =>
//       prev.filter(
//         (item) =>
//           !(
//             item.id === productId &&
//             item.selectedSize === size &&
//             item.selectedColor === color
//           )
//       )
//     );
//     console.log("Removed from cart: Item has been removed from your cart");
//   };

//   const updateQuantity = (productId, quantity, size, color) => {
//     if (quantity <= 0) {
//       removeItem(productId, size, color);
//       return;
//     }
//     setItems((prev) =>
//       prev.map((item) =>
//         item.id === productId &&
//         item.selectedSize === size &&
//         item.selectedColor === color
//           ? { ...item, quantity }
//           : item
//       )
//     );
//   };

//   const clearCart = () => {
//     setItems([]);
//     console.log("Cart cleared: All items have been removed from your cart");
//   };

//   const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

//   return (
//     <CartContext.Provider
//       value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export const useCart = () => {
//   const context = useContext(CartContext);
//   if (!context) {
//     throw new Error("useCart must be used within a CartProvider");
//   }
//   return context;
// };
