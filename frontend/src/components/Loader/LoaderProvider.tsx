// src/components/LoaderProvider.tsx
import React, { useState, type ReactNode } from "react";
import Loader from "./Loader";
import LoaderContext from "./LoaderContext";

interface LoaderProviderProps {
  children: ReactNode;
}

export const LoaderProvider: React.FC<LoaderProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const showLoader = (message = "Loading...") => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
    setLoadingMessage("Loading...");
  };

  const withLoader = async <T,>(
    asyncFunction: () => Promise<T>,
    message = "Loading..."
  ): Promise<T> => {
    showLoader(message);
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      hideLoader();
    }
  };

  return (
    <LoaderContext.Provider
      value={{
        isLoading,
        loadingMessage,
        showLoader,
        hideLoader,
        withLoader,
      }}
    >
      {children}
      {isLoading && <Loader overlay message={loadingMessage} />}
    </LoaderContext.Provider>
  );
};
