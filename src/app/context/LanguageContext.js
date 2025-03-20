"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Initialize with null, will be updated in useEffect
  const [isEnglish, setIsEnglish] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language preference when component mounts
  useEffect(() => {
    // Check if we're in a browser environment (necessary for Next.js)
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language");
      if (savedLanguage) {
        setIsEnglish(savedLanguage === "english");
      }
      setIsLoaded(true);
    }
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("language", isEnglish ? "english" : "arabic");
    }
  }, [isEnglish, isLoaded]);

  return (
    <LanguageContext.Provider value={{ isEnglish, setIsEnglish }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
