import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchCart, addCartItem, removeCartItem, updateCartItem, clearCart as clearCartAPI } from "../service/home/api.cart";
import { fetchProductById } from "../service/home/api.product";

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

  // Enrich cart items with listing details (title, image, etc.)
  const enrichCartItems = async (items) => {
    const enriched = await Promise.all(
      items.map(async (item) => {
        try {
          const listing = await fetchProductById(item.listingId);
          return {
            ...item,
            title: listing.title || `Sản phẩm #${item.listingId}`,
            imageUrl: listing.primaryImageUrl || listing.images?.[0]?.imageUrl || null,
            sellerName: listing.sellerName || null,
          };
        } catch {
          return {
            ...item,
            title: `Sản phẩm #${item.listingId}`,
            imageUrl: null,
            sellerName: null,
          };
        }
      })
    );
    return enriched;
  };

  const fetchCartData = useCallback(async () => {
    try {
      const data = await fetchCart();
      setCart(data);
      const items = flattenCart(data);
      const enrichedItems = await enrichCartItems(items);
      setCartItems(enrichedItems);
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

  const addToCart = async (product) => {
    // Optimistic update
    const tempItem = {
      listingId: product.listingId || product.id,
      quantity: 1,
      title: product.title,
      imageUrl: product.primaryImageUrl || product.image || product.imageUrl, // Handle various naming conventions
      priceSnapshot: product.price || product.priceSnapshot,
      cartItemId: `temp-${Date.now()}`, // Temporary ID
      sellerName: product.sellerName
    };

    // Calculate new count immediately for better UX
    setCartCount(prev => prev + 1);
    
    // Add to local state immediately
    setCartItems(prev => [...prev, tempItem]);

    try {
      await addCartItem(tempItem.listingId, 1);
      // Fetch latest data to get real IDs and consistent state
      await fetchCartData();
      return { success: true };
    } catch (error) {
      console.error("Error adding to cart:", error);
      // Revert state on error
      setCartItems(prev => prev.filter(item => item.cartItemId !== tempItem.cartItemId));
      setCartCount(prev => Math.max(0, prev - 1));
      return { success: false, message: error.response?.data || "Thêm vào giỏ hàng thất bại" };
    }
  };

  const removeFromCart = async (cartItemId) => {
    // Check if it's a temp item (still adding)
    if (typeof cartItemId === 'string' && cartItemId.startsWith('temp-')) {
       return; // Can't remove yet, or handle differently
    }

    // Find item to revert if needed
    const itemToRemove = cartItems.find(item => item.cartItemId === cartItemId);
    
    // Optimistic remove
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    setCartCount(prev => Math.max(0, prev - (itemToRemove?.quantity || 1)));

    try {
      await removeCartItem(cartItemId);
      await fetchCartData();
    } catch (error) {
      console.error("Error removing from cart:", error);
      // Revert state
      if (itemToRemove) {
        setCartItems(prev => [...prev, itemToRemove]);
        setCartCount(prev => prev + (itemToRemove.quantity || 1));
      }
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      return removeFromCart(cartItemId);
    }
    
    // Optimistic update for quantity? 
    // For now, let's keep quantity update standard or simple optimistic
    const oldItems = [...cartItems];
    const itemToUpdate = cartItems.find(item => item.cartItemId === cartItemId);
    
    // Update local state
    setCartItems(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
    ));
    
    // Recalculate count
    // This is tricky because cartCount is a sum. 
    // Let's rely on standard flow or just trust the effect hook if we update cartItems
    // but the effect hook runs on cartItems change. 
    
    try {
      await updateCartItem(cartItemId, { quantity: newQuantity });
      await fetchCartData();
    } catch (error) {
      console.error("Error updating quantity:", error);
      // Revert
      setCartItems(oldItems);
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
