import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const FavoritesContext = createContext();

const KEY = "saved_listings";

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  const getFavoritesData = async () => {
    try {
      const data = await AsyncStorage.getItem(KEY);
      const parsedData = data ? JSON.parse(data) : [];
      setFavorites(parsedData);
    } catch (error) {
      console.error("Error getting favorites:", error);
    }
  };

  const addToFavorites = async (listing) => {
    try {
      const updated = [...favorites, listing];
      setFavorites(updated);
      await AsyncStorage.setItem(KEY, JSON.stringify(updated));
      return { success: true };
    } catch (error) {
      console.error("Error adding to favorites:", error);
      return { success: false, error };
    }
  };

  const removeFromFavorites = async (listingId) => {
    try {
      const updated = favorites.filter((item) => item.id !== listingId);
      setFavorites(updated);
      await AsyncStorage.setItem(KEY, JSON.stringify(updated));
      return { success: true };
    } catch (error) {
      console.error("Error removing from favorites:", error);
      return { success: false, error };
    }
  };

  const isFavorited = (listingId) => {
    return favorites.some((item) => item.id === listingId);
  };

  useEffect(() => {
    getFavoritesData();
  }, []);

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
  };

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
};
