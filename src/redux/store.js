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
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import userReducer from './userSlice';
import currencyReducer from './currencySlice';

import storage from 'redux-persist/lib/storage'; // defaults to localStorage
import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers } from 'redux';

// Combine all reducers
const rootReducer = combineReducers({
  cart: cartReducer,
  user: userReducer,
  currency: currencyReducer,
});

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart', 'user'], // ✅ Only persist cart & user (not currency)
};

// Wrap root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // redux-persist needs this
    }),
});

export const persistor = persistStore(store);

export default store;
