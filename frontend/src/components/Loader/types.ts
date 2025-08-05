// src/components/loader/types.ts
export interface LoaderContextType {
  isLoading: boolean;
  loadingMessage: string;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  withLoader: <T>(
    asyncFunction: () => Promise<T>,
    message?: string
  ) => Promise<T>;
}

export interface LoaderProps {
  size?: "small" | "medium" | "large";
  message?: string;
  overlay?: boolean;
}
