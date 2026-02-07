import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchCart, addCartItem, removeCartItem, updateCartItem, clearCart as clearCartAPI } from "../service/home/api.cart";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Flatten groups into a single items array
  const flattenCart = (cartData) => {
    if (!cartData?.groups) return [];
    return cartData.groups.flatMap(group => group.items || []);
  };

  const fetchCartData = useCallback(async () => {
    try {
      const data = await fetchCart();
      setCart(data);
      const items = flattenCart(data);
      setCartItems(items);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cart data:", error);
      setCart(null);
      setCartItems([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCartData();
    } else {
      setLoading(false);
    }
  }, [fetchCartData]);

  useEffect(() => {
    setCartCount(cartItems.reduce((total, item) => total + (item.quantity || 1), 0));
  }, [cartItems]);

  const addToCart = async (listingId) => {
    try {
      await addCartItem(listingId, 1);
      await fetchCartData();
      return { success: true };
    } catch (error) {
      console.error("Error adding to cart:", error);
      return { success: false, message: error.response?.data || "Thêm vào giỏ hàng thất bại" };
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await removeCartItem(cartItemId);
      await fetchCartData();
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      return removeFromCart(cartItemId);
    }
    try {
      await updateCartItem(cartItemId, { quantity: newQuantity });
      await fetchCartData();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const clearAllCart = async () => {
    try {
      await clearCartAPI();
      setCart(null);
      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const getTotalPrice = () =>
    cartItems.reduce(
      (total, item) => total + (Number(item.priceSnapshot) || 0) * (item.quantity || 1),
      0
    );

  const isInCart = (listingId) => {
    return cartItems.some(item => item.listingId === listingId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        cartCount,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart: clearAllCart,
        getTotalPrice,
        fetchCartData,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
