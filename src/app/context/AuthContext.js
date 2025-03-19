"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const token = Cookies.get("token");

    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Login function
  const login = async (email, password, recaptchaToken, isEnglish = true) => {
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error(
          "API URL not configured. Please check .env.local file."
        );
      }

      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password,
        recaptchaToken,
      });

      // Handle successful login
      if (response.data.token && response.data.user) {
        Cookies.set("token", response.data.token);

        setIsAuthenticated(true);
        router.push("/home");
        return {
          success: true,
          data: response.data,
          message:
            response.data.message ||
            (isEnglish ? "Login successful!" : "تم تسجيل الدخول بنجاح!"),
        };
      }

      return {
        success: true,
        data: response.data,
        message:
          response.data.message ||
          (isEnglish ? "Login successful!" : "تم تسجيل الدخول بنجاح!"),
      };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        (isEnglish
          ? "An error occurred during login"
          : "حدث خطأ أثناء تسجيل الدخول");

      setError(errorMessage);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (otpData, isEnglish = true) => {
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await axios.post(`${apiUrl}/auth/verify-otp`, otpData);

      // Handle successful verification and login
      if (response.data.token && response.data.user) {
        Cookies.set("token", response.data.token);

        setIsAuthenticated(true);
        router.push("/home");
        return {
          success: true,
          data: response.data,
          message:
            response.data.message ||
            (isEnglish
              ? "Registration completed successfully!"
              : "تم إكمال التسجيل بنجاح!"),
        };
      }

      // If response doesn't contain token/user but was successful
      return {
        success: true,
        data: response.data,
        message:
          response.data.message ||
          (isEnglish
            ? "Your account has been verified! Please log in."
            : "تم التحقق من حسابك! الرجاء تسجيل الدخول."),
      };
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          (isEnglish
            ? "An error occurred during verification"
            : "حدث خطأ أثناء التحقق")
      );

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        error,
        login,
        verifyOtp,
        setError,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
