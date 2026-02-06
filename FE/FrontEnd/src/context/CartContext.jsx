import { createContext, useContext, useState, useEffect } from "react";
import api from "../config/axios";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCartData = async () => {
    try {
      const response = await api.get("/cart");
      if (Array.isArray(response.data)) {
        setCartItems(
          response.data.map((item) => ({
            productId: item.productId ?? item.id,
            productName: item.productName ?? item.name,
            productImage: item.productImage ?? item.image,
            productPrice: item.productPrice ?? item.price ?? 0,
            quantity: item.quantity ?? 1,
          }))
        );
      } else {
        setCartItems([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cart data:", error);
      setCartItems([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  useEffect(() => {
    setCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
  }, [cartItems]);

  const addToCart = async (product) => {
    try {
      await api.post("/cart/add", {
        productId: product.productId || product.id,
        quantity: product.quantity || 1,
      });
      await fetchCartData();
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await api.delete(`/cart/${productId}`);
      await fetchCartData();
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      return removeFromCart(productId);
    }
    try {
      await api.post("/cart/update-quantity", { productId, quantity: newQuantity });
      await fetchCartData();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const clearCart = async () => {
    try {
      setCartItems([]);
      await fetchCartData();
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const getTotalPrice = () =>
    cartItems.reduce(
      (total, item) => total + (item.productPrice || 0) * (item.quantity || 1),
      0
    );

  if (loading) {
    return <div>Loading cart...</div>;
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        fetchCartData,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
