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
  const [timeZone, setTimeZone] = useState("");
  const [discord, setDiscord] = useState(null);
  const [instagram, setInstagram] = useState(null);
  const [twitter, setTwitter] = useState(null);
  const [tiktok, setTiktok] = useState(null);
  const [youtube, setYoutube] = useState(null);

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

      const response = await axios.get(`${apiUrl}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 20000,
      });

      // Set individual user profile fields
      const userData = response.data.user;

      setEmail(userData.email);
      setProfileImage(userData.profile_image);
      setUserName(userData.user_name);
      setCountry(userData.country);
      setTimeZone(userData.time_zone);

      // Update how we handle socialMedia data
      if (userData.socialMedia) {
        setDiscord(userData.socialMedia.discord || null);
        setInstagram(userData.socialMedia.instagram || null);
        setTwitter(userData.socialMedia.twitter || null);
        setTiktok(userData.socialMedia.tiktok || null);
        setYoutube(userData.socialMedia.youtube || null);
      }

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
  }, [isAuthenticated]);

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
      setTimeZone(userData.time_zone);

      // Update how we handle socialMedia data
      if (userData.socialMedia) {
        setDiscord(userData.socialMedia.discord || null);
        setInstagram(userData.socialMedia.instagram || null);
        setTwitter(userData.socialMedia.twitter || null);
        setTiktok(userData.socialMedia.tiktok || null);
        setYoutube(userData.socialMedia.youtube || null);
      }

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
      setTimeZone("");
      setDiscord(null);
      setInstagram(null);
      setTwitter(null);
      setTiktok(null);
      setYoutube(null);
    }
  }, [isAuthenticated, fetchUserProfile]);

  return (
    <UserProfileContext.Provider
      value={{
        email,
        profileImage,
        userName,
        country,
        timeZone,
        discord,
        instagram,
        twitter,
        tiktok,
        youtube,
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
