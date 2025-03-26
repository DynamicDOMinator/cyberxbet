"use client";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { UserProfileProvider } from "../context/UserProfileContext";
import { LanguageProvider } from "../context/LanguageContext";
import Header from "../components/Header";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function ProtectedLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <Header />
      {children}
    </>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <LanguageProvider>
          <ProtectedLayout>{children}</ProtectedLayout>
        </LanguageProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
