import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import compareReducer from "./compareSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    compare: compareReducer,
  },
});

export default store;
