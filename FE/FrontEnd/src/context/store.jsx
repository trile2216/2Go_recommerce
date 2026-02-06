import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./UserSlice";
import favoritesReducer from "../store/slices/favoritesSlice";
import compareReducer from "../store/slices/compareSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    favorites: favoritesReducer,
    compare: compareReducer,
  },
});

export default store;
