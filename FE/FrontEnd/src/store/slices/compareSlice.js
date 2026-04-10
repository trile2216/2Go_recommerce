import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      const productId = product.id || product.listingId;
      const exists = state.items.find(item => item.id === productId);
      if (!exists && state.items.length < 5) {
        // Max 5 products to compare, store only id to fetch details later
        state.items.push({ id: productId });
      }
    },
    removeFromCompare: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.id !== productId);
    },
    clearCompare: (state) => {
      state.items = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
