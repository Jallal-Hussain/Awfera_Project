// src/components/loader/useLoader.ts
import { useContext } from 'react';
import LoaderContext from './LoaderContext';
import { type LoaderContextType } from './types';

export const useLoader = (): LoaderContextType => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  return context;
};