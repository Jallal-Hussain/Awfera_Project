// src/components/Loader.tsx
import React from "react";
import { type LoaderProps } from "./types";

const Loader: React.FC<LoaderProps> = ({
  size = "medium",
  message = "Loading...",
  overlay = false,
}) => {
  const sizeConfig = {
    small: {
      spinner: "w-5 h-5",
      border: "border-2",
      text: "text-sm",
      spacing: "space-y-2",
      padding: "p-4",
    },
    medium: {
      spinner: "w-8 h-8",
      border: "border-3",
      text: "text-base",
      spacing: "space-y-3",
      padding: "p-6",
    },
    large: {
      spinner: "w-12 h-12",
      border: "border-4",
      text: "text-lg",
      spacing: "space-y-4",
      padding: "p-8",
    },
  };

  const config = sizeConfig[size];

  const loaderContent = (
    <div
      className={`flex flex-col items-center justify-center ${config.spacing}`}
    >
      {/* Spinner with your custom theme */}
      <div className={`${config.spinner} relative`}>
        {/* Background circle */}
        <div
          className={`absolute inset-0 ${config.border} rounded-full`}
          style={{ borderColor: "var(--color-muted)" }}
        />
        {/* Animated gradient circle */}
        <div
          className={`absolute inset-0 ${config.border} border-transparent rounded-full animate-spin`}
          style={{
            background:
              "conic-gradient(from 0deg, transparent, var(--color-primary))",
            borderRadius: "50%",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
          }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--color-secondary)" }}
          />
        </div>
      </div>

      {/* Loading message */}
      <div
        className={`font-semibold ${config.text} text-center max-w-xs`}
        style={{ color: "var(--color-muted-foreground)" }}
      >
        {message}
      </div>

      {/* Loading dots */}
      <div className="flex space-x-1">
        <div
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{
            backgroundColor: "var(--color-primary)",
            animationDelay: "0ms",
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{
            backgroundColor: "var(--color-secondary)",
            animationDelay: "150ms",
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{
            backgroundColor: "var(--color-primary)",
            animationDelay: "300ms",
          }}
        />
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300"
        style={{ backgroundColor: "rgba(0, 15, 20, 0.8)" }}
      >
        <div
          className={`rounded-xl shadow-2xl ${config.padding} transform transition-all duration-300 border`}
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-muted)",
          }}
        >
          {loaderContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[120px]">
      {loaderContent}
    </div>
  );
};

export default Loader;
