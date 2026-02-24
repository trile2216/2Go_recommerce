import React, { createContext, useContext, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchCartThunk,
  addToCartThunk,
  removeFromCartThunk,
  updateCartThunk,
  clearCartThunk,
  optimisticAddItem,
  revertOptimisticAdd,
  resetCartState,
  selectCartItems,
  selectCartLoading,
  selectCartCount,
} from "../store/cartSlice";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const dispatch = useDispatch();

  const cartItems = useSelector(selectCartItems);
  const loading = useSelector(selectCartLoading);
  const cartCount = useSelector(selectCartCount);

  // Fetch cart on mount if user is logged in
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        dispatch(fetchCartThunk());
      }
    };
    init();
  }, [dispatch]);

  /** Re-fetch cart data from API */
  const fetchCartData = useCallback(() => {
    return dispatch(fetchCartThunk()).unwrap();
  }, [dispatch]);

  /**
   * Add product to cart (optimistic update + API call)
   * @param {number} listingId
   * @param {number} quantity
   * @param {object} [product] - optional product for optimistic UI
   * @returns {{ success: boolean, error?: any }}
   */
  const addToCart = useCallback(
    async (listingId, quantity = 1, product = null) => {
      // Optimistic update for instant UI feedback
      let tempId = null;
      if (product) {
        tempId = `temp-${Date.now()}`;
        dispatch(
          optimisticAddItem({
            ...product,
            listingId,
            cartItemId: tempId,
          })
        );
      }

      try {
        await dispatch(
          addToCartThunk({ listingId, quantity, product })
        ).unwrap();
        return { success: true };
      } catch (error) {
        // Revert optimistic add
        if (tempId) {
          dispatch(revertOptimisticAdd(tempId));
        }
        const message =
          typeof error === "string" ? error : "Thêm vào giỏ hàng thất bại";
        return { success: false, error: { response: { data: { message } } } };
      }
    },
    [dispatch]
  );

  /**
   * Remove item from cart
   * @param {number|string} cartItemId
   */
  const removeFromCart = useCallback(
    async (cartItemId) => {
      try {
        await dispatch(removeFromCartThunk(cartItemId)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    [dispatch]
  );

  /**
   * Update cart item (quantity, etc.)
   * @param {number|string} cartItemId
   * @param {{ quantity?: number }} data
   */
  const updateCart = useCallback(
    async (cartItemId, data) => {
      try {
        await dispatch(updateCartThunk({ cartItemId, data })).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    [dispatch]
  );

  /** Clear entire cart */
  const clearCartData = useCallback(async () => {
    try {
      await dispatch(clearCartThunk()).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  /** Reset cart state (e.g. on logout) */
  const resetCart = useCallback(() => {
    dispatch(resetCartState());
  }, [dispatch]);

  /** Check if a listing is already in cart */
  const isInCart = useCallback(
    (listingId) => {
      return cartItems.some((item) => item.listingId === listingId);
    },
    [cartItems]
  );

  const value = {
    cart: null,
    cartItems,
    cartCount,
    loading,
    fetchCartData,
    addToCart,
    removeFromCart,
    updateCart,
    clearCartData,
    resetCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
};
