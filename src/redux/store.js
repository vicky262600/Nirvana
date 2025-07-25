// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import userReducer from './userSlice'; 
import currencyReducer from './currencySlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    user: userReducer,
    currency: currencyReducer,
  },
});

export default store;
