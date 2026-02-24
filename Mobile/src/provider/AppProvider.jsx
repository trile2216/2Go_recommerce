import { Provider } from "react-redux";
import { store } from "../store";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FavoritesProvider } from "../context/FavoritesContext";

const AppProvider = ({ children }) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </Provider>
  );
};

export default AppProvider;
