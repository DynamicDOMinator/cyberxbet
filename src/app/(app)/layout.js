"use client";
import { AuthProvider } from "../context/AuthContext";
import { UserProfileProvider } from "../context/UserProfileContext";
import { LanguageProvider } from "../context/LanguageContext";
import Header from "../components/Header";

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <LanguageProvider>
          {/* <Header /> */}
          {children}
        </LanguageProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
