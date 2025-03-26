"use client";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { UserProfileProvider } from "../context/UserProfileContext";
import { LanguageProvider } from "../context/LanguageContext";
import Header from "../components/Header";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "../components/LoadingPage";


export default function AppLayout({ children }) {


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
    return <LoadingPage />;
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
