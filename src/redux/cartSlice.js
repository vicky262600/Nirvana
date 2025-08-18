import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: [],
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers:{
        addItem: (state, action) => {

            if (!state.items) state.items = [];

            const { product, size, color, quantity, price } = action.payload;
          
            const existingItem = state.items.find(
              item =>
                item.productId === product._id &&
                item.selectedSize === size &&
                item.selectedColor === color
            );
          
            if (existingItem) {
              existingItem.selectedQuantity += quantity;
            } else {
              state.items.push({
                ...product,
                productId: product._id,
                selectedSize: size,
                selectedColor: color,
                selectedQuantity: quantity,
                price,
              });
            }
          },          
        removeItem:(state, action)=>{
            const { productId, size, color, quantity } = action.payload;
            state.items = state.items.filter(
                item=> !(
                    item.productId === productId && item.selectedColor === color && item.selectedSize === size && item.selectedQuantity === quantity
                )
            );
        },

        updateCartProduct: (state, action) => {
            const {
                productId,
                oldSize,
                oldColor,
                oldQuantity,
                newSize,
                newColor,
                newQuantity,
            } = action.payload;

            const itemIndex = state.items.findIndex(
                item =>
                  item.productId === productId &&
                  item.selectedSize === oldSize &&
                  item.selectedColor === oldColor &&
                  item.selectedQuantity === oldQuantity
            );

            if (itemIndex !== -1) {
                state.items[itemIndex].selectedSize = newSize;
                state.items[itemIndex].selectedColor = newColor;
                state.items[itemIndex].selectedQuantity = newQuantity;
            };
        },
        clearCart:(state)=>{
            state.items = [];
        }
    }
});

export const {
    addItem,
    removeItem,
    updateCartProduct,
    clearCart,
} = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;

export const selectCartTotal = (state) =>
    state.cart.items.reduce(
      (sum, item) => sum + item.price * item.selectedQuantity,
      0
    );
  
export default cartSlice.reducer;