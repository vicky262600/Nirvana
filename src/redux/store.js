// // // redux/store.js
// // import { configureStore } from '@reduxjs/toolkit';
// // import cartReducer from './cartSlice';
// // import userReducer from './userSlice'; 
// // import currencyReducer from './currencySlice'

// // export const store = configureStore({
// //   reducer: {
// //     cart: cartReducer,
// //     user: userReducer,
// //     currency: currencyReducer,
// //   },
// // });

// // export default store;

// // redux/store.js
// import { configureStore } from '@reduxjs/toolkit';
// import cartReducer from './cartSlice';
// import userReducer from './userSlice';
// import currencyReducer from './currencySlice';

// import storage from 'redux-persist/lib/storage'; // defaults to localStorage
// import { persistReducer, persistStore } from 'redux-persist';
// import { combineReducers } from 'redux';

// // Combine all reducers
// const rootReducer = combineReducers({
//   cart: cartReducer,
//   user: userReducer,
//   currency: currencyReducer,
// });

// // Persist config
// const persistConfig = {
//   key: 'root',
//   storage,
//   whitelist: ['cart', 'user'], // ✅ Only persist cart & user (not currency)
// };

// // Wrap root reducer
// const persistedReducer = persistReducer(persistConfig, rootReducer);

// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false, // redux-persist needs this
//     }),
// });

// export const persistor = persistStore(store);

// export default store;
// import { configureStore } from '@reduxjs/toolkit';
// import {
//   persistStore,
//   persistReducer,
//   FLUSH,
//   REHYDRATE,
//   PAUSE,
//   PERSIST,
//   PURGE,
//   REGISTER,
// } from 'redux-persist';

// // Custom storage implementation
// const createLocalStorage = () => ({
//   getItem: (key) => {
//     const value = localStorage.getItem(key);
//     return Promise.resolve(value);
//   },
//   setItem: (key, value) => {
//     localStorage.setItem(key, value);
//     return Promise.resolve();
//   },
//   removeItem: (key) => {
//     localStorage.removeItem(key);
//     return Promise.resolve();
//   },
// });

// const storage = createLocalStorage();

// import cartReducer from './cartSlice';
// import userReducer from './userSlice';
// import currencyReducer from './currencySlice';

// const cartPersistConfig = {
//   key: 'cart',
//   storage,
// };

// const userPersistConfig = {
//   key: 'user',
//   storage,
// };

// const currencyPersistConfig = {
//   key: 'currency',
//   storage,
// };

// const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
// const persistedUserReducer = persistReducer(userPersistConfig, userReducer);
// const persistedCurrencyReducer = persistReducer(currencyPersistConfig, currencyReducer);

// export const store = configureStore({
//   reducer: {
//     cart: persistedCartReducer,
//     user: persistedUserReducer,
//     currency: persistedCurrencyReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
//       },
//     }),
// });

// export const persistor = persistStore(store);
// export default store;

// src/redux/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import cartReducer from "./cartSlice";
import userReducer from "./userSlice";
import currencyReducer from "./currencySlice";

// Create SSR-safe storage
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

// Create storage that works in both SSR and client
const createStorage = () => {
  if (typeof window === "undefined") {
    return createNoopStorage();
  }
  
  // Client-side: create localStorage wrapper
  return {
    getItem: (key) => {
      try {
        const item = localStorage.getItem(key);
        return Promise.resolve(item);
      } catch (error) {
        return Promise.resolve(null);
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
        return Promise.resolve(value);
      } catch (error) {
        return Promise.resolve(value);
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
        return Promise.resolve();
      } catch (error) {
        return Promise.resolve();
      }
    },
  };
};

const storage = createStorage();

// Persist config
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["cart", "user"], // Only persist cart and user, not currency
};

// Combine reducers
const rootReducer = combineReducers({
  cart: cartReducer,
  user: userReducer,
  currency: currencyReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
