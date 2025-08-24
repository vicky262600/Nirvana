// redux/storage.js
import storage from 'redux-persist/lib/storage';

export const createNoopStorage = () => ({
  getItem(_key) {
    return Promise.resolve(null);
  },
  setItem(_key, value) {
    return Promise.resolve(value);
  },
  removeItem(_key) {
    return Promise.resolve();
  },
});

export const persistStorage =
  typeof window !== 'undefined' ? storage : createNoopStorage();
