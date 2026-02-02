import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const StorageContext = createContext();

const KEY = "book_favorites";

const StorageProvider = ({ children }) => {
  const [storageData, setStorageData] = useState(null);

  const getStorageData = async () => {
    const data = await AsyncStorage.getItem(KEY);
    const parsedData = JSON.parse(data) || [];
    setStorageData(parsedData);
  };

  const addStorageData = async (newData) => {
    const updatedData = [...(storageData || []), newData];
    setStorageData(updatedData);
    await AsyncStorage.setItem(KEY, JSON.stringify(updatedData));
  };

  const removeStorageData = async (id) => {
    const updatedData = (storageData || []).filter((item) => item.id !== id);
    setStorageData(updatedData);
    await AsyncStorage.setItem(KEY, JSON.stringify(updatedData));
  };

  const updateStorageData = async (id, updatedItem) => {
    const updatedData = (storageData || []).map((item) =>
      item.id === id ? { ...item, ...updatedItem } : item
    );
    setStorageData(updatedData);
    await AsyncStorage.setItem(KEY, JSON.stringify(updatedData));
  };

  useEffect(() => {
    getStorageData();
  }, []);

  return (
    <StorageContext.Provider
      value={{
        storageData,
        setStorageData,
        addStorageData,
        removeStorageData,
        updateStorageData,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export const useStorageContext = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorageContext must be used within a StorageProvider");
  }
  return context;
};

export default StorageProvider;
