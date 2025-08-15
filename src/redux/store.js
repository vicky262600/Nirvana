// // redux/store.js
// import { configureStore } from '@reduxjs/toolkit';
// import cartReducer from './cartSlice';
// import userReducer from './userSlice'; 
// import currencyReducer from './currencySlice'

// export const store = configureStore({
//   reducer: {
//     cart: cartReducer,
//     user: userReducer,
//     currency: currencyReducer,
//   },
// });

// export default store;
// redux/store.js
// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import cartReducer from './cartSlice';
import userReducer from './userSlice'; 
import currencyReducer from './currencySlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart'], // only persist the cart slice
};

const persistedCartReducer = persistReducer(persistConfig, cartReducer);

export const store = configureStore({
  reducer: {
    cart: persistedCartReducer,
    user: userReducer,
    currency: currencyReducer,
  },
});

export const persistor = persistStore(store);
export default store;
