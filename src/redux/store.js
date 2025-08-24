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
import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Custom storage implementation
const createLocalStorage = () => ({
  getItem: (key) => {
    const value = localStorage.getItem(key);
    return Promise.resolve(value);
  },
  setItem: (key, value) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
});

const storage = createLocalStorage();

import cartReducer from './cartSlice';
import userReducer from './userSlice';
import currencyReducer from './currencySlice';

const cartPersistConfig = {
  key: 'cart',
  storage,
};

const userPersistConfig = {
  key: 'user',
  storage,
};

const currencyPersistConfig = {
  key: 'currency',
  storage,
};

const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedUserReducer = persistReducer(userPersistConfig, userReducer);
const persistedCurrencyReducer = persistReducer(currencyPersistConfig, currencyReducer);

export const store = configureStore({
  reducer: {
    cart: persistedCartReducer,
    user: persistedUserReducer,
    currency: persistedCurrencyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;