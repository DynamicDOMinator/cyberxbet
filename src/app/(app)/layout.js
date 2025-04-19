"use client";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { UserProfileProvider } from "../context/UserProfileContext";
import { LanguageProvider } from "../context/LanguageContext";
import Header from "../components/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LabsProvider } from "../context/LabsContext";
export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <AuthStateWrapper>{children}</AuthStateWrapper>
    </AuthProvider>
  );
}

function AuthStateWrapper({ children }) {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if token exists in cookies
    const token = document.cookie.includes('token=');
    
    // If token exists but isAuthenticated is false, set it to true
    if (token && !isAuthenticated) {
      setIsAuthenticated(true);
    }
    
    // Set initialized after first render
    setIsInitialized(true);
  }, [isAuthenticated, setIsAuthenticated]);

  useEffect(() => {
    // Only redirect if we've initialized and user is not authenticated
    if (isInitialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router, isInitialized]);

  // Don't render anything until initialized
  if (!isInitialized) {
    return null;
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <UserProfileProvider>
      <LanguageProvider>
        <LabsProvider>
          <Header />
          {children}
        </LabsProvider>
      </LanguageProvider>
    </UserProfileProvider>
  );
}
