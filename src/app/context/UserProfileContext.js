"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "./AuthContext";

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");
  const [country, setCountry] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  // Fetch user profile data - wrap with useCallback
  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      if (!token || !apiUrl) {
        throw new Error("Authentication token or API URL not found");
      }

      

      // Add timeout to prevent hanging requests
      const response = await axios.get(`${apiUrl}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 20000, // 10 seconds timeout
      });

      // Set individual user profile fields
      const userData = response.data.user;

      setEmail(userData.email);
      setProfileImage(userData.profile_image);
      setUserName(userData.user_name);
      setCountry(userData.country);

      return userData;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response,
      });

      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch user profile"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]); // Add dependencies here

  // Update user profile
  const updateUserProfile = async (profileData) => {
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      if (!token || !apiUrl) {
        throw new Error("Authentication token or API URL not found");
      }

      const response = await axios.put(`${apiUrl}/user/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update individual user profile fields
      const userData = response.data.user;

      setEmail(userData.email);
      setProfileImage(userData.profile_image);
      setUserName(userData.user_name);
      setCountry(userData.country);

      return {
        success: true,
        data: response.data,
        message: response.data.message || "Profile updated successfully!",
      };
    } catch (error) {
      console.error("Error updating user profile:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update user profile";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile on authentication change
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    } else {
      // Reset all user data when not authenticated
      setEmail("");
      setProfileImage(null);
      setUserName("");
      setCountry("");
    }
  }, [isAuthenticated, fetchUserProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        email,
        profileImage,
        userName,
        country,
        loading,
        error,
        fetchUserProfile,
        updateUserProfile,
        setError,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
