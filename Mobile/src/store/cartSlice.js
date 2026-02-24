import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchCart,
  addCartItem,
  removeCartItem,
  updateCartItem,
  clearCart as clearCartAPI,
} from "../service/home/api.cart";
import { fetchProductById } from "../service/home/api.product";

// ── Helpers ──────────────────────────────────────────────────────
const flattenCart = (cartData) => {
  if (!cartData?.groups) return [];
  return cartData.groups.flatMap((group) => group.items || []);
};

const enrichCartItems = async (items) => {
  const enriched = await Promise.all(
    items.map(async (item) => {
      try {
        const listing = await fetchProductById(item.listingId);
        return {
          ...item,
          title: listing.title || `Sản phẩm #${item.listingId}`,
          imageUrl:
            listing.primaryImageUrl ||
            listing.images?.[0]?.imageUrl ||
            null,
          sellerName: listing.sellerName || null,
          price: listing.price || 0,
        };
      } catch {
        return {
          ...item,
          title: `Sản phẩm #${item.listingId}`,
          imageUrl: null,
          sellerName: null,
          price: 0,
        };
      }
    })
  );
  return enriched;
};

// ── Async Thunks ─────────────────────────────────────────────────

/** Fetch cart from API and enrich with product details */
export const fetchCartThunk = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchCart();
      const items = flattenCart(data);
      const enrichedItems = await enrichCartItems(items);
      return { cart: data, items: enrichedItems };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Không thể tải giỏ hàng"
      );
    }
  }
);

/** Add item to cart (optimistic + API call + re-fetch) */
export const addToCartThunk = createAsyncThunk(
  "cart/addToCart",
  async ({ listingId, quantity = 1, product }, { dispatch, rejectWithValue }) => {
    try {
      await addCartItem(listingId, quantity);
      // Re-fetch to get real IDs and consistent state
      await dispatch(fetchCartThunk()).unwrap();
      return { success: true };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data ||
          "Thêm vào giỏ hàng thất bại"
      );
    }
  }
);

/** Remove item from cart */
export const removeFromCartThunk = createAsyncThunk(
  "cart/removeFromCart",
  async (cartItemId, { dispatch, rejectWithValue }) => {
    try {
      await removeCartItem(cartItemId);
      await dispatch(fetchCartThunk()).unwrap();
      return { success: true };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xóa sản phẩm thất bại"
      );
    }
  }
);

/** Update cart item quantity */
export const updateCartThunk = createAsyncThunk(
  "cart/updateCart",
  async ({ cartItemId, data }, { dispatch, rejectWithValue }) => {
    try {
      await updateCartItem(cartItemId, data);
      await dispatch(fetchCartThunk()).unwrap();
      return { success: true };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Cập nhật giỏ hàng thất bại"
      );
    }
  }
);

/** Clear all cart */
export const clearCartThunk = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      await clearCartAPI();
      return { success: true };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Xóa giỏ hàng thất bại"
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────

const initialState = {
  cart: null,
  items: [],
  loading: false,
  actionLoading: false, // for add/remove/update operations
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Optimistic add – add temp item to UI instantly
    optimisticAddItem: (state, action) => {
      const product = action.payload;
      const tempItem = {
        listingId: product.listingId || product.id,
        quantity: 1,
        title: product.title,
        imageUrl:
          product.primaryImageUrl || product.image || product.imageUrl,
        priceSnapshot: product.price || product.priceSnapshot,
        cartItemId: `temp-${Date.now()}`,
        sellerName: product.sellerName,
        price: product.price || 0,
      };
      state.items.push(tempItem);
    },
    // Revert optimistic add on error
    revertOptimisticAdd: (state, action) => {
      const tempId = action.payload;
      state.items = state.items.filter(
        (item) => item.cartItemId !== tempId
      );
    },
    resetCartState: () => initialState,
  },
  extraReducers: (builder) => {
    // ── fetchCart ──
    builder
      .addCase(fetchCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload.cart;
        state.items = action.payload.items;
      })
      .addCase(fetchCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.cart = null;
        state.items = [];
      });

    // ── addToCart ──
    builder
      .addCase(addToCartThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(addToCartThunk.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(addToCartThunk.rejected, (state) => {
        state.actionLoading = false;
      });

    // ── removeFromCart ──
    builder
      .addCase(removeFromCartThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(removeFromCartThunk.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(removeFromCartThunk.rejected, (state) => {
        state.actionLoading = false;
      });

    // ── updateCart ──
    builder
      .addCase(updateCartThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateCartThunk.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateCartThunk.rejected, (state) => {
        state.actionLoading = false;
      });

    // ── clearCart ──
    builder
      .addCase(clearCartThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(clearCartThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.cart = null;
        state.items = [];
      })
      .addCase(clearCartThunk.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

// ── Selectors ────────────────────────────────────────────────────

export const selectCartItems = (state) => state.cart.items;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartActionLoading = (state) => state.cart.actionLoading;
export const selectCartCount = (state) =>
  state.cart.items.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );
export const selectCartTotalPrice = (state) =>
  state.cart.items.reduce(
    (total, item) =>
      total +
      (Number(item.priceSnapshot) || Number(item.price) || 0) *
        (item.quantity || 1),
    0
  );
export const selectIsInCart = (listingId) => (state) =>
  state.cart.items.some((item) => item.listingId === listingId);

export const {
  optimisticAddItem,
  revertOptimisticAdd,
  resetCartState,
} = cartSlice.actions;

export default cartSlice.reducer;
