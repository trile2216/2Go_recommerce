import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchCart, addCartItem, removeCartItem, updateCartItem, clearCart as clearCartAPI } from "../service/home/api.cart";
import { fetchProductById } from "../service/home/api.product";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

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
            title: listing.title || `Product #${item.listingId}`,
            imageUrl: listing.primaryImageUrl || listing.images?.[0]?.imageUrl || null,
            sellerName: listing.sellerName || null,
            price: listing.price || 0,
          };
        } catch {
          return {
            ...item,
            title: `Product #${item.listingId}`,
            imageUrl: null,
            sellerName: null,
            price: 0,
          };
        }
      })
    );
    return enriched;
  };

  const fetchCartData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCart();
      setCart(data);
      const items = flattenCart(data);
      const enrichedItems = await enrichCartItems(items);
      setCartItems(enrichedItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart(null);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (listingId, quantity = 1) => {
    try {
      await addCartItem(listingId, quantity);
      await fetchCartData();
      return { success: true };
    } catch (error) {
      console.error("Error adding to cart:", error);
      return { success: false, error };
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await removeCartItem(cartItemId);
      await fetchCartData();
      return { success: true };
    } catch (error) {
      console.error("Error removing from cart:", error);
      return { success: false, error };
    }
  };

  const updateCart = async (cartItemId, data) => {
    try {
      await updateCartItem(cartItemId, data);
      await fetchCartData();
      return { success: true };
    } catch (error) {
      console.error("Error updating cart:", error);
      return { success: false, error };
    }
  };

  const clearCartData = async () => {
    try {
      await clearCartAPI();
      setCart(null);
      setCartItems([]);
      return { success: true };
    } catch (error) {
      console.error("Error clearing cart:", error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    setCartCount(cartItems.reduce((total, item) => total + (item.quantity || 1), 0));
  }, [cartItems]);

  const value = {
    cart,
    cartItems,
    cartCount,
    loading,
    fetchCartData,
    addToCart,
    removeFromCart,
    updateCart,
    clearCartData,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
