import { useEffect } from 'react';

/**
 * Custom hook to set document title
 * @param {string} title - The title to set
 * @param {string} suffix - Optional suffix (defaults to "2Go Recommerce")
 */
export const useTitle = (title, suffix = "2Go") => {
  useEffect(() => {
    if (title) {
      document.title = `${title} - ${suffix}`;
    } else {
      document.title = suffix;
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = suffix;
    };
  }, [title, suffix]);
};