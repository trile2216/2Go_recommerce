import { createContext, useContext, useEffect, useState } from "react";
import { instance } from "../lib/axios";

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [books, setBooks] = useState([]);

  const fetchBooks = async () => {
    const res = await instance.get("/");
    setBooks(res.data);
  };

  const addBook = async (newBook) => {
    const res = await instance.post("/", newBook);
    setBooks((prevBooks) => [...prevBooks, res.data]);
  };

  const removeBook = async (id) => {
    await instance.delete(`/${id}`);
    setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
  };

  const updateBook = async (id, updatedBook) => {
    const res = await instance.put(`/${id}`, updatedBook);
    setBooks((prevBooks) =>
      prevBooks.map((book) => (book.id === id ? res.data : book))
    );
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <AppContext.Provider
      value={{
        books,
        setBooks,
        addBook,
        removeBook,
        updateBook,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export default AppProvider;
