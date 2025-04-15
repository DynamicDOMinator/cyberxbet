"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Token validation using an existing endpoint or JWT decoding
  useEffect(() => {
    const validateToken = async () => {
      const token = Cookies.get("token");

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        // Option 1: Use an existing profile or user endpoint that requires authentication
        const response = await axios.get(`${apiUrl}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // If the request succeeds, the token is valid
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token validation error:", error);
        Cookies.remove("token");
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  // Login function
  const login = async (login, password, isEnglish = true) => {
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await axios.post(`${apiUrl}/auth/login`, {
        login,
        password,
      });

      if (response.data.token && response.data.user) {
        // Set the token in cookies
        Cookies.set("token", response.data.token);
        
        // Set authentication state
        setIsAuthenticated(true);
        
        // Navigate to home page
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
    }
  };

  
  const verifyOtp = async (otpData, isEnglish = true) => {
    setError("");
  

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await axios.post(`${apiUrl}/auth/verify-otp`, otpData);

     
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
   
    }
  };

  // Logout function
  const logout = async (isEnglish = true) => {
    setError("");
  

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error(
          "API URL not configured. Please check .env.local file."
        );
      }

      const token = Cookies.get("token");

      if (token) {
        await axios.post(`${apiUrl}/auth/logout`, {
          token,
        });
      }

      Cookies.remove("token");
      setIsAuthenticated(false);
      router.push("/login");

      return {
        success: true,
        message: isEnglish
          ? "Logged out successfully!"
          : "تم تسجيل الخروج بنجاح!",
      };
    } catch (error) {
      console.error("Logout error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        (isEnglish
          ? "An error occurred during logout"
          : "حدث خطأ أثناء تسجيل الخروج");

      setError(errorMessage);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    } 
  };

  return (
    <AuthContext.Provider
      value={{
        error,
        login,
        verifyOtp,
        logout,
        setError,
        isAuthenticated,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
