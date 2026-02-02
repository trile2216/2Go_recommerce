import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer from './slices/favoritesSlice';
import compareReducer from './slices/compareSlice';

export const store = configureStore({
  reducer: {
    favorites: favoritesReducer,
    compare: compareReducer,
  },
});

export default store;
