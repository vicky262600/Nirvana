import { createSlice } from '@reduxjs/toolkit';
import { persistor } from './store'; // import persistor from your store.js

const initialState = {
  currentUser: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.currentUser = action.payload;
    },
    logoutUser(state) {
      state.currentUser = null;
      persistor.purge(); // ✅ clears persisted user (and cart if you want)
    },
  },
});

export const { setUser, logoutUser } = userSlice.actions;
export default userSlice.reducer;
