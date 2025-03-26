"use client";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { UserProfileProvider } from "../context/UserProfileContext";
import { LanguageProvider } from "../context/LanguageContext";
import Header from "../components/Header";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function AppLayout({ children }) {
  const router = useRouter();

  return (
    <AuthProvider>
      <AuthStateWrapper>{children}</AuthStateWrapper>
    </AuthProvider>
  );
}

function AuthStateWrapper({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return isAuthenticated ? (
    <UserProfileProvider>
      <LanguageProvider>
        <Header />
        {children}
      </LanguageProvider>
    </UserProfileProvider>
  ) : null;
}
