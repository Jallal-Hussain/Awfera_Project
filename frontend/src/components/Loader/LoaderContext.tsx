// src/components/loader/LoaderContext.tsx
import { createContext } from "react";
import { type LoaderContextType } from "./types";

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export default LoaderContext;
