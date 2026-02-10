import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FavoritesProvider } from "../context/FavoritesContext";

const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          {children}
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default AppProvider;
