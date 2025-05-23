"use client";
import { useLanguage } from "@/app/context/LanguageContext";
import { FaTiktok } from "react-icons/fa6";
import axios from "axios";
import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { FaInstagram } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import Cookies from "js-cookie";
import LoadingPage from "@/app/components/LoadingPage";
import { Inter } from "next/font/google";
import CountrySelect from "@/app/components/CountrySelect";
import countryList from "react-select-country-list";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Select from "react-select";
const inter = Inter({ subsets: ["latin"] });

export default function ProfileSettings() {
  const { isEnglish } = useLanguage();
  const { logout } = useAuth();
  const {
    email,
    userName,
    country,
    loading,
    error,
    fetchUserProfile,
    profileImage: contextProfileImage,
    setError,
    timeZone,
  } = useUserProfile();

  const countries = useMemo(() => countryList().getData(), []);
  const router = useRouter();
  const initialCountry = useMemo(() => {
    if (!country) return null;

    if (country && typeof country === "object" && country.value) {
      return country;
    }

    if (typeof country === "string") {
      return countries.find(
        (c) => c.value.toLowerCase() === country.toLowerCase()
      );
    }

    return null;
  }, [country, countries]);

  const [selectedCountry, setSelectedCountry] = useState(initialCountry);

  const [newEmail, setNewEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");

  const [socialAccounts, setSocialAccounts] = useState({
    discord: { linked: false, value: "" },
    instagram: { linked: false, value: "" },
    linkedin: { linked: false, value: "" },
    tiktok: { linked: false, value: "" },
    youtube: { linked: false, value: "" },
    twitter: { linked: false, value: "" },
  });

  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [emailOtpMessage, setEmailOtpMessage] = useState("");
  const [emailOtpExpiry, setEmailOtpExpiry] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const otpInputRefs = useRef([]);
  const [successMessage, setSuccessMessage] = useState("");

  const [inputUserName, setInputUserName] = useState("");

  const [profileImage, setProfileImage] = useState("/icon1.png");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [hasChanges, setHasChanges] = useState(false);

  const [originalUserName, setOriginalUserName] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [selectedTimeZone, setSelectedTimeZone] = useState(timeZone);

  const [savingSocialMedia, setSavingSocialMedia] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Get all available timezones
  const timeZones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone")
        .map((zone) => {
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: zone,
            timeZoneName: "longOffset",
          });
          const parts = formatter.formatToParts(new Date());
          const timeZonePart = parts.find(
            (part) => part.type === "timeZoneName"
          );
          return {
            value: zone,
            label: `${zone} (${timeZonePart?.value || ""})`,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      console.error("Error getting timezones:", error);
      return [];
    }
  }, []);

  const countrySelectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: "#0B0D0F",
      borderColor: "transparent",
      boxShadow: "none",
      padding: "6px",
      borderRadius: "0.75rem",
      "&:hover": {
        borderColor: "#00D8C8",
        boxShadow: "0px 0px 0px 1px #00D8C8, 0px 0px 10px 0px #00D8C8",
      },
      "&:focus": {
        borderColor: "transparent",
        boxShadow: "none",
      },
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: "#131619",
    }),
    option: (styles) => ({
      ...styles,
      backgroundColor: "transparent",
      color: "white",
      "&:hover": {
        backgroundColor: "#2a2e32",
      },
    }),
    singleValue: (styles) => ({
      ...styles,
      color: "white",
      textAlign: isEnglish ? "left" : "right",
    }),
    placeholder: (styles) => ({
      ...styles,
      color: "gray",
      textAlign: isEnglish ? "left" : "right",
    }),
    input: (styles) => ({
      ...styles,
      color: "white",
      textAlign: isEnglish ? "left" : "right",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (styles) => ({
      ...styles,
      color: "gray",
      "&:hover": {
        color: "#00D8C8",
      },
    }),
    menuList: (styles) => ({
      ...styles,
      padding: "0",
    }),
  };

  const timeZoneSelectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: "#0B0D0F",
      borderColor: "transparent",
      boxShadow: "none",
      padding: "6px",
      borderRadius: "0.75rem",
      "&:hover": {
        borderColor: "#00D8C8",
        boxShadow: "0px 0px 0px 1px #00D8C8, 0px 0px 10px 0px #00D8C8",
      },
      "&:focus": {
        borderColor: "transparent",
        boxShadow: "none",
      },
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: "#131619",
    }),
    option: (styles) => ({
      ...styles,
      backgroundColor: "transparent",
      color: "white",
      "&:hover": {
        backgroundColor: "#2a2e32",
      },
    }),
    singleValue: (styles) => ({
      ...styles,
      color: "white",
      textAlign: isEnglish ? "left" : "right",
    }),
    placeholder: (styles) => ({
      ...styles,
      color: "gray",
      textAlign: isEnglish ? "left" : "right",
    }),
    input: (styles) => ({
      ...styles,
      color: "white",
      textAlign: isEnglish ? "left" : "right",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (styles) => ({
      ...styles,
      color: "gray",
      "&:hover": {
        color: "#00D8C8",
      },
    }),
    menuList: (styles) => ({
      ...styles,
      padding: "0",
    }),
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if current input is filled
    if (value && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);

      otpInputRefs.current[5].focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.join("").length !== 6) {
      setError(
        isEnglish
          ? "Please enter a valid 6-digit OTP"
          : "الرجاء إدخال رمز تحقق صالح مكون من 6 أرقام"
      );
      return;
    }

    const otpString = otp.join("");
    setVerifyingOtp(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      await axios.post(
        `${apiUrl}/user/verify-email-change`,
        {
          otp: otpString,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setShowOtpPopup(false);
      setOtp(["", "", "", "", "", ""]);

      setSuccessMessage(
        isEnglish
          ? "Email updated successfully!"
          : "تم تحديث البريد الإلكتروني بنجاح!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      logout();
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? "Invalid OTP or verification failed"
            : "رمز تحقق غير صالح أو فشل التحقق")
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleEmailUpdate = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    setError("");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(newEmail)) {
      setError(
        isEnglish
          ? "Please enter a valid email address"
          : "يرجى إدخال بريد إلكتروني صحيح"
      );
      return;
    }

    try {
      const token = Cookies.get("token");

      const response = await axios.post(
        `${apiUrl}/user/request-email-change`,
        {
          new_email: newEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setEmailOtpMessage(
        isEnglish
          ? response.data.message ||
              "OTP has been sent to your new email address."
          : "تم إرسال رمز التحقق إلى عنوان بريدك الإلكتروني الجديد."
      );
      setEmailOtpExpiry(response.data.expires_in || 300);
      setShowOtpPopup(true);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? "Failed to request email change"
            : "فشل في طلب تغيير البريد الإلكتروني")
      );
    }
  };

  const cancelEmailEdit = () => {
    setNewEmail(originalEmail);
    setEditingEmail(false);
  };

  const handleLinkAccount = async (platform) => {
    // First validate the URL
    if (!socialAccounts[platform].value) {
      setValidationErrors({
        ...validationErrors,
        [platform]: isEnglish
          ? "Please enter a URL before linking"
          : "الرجاء إدخال الرابط قبل الربط",
      });
      return;
    }

    if (!validateSocialMediaUrl(socialAccounts[platform].value, platform)) {
      setValidationErrors({
        ...validationErrors,
        [platform]: isEnglish
          ? `Invalid ${platform} URL format`
          : `تنسيق رابط ${platform} غير صالح`,
      });
      return;
    }

    // Set the button to loading state
    setSocialAccounts({
      ...socialAccounts,
      [platform]: { ...socialAccounts[platform], linking: true },
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      // Create an object with just this platform
      const socialMediaData = {
        // Use linkedIn with capital I for the API
        [platform === "linkedin" ? "linkedIn" : platform]:
          socialAccounts[platform].value,
      };

      const response = await axios.post(
        `${apiUrl}/user/change-socialmedia-links`,
        socialMediaData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Get the updated social media links from the response
      const updatedSocialMedia = response.data.social_media;

      // Update the state based on the API response
      setSocialAccounts((prev) => ({
        ...prev,
        discord: {
          ...prev.discord,
          linked: !!updatedSocialMedia.discord,
          value: updatedSocialMedia.discord || "",
          linking: false,
        },
        instagram: {
          ...prev.instagram,
          linked: !!updatedSocialMedia.instagram,
          value: updatedSocialMedia.instagram || "",
          linking: false,
        },
        linkedin: {
          ...prev.linkedin,
          linked: !!updatedSocialMedia.linkedIn,
          value: updatedSocialMedia.linkedIn || "",
          linking: false,
        },
        twitter: {
          ...prev.twitter,
          linked: !!updatedSocialMedia.twitter,
          value: updatedSocialMedia.twitter || "",
          linking: false,
        },
        tiktok: {
          ...prev.tiktok,
          linked: !!updatedSocialMedia.tiktok,
          value: updatedSocialMedia.tiktok || "",
          linking: false,
        },
        youtube: {
          ...prev.youtube,
          linked: !!updatedSocialMedia.youtube,
          value: updatedSocialMedia.youtube || "",
          linking: false,
        },
      }));

      setSuccessMessage(
        isEnglish
          ? `${platform} account linked successfully!`
          : `تم ربط حساب ${platform} بنجاح!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error(`Error linking ${platform} account:`, error);
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? `Failed to link ${platform} account`
            : `فشل في ربط حساب ${platform}`)
      );

      // Revert the linking state
      setSocialAccounts({
        ...socialAccounts,
        [platform]: {
          ...socialAccounts[platform],
          linking: false,
        },
      });
    }
  };

  const handleUnlinkAccount = async (platform) => {
    // Set the button to loading state
    setSocialAccounts({
      ...socialAccounts,
      [platform]: { ...socialAccounts[platform], unlinking: true },
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      // Send platform name in the request body
      // Map 'linkedin' to 'linkedIn' for the API
      const apiPlatform = platform === "linkedin" ? "linkedIn" : platform;

      const response = await axios.post(
        `${apiUrl}/user/unlink-socialmedia-links`,
        {
          platform: apiPlatform,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Get the updated social media links from the response
      const updatedSocialMedia = response.data.social_media;

      // Update the state based on the API response
      setSocialAccounts((prev) => ({
        ...prev,
        discord: {
          ...prev.discord,
          linked: !!updatedSocialMedia.discord,
          value: updatedSocialMedia.discord || "",
          unlinking: false,
        },
        instagram: {
          ...prev.instagram,
          linked: !!updatedSocialMedia.instagram,
          value: updatedSocialMedia.instagram || "",
          unlinking: false,
        },
        linkedin: {
          ...prev.linkedin,
          linked: !!updatedSocialMedia.linkedIn,
          value: updatedSocialMedia.linkedIn || "",
          unlinking: false,
        },
        twitter: {
          ...prev.twitter,
          linked: !!updatedSocialMedia.twitter,
          value: updatedSocialMedia.twitter || "",
          unlinking: false,
        },
        tiktok: {
          ...prev.tiktok,
          linked: !!updatedSocialMedia.tiktok,
          value: updatedSocialMedia.tiktok || "",
          unlinking: false,
        },
        youtube: {
          ...prev.youtube,
          linked: !!updatedSocialMedia.youtube,
          value: updatedSocialMedia.youtube || "",
          unlinking: false,
        },
      }));

      setSuccessMessage(
        isEnglish
          ? `${platform} account unlinked successfully!`
          : `تم إلغاء ربط حساب ${platform} بنجاح!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error(`Error unlinking ${platform} account:`, error);
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? `Failed to unlink ${platform} account`
            : `فشل في إلغاء ربط حساب ${platform}`)
      );

      // Revert the unlinking state
      setSocialAccounts({
        ...socialAccounts,
        [platform]: {
          ...socialAccounts[platform],
          unlinking: false,
        },
      });
    }
  };

  // Update the fetchSocialMediaLinks function
  const fetchSocialMediaLinks = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.get(`${apiUrl}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data.user;

      if (userData && userData.socialMedia) {
        const userSocialMedia = userData.socialMedia;

        // Update socialAccounts state with the new data
        setSocialAccounts({
          ...socialAccounts,
          discord: {
            linked: !!userSocialMedia.discord,
            value: userSocialMedia.discord || "",
          },
          instagram: {
            linked: !!userSocialMedia.instagram,
            value: userSocialMedia.instagram || "",
          },
          twitter: {
            linked: !!userSocialMedia.twitter,
            value: userSocialMedia.twitter || "",
          },
          tiktok: {
            linked: !!userSocialMedia.tiktok,
            value: userSocialMedia.tiktok || "",
          },
          youtube: {
            linked: !!userSocialMedia.youtube,
            value: userSocialMedia.youtube || "",
          },
          linkedin: {
            linked: !!userSocialMedia.linkedIn, // Note the capital 'I' here
            value: userSocialMedia.linkedIn || "",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching social media links:", error);
    }
  };

  useEffect(() => {
    // Set loading state before fetching
    setInitialLoading(true);

    // Fetch the user profile data and social media links
    fetchUserProfile()
      .then(() => {
        return fetchSocialMediaLinks();
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [fetchUserProfile]);

  useEffect(() => {
    if (country) {
      setSelectedCountry(initialCountry);
    }

    if (email && !newEmail) {
      setNewEmail("");
      setOriginalEmail(email);
    }

    if (userName && !inputUserName) {
      setInputUserName("");
      setOriginalUserName(userName);
    }

    if (timeZone) {
      setSelectedTimeZone(timeZone);
    }
  }, [
    country,
    initialCountry,
    email,
    newEmail,
    userName,
    inputUserName,
    timeZone,
  ]);

  useEffect(() => {
    if (!userName) return;

    const usernameChanged = inputUserName !== "" && inputUserName !== userName;

    let countryChanged = false;
    if (selectedCountry && typeof selectedCountry === "object") {
      if (typeof country === "string" && country) {
        countryChanged =
          selectedCountry.value?.toLowerCase() !== country.toLowerCase();
      } else if (country && typeof country === "object" && country.value) {
        countryChanged = selectedCountry.value !== country.value;
      }
    }

    const timezoneChanged = selectedTimeZone !== timeZone;

    setHasChanges(usernameChanged || countryChanged || timezoneChanged);
  }, [
    inputUserName,
    selectedCountry,
    userName,
    country,
    selectedTimeZone,
    timeZone,
  ]);

  const handleSaveChanges = async () => {
    const usernameChanged = inputUserName !== "" && inputUserName !== userName;

    let countryChanged = false;
    if (selectedCountry && typeof selectedCountry === "object") {
      if (typeof country === "string" && country) {
        countryChanged =
          selectedCountry.value?.toLowerCase() !== country.toLowerCase();
      } else if (country && typeof country === "object" && country.value) {
        countryChanged = selectedCountry.value !== country.value;
      }
    }

    const timezoneChanged = selectedTimeZone !== timeZone;

    if (!usernameChanged && !countryChanged && !timezoneChanged) {
      setSuccessMessage(
        isEnglish ? "No changes to save" : "لا توجد تغييرات للحفظ"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    setError("");

    setSavingProfile(true);

    try {
      const token = Cookies.get("token");
      const formData = new FormData();

      // ONLY add username and country - NEVER the image
      if (usernameChanged) {
        formData.append("user_name", inputUserName);
      }

      if (countryChanged && selectedCountry && selectedCountry.value) {
        formData.append("country", selectedCountry.value);
      }

      if (timezoneChanged) {
        formData.append("time_zone", selectedTimeZone);
      }

      const response = await axios.post(
        `${apiUrl}/user/change-profile-data`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );

      setSuccessMessage(
        isEnglish
          ? "Profile updated successfully!"
          : "تم تحديث المعلومات الشخصية بنجاح!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? "Failed to update profile"
            : "فشل تحديث المعلومات الشخصية")
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(
        isEnglish
          ? "Image size should be less than 5MB"
          : "يجب أن يكون حجم الصورة أقل من 5 ميغابايت"
      );
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError(
        isEnglish
          ? "Please select a valid image file (JPEG, PNG, GIF, WEBP)"
          : "يرجى اختيار ملف صورة صالح (JPEG، PNG، GIF، WEBP)"
      );
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setProfileImage(imageUrl);

    setSelectedImageFile(file);
    setError("");
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      setError(
        isEnglish ? "Please select an image first" : "الرجاء اختيار صورة أولاً"
      );
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    setError("");
    setUploading(true);

    try {
      const token = Cookies.get("token");
      const formData = new FormData();

      formData.append("profile_image", selectedImageFile);

      const response = await axios.post(
        `${apiUrl}/user/change-profile-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,

            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );

      setSuccessMessage(
        isEnglish
          ? "Profile image updated successfully!"
          : "تم تحديث صورة الملف الشخصي بنجاح!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      setSelectedImageFile(null);

      fetchUserProfile();
    } catch (error) {
      console.error("Error uploading image:", error);
      console.error("Error details:", error.response?.data);
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? "Failed to upload profile image"
            : "فشل تحديث صورة الملف الشخصي")
      );
    } finally {
      setUploading(false);
    }
  };

  // Add these new functions
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveImage = async () => {
    // Always revert to default image when removing
    setProfileImage("/icon1.png");
    setSelectedImageFile(null);
    setError("");
    setUploading(true);

    try {
      // First, fetch the default icon1.png image
      const iconResponse = await fetch("/icon1.png");
      if (!iconResponse.ok) {
        throw new Error("Failed to fetch default icon");
      }
      const iconBlob = await iconResponse.blob();

      // Create a File object from the blob
      const iconFile = new File([iconBlob], "icon1.png", { type: "image/png" });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const formData = new FormData();

      // Send the default icon as the profile image
      formData.append("profile_image", iconFile);

      const response = await axios.post(
        `${apiUrl}/user/change-profile-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );

      setSuccessMessage(
        isEnglish
          ? "Profile image reset to default!"
          : "تم إعادة تعيين صورة الملف الشخصي إلى الافتراضية!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUserProfile();
    } catch (error) {
      console.error("Error resetting image:", error);
      console.error("Error details:", error.response?.data);
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? "Failed to reset profile image"
            : "فشل إعادة تعيين صورة الملف الشخصي")
      );
    } finally {
      setUploading(false);
    }
  };

  // Add this function at the component level to handle username focus
  const handleUsernameFocus = () => {
    // Only clear if it's showing the original placeholder
    if (inputUserName === "" || inputUserName === userName) {
      setInputUserName("");
    }
  };

  // Add a handleUsernameBlur function to handle when the user clicks away
  const handleUsernameBlur = () => {
    // If the field is empty when user clicks away, restore the original username
    if (inputUserName === "") {
      setInputUserName(""); // Keep it empty, but the placeholder will show
    }
  };

  // Add this function to validate URLs
  const validateSocialMediaUrl = (url, platform) => {
    if (!url) return true; // Empty URLs are valid (not provided)

    // Basic URL validation pattern
    const urlPattern =
      /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

    // Platform-specific validation can be added here
    const platformPatterns = {
      discord:
        /^(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+$/,
      instagram:
        /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_\.-]+\/?(\?.*)?$/,
      twitter:
        /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+(\?[\w\d=&]+)?$/,
      tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9_\.]+\/?$/,
      youtube:
        /^(https?:\/\/)?(www\.)?(youtube\.com\/(c\/|channel\/|@)?|youtu\.be\/)[a-zA-Z0-9_\-]+$/,
    };

    if (platformPatterns[platform] && !platformPatterns[platform].test(url)) {
      return false;
    }

    return urlPattern.test(url);
  };

  const handleSocialMediaChange = (platform, value) => {
    setSocialAccounts({
      ...socialAccounts,
      [platform]: { ...socialAccounts[platform], value },
    });

    // Clear validation error when user starts typing
    if (validationErrors[platform]) {
      setValidationErrors({
        ...validationErrors,
        [platform]: null,
      });
    }
  };

  const handleSaveSocialMedia = async () => {
    // Validate all social media URLs
    const errors = {};
    let hasErrors = false;

    Object.keys(socialAccounts).forEach((platform) => {
      if (
        socialAccounts[platform].value &&
        !validateSocialMediaUrl(socialAccounts[platform].value, platform)
      ) {
        errors[platform] = isEnglish
          ? `Invalid ${platform} URL format`
          : `تنسيق رابط ${platform} غير صالح`;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    setSavingSocialMedia(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      // Include all social media accounts that have values, including LinkedIn
      const socialMediaData = {};
      Object.keys(socialAccounts).forEach((platform) => {
        if (socialAccounts[platform].value) {
          // Map 'linkedin' to 'linkedIn' for the API
          const apiKey = platform === "linkedin" ? "linkedIn" : platform;
          socialMediaData[apiKey] = socialAccounts[platform].value;
        }
      });

      await axios.post(
        `${apiUrl}/user/change-socialmedia-links`,
        socialMediaData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update linked status for accounts with values
      const updatedSocialAccounts = { ...socialAccounts };
      Object.keys(socialAccounts).forEach((platform) => {
        updatedSocialAccounts[platform].linked =
          !!socialAccounts[platform].value;
      });
      setSocialAccounts(updatedSocialAccounts);

      setSuccessMessage(
        isEnglish
          ? "Social media links updated successfully!"
          : "تم تحديث روابط وسائل التواصل الاجتماعي بنجاح!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating social media links:", error);
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? "Failed to update social media links"
            : "فشل في تحديث روابط وسائل التواصل الاجتماعي")
      );
    } finally {
      setSavingSocialMedia(false);
    }
  };

  // Password validation and change functions
  const getPasswordStrength = () => {
    let strength = 0;

    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++; // Special character check

    return strength;
  };

  const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();

    if (strength === 0) return isEnglish ? "Very weak" : "ضعيفة جداً";
    if (strength === 1) return isEnglish ? "Weak" : "ضعيفة";
    if (strength === 2) return isEnglish ? "Medium" : "متوسطة";
    if (strength === 3) return isEnglish ? "Strong" : "قوية";
    if (strength === 4 || strength === 5)
      return isEnglish ? "Very strong" : "قوية جداً";
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();

    if (strength === 0) return "#ff4444";
    if (strength === 1) return "#ffbb33";
    if (strength === 2) return "#ffbb33";
    if (strength === 3) return "#00C851";
    if (strength === 4 || strength === 5) return "#00D8C8";
  };

  const isPasswordChangeValid = () => {
    return (
      currentPassword.length > 0 &&
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword) // Special character check
    );
  };

  const handlePasswordChange = async () => {
    if (!isPasswordChangeValid()) return;

    setChangingPassword(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.post(
        `${apiUrl}/user/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");

      // Show success message
      setSuccessMessage(
        isEnglish
          ? "Password changed successfully!"
          : "تم تغيير كلمة المرور بنجاح!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      logout();
    } catch (error) {
      console.error("Error changing password:", error);
      setError(
        error.response?.data?.message ||
          (isEnglish
            ? "Failed to change password. Please check your current password and try again."
            : "فشل تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية والمحاولة مرة أخرى.")
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      {initialLoading || loading ? (
        <LoadingPage />
      ) : (
        <div
          dir={isEnglish ? "ltr" : "rtl"}
          className="pt-40 px-4 sm:px-10 max-w-[2000px] mx-auto pb-10"
        >
          <div className="flex items-center gap-3 sm:gap-5">
            <div>
              {contextProfileImage ? (
                // Use regular img tag for remote URLs
                <img
                  className="rounded-full w-16 h-16 sm:w-[88px] sm:h-[88px] object-cover"
                  src={contextProfileImage}
                  alt="profile"
                  onError={(e) => {
                    e.target.src = "/icon1.png"; // Fallback to default if remote image fails
                  }}
                />
              ) : (
                // Use Next.js Image for local images only
                <Image
                  className="rounded-full w-16 h-16 sm:w-[88px] sm:h-[88px]"
                  src="/icon1.png"
                  alt="profile"
                  width={88}
                  height={88}
                />
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-semibold ">
                {userName}
              </h1>
              <p className="text-xl sm:text-3xl font-semibold">
                {isEnglish ? "Beginner" : "مبتدئ"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-8 sm:mt-16">
            {socialAccounts.tiktok.linked && (
              <a
                href={socialAccounts.tiktok.value}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent shadow-inner shadow-[#FE2C55] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0 hover:scale-105 transition-transform duration-300"
                style={{ boxShadow: "0px -1.5px 20px 0px #FE2C55 inset" }}
              >
                <span className={`text-white font-medium ${inter.className}`}>
                  TikTok
                </span>
                <FaTiktok className={`text-white`} />
              </a>
            )}

            {socialAccounts.linkedin.linked && (
              <a
                href={socialAccounts.linkedin.value}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent shadow-inner shadow-[#0A66C2] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0 hover:scale-105 transition-transform duration-300"
                style={{ boxShadow: "0px -1.5px 20px 0px #0A66C2 inset" }}
              >
                <span className={`text-white font-medium ${inter.className}`}>
                  LinkedIn
                </span>
                <FaLinkedin className={`text-white text-lg`} />
              </a>
            )}

            {socialAccounts.instagram.linked && (
              <a
                href={socialAccounts.instagram.value}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0 hover:scale-105 transition-transform duration-300"
                style={{
                  boxShadow:
                    "0px 5px 15px 0px #BA339F inset, 2px -1px 30px 0px #E0AF47 inset",
                }}
              >
                <span className={`text-white font-medium ${inter.className}`}>
                  Instagram
                </span>
                <FaInstagram className={`text-white text-lg`} />
              </a>
            )}

            {socialAccounts.youtube.linked && (
              <a
                href={socialAccounts.youtube.value}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent shadow-inner shadow-[#FF0000] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0 hover:scale-105 transition-transform duration-300"
                style={{ boxShadow: "0px -1.5px 20px 0px #FF0000 inset" }}
              >
                <span className={`text-white font-medium ${inter.className}`}>
                  Youtube
                </span>
                <FaYoutube className={`text-white text-lg`} />
              </a>
            )}

            {socialAccounts.discord.linked && (
              <a
                href={socialAccounts.discord.value}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent shadow-inner shadow-[#5865F2] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0 hover:scale-105 transition-transform duration-300"
                style={{ boxShadow: "0px -1.5px 20px 0px #5865F2 inset" }}
              >
                <span className={`text-white font-medium ${inter.className}`}>
                  Discord
                </span>
                <FaDiscord className={`text-[#5865F2] text-lg`} />
              </a>
            )}

            {socialAccounts.twitter.linked && (
              <a
                href={socialAccounts.twitter.value}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent shadow-inner shadow-[#000000] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0 hover:scale-105 transition-transform duration-300"
                style={{ boxShadow: "0px -1.5px 20px 0px #000000 inset" }}
              >
                <span className={`text-white font-medium ${inter.className}`}>
                  Twitter X
                </span>
                <BsTwitterX className={`text-white text-lg`} />
              </a>
            )}
          </div>
          {/* Personal Information Section */}
          <div className="bg-[#131619] rounded-xl p-[64px] mt-8 sm:mt-16">
            <h2
              className={`text-2xl font-semibold mb-6 ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              {isEnglish ? "Personal Information" : "المعلومات الشخصية"}
            </h2>

            <div className="flex items-center gap-4 mb-8">
              <div className="relative w-24 h-24">
                {selectedImageFile ? (
                  // Show the locally selected image when available
                  <img
                    src={profileImage}
                    alt="profile"
                    className="rounded-full w-full h-full object-cover"
                  />
                ) : contextProfileImage ? (
                  // Show the profile image from context when no local selection
                  <img
                    src={contextProfileImage}
                    alt="profile"
                    className="rounded-full w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/icon1.png"; // Fallback to default if remote image fails
                    }}
                  />
                ) : (
                  // Fallback to default image
                  <Image
                    src="/icon1.png"
                    alt="profile"
                    className="rounded-full w-full h-full object-cover"
                    width={96}
                    height={96}
                  />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-[#00D8C8] border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {!selectedImageFile && (
                    <div className="flex items-center gap-[16px]">
                      <button
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className="bg-[#00D8C8] cursor-pointer text-black font-bold hover:shadow-[0px_0px_15px_0px_#00D8C8] transition-all duration-300 px-5 py-2 rounded-md text-sm"
                      >
                        {isEnglish ? "Choose Image" : " رفع صورة"}
                      </button>

                      <button
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        className="bg-transparent cursor-pointer border-2 border-red-500 text-white hover:shadow-[0px_0px_15px_0px_#ff0000] transition-all duration-300 px-5 py-2 rounded-md text-sm"
                      >
                        {isEnglish ? "Delete" : " إزالة"}
                      </button>
                    </div>
                  )}
                  {selectedImageFile && (
                    <>
                      <button
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className="bg-[#00D8C8] text-black font-bold hover:shadow-[0px_0px_15px_0px_#00D8C8] transition-all duration-300 px-5 py-2 rounded-md text-sm"
                      >
                        {isEnglish ? "Choose Image" : " تعديل الصورة"}
                      </button>
                      <button
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        className="bg-transparent border-2 border-red-500 text-white hover:shadow-[0px_0px_15px_0px_#ff0000] transition-all duration-300 px-5 py-2 rounded-md text-sm"
                      >
                        {isEnglish ? "Remove" : "إزالة"}
                      </button>
                    </>
                  )}
                </div>
                {selectedImageFile && (
                  <button
                    onClick={handleUploadImage}
                    disabled={uploading}
                    className="bg-[#00D8C8] cursor-pointer text-black font-bold hover:shadow-[0px_0px_15px_0px_#00D8C8] transition-all duration-300 px-5 py-2 rounded-md text-sm mt-2"
                  >
                    {uploading
                      ? isEnglish
                        ? "Uploading..."
                        : "جاري الرفع..."
                      : isEnglish
                      ? "Upload Image"
                      : "رفع الصورة"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:gap-x-[238px] lg:gap-y-[56px] md:gap-10 ">
              <div className="flex flex-col">
                <label
                  className={` ${isEnglish ? "text-left" : "text-right"} mb-2`}
                >
                  {isEnglish ? "Username" : "اسم المستخدم"}
                </label>
                <input
                  type="text"
                  value={inputUserName}
                  onChange={(e) => setInputUserName(e.target.value)}
                  onFocus={handleUsernameFocus}
                  onBlur={handleUsernameBlur}
                  placeholder={userName || ""}
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="bg-[#0B0D0F] rounded-xl p-3 text-right w-full focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300 text-white placeholder-gray-500"
                  style={{ textAlign: isEnglish ? "left" : "right" }}
                />
              </div>

              <div className="flex flex-col">
                <label
                  className={` ${isEnglish ? "text-left" : "text-right"} mb-2`}
                >
                  {isEnglish ? "Email" : "البريد الإلكتروني"}
                </label>
                <div className="relative w-full">
                  {editingEmail ? (
                    <div className="flex flex-col w-full">
                      <div className="flex gap-2 w-full">
                        <input
                          type="email"
                          value={newEmail}
                          dir={isEnglish ? "ltr" : "rtl"}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="bg-[#0B0D0F]  rounded-xl  p-3 text-right w-full focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300"
                          style={{ textAlign: isEnglish ? "left" : "right" }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleEmailUpdate}
                            className="bg-[#00D8C8] text-black rounded-xl font-bold px-4 hover:shadow-[0px_0px_15px_0px_#00D8C8] transition-all duration-300"
                          >
                            {isEnglish ? "Save" : "حفظ"}
                          </button>
                          <button
                            onClick={cancelEmailEdit}
                            className="text-red-500 border-2 border-red-500 font-bold px-4 rounded-xl hover:shadow-[0px_0px_15px_0px_#ff0000] transition-all duration-300"
                          >
                            {isEnglish ? "Cancel" : "الغاء"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <input
                        type="email"
                        placeholder={email}
                        className="bg-[#0B0D0F] rounded-xl p-3 text-right pr-12 w-full focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300"
                        readOnly
                        style={{ textAlign: isEnglish ? "left" : "right" }}
                      />
                      <button
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-[#00D8C8] transition-colors"
                        onClick={() => {
                          setNewEmail("");
                          setEditingEmail(true);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label
                  className={` ${isEnglish ? "text-left" : "text-right"} mb-2`}
                >
                  {isEnglish ? "Country" : "البلد"}
                </label>
                <CountrySelect
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  customStyles={countrySelectStyles}
                  isEnglish={isEnglish}
                  placeholder={isEnglish ? "Select Country" : "البلد"}
                />
              </div>

              <div className="flex flex-col">
                <label
                  className={` ${isEnglish ? "text-left" : "text-right"} mb-2`}
                >
                  {isEnglish ? "Timezone" : "المنطقة الزمنية"}
                </label>
                <Select
                  options={timeZones}
                  value={
                    timeZones.find((zone) => zone.value === selectedTimeZone) ||
                    null
                  }
                  onChange={(option) => setSelectedTimeZone(option.value)}
                  styles={timeZoneSelectStyles}
                  placeholder={
                    isEnglish ? "Select Timezone" : "المنطقة الزمنية"
                  }
                  className="timezone-select"
                />
              </div>
            </div>

            <div className="flex justify-end mt-[136px]">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={savingProfile || !hasChanges}
                className={`${
                  hasChanges && !savingProfile
                    ? "bg-[#00D8C8] text-black hover:shadow-[0px_0px_15px_0px_#00D8C8] cursor-pointer"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
                } font-bold transition-all duration-300 px-8 py-2 rounded-md`}
              >
                {savingProfile
                  ? isEnglish
                    ? "Saving..."
                    : "جاري الحفظ..."
                  : isEnglish
                  ? "Save Profile Changes"
                  : "حفظ التغييرات"}
              </button>
            </div>
          </div>

          {/* Social Media Connections Section */}
          <div className="bg-[#131619] rounded-xl p-6 mt-8">
            <h2
              className={`text-2xl font-semibold mb-6 ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              {isEnglish ? "Connect Your Platforms" : "اتصل بمنصاتك"}
            </h2>

            <div className="space-y-6">
              {/* Discord */}
              <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-3">
                <button
                  className={`px-6 py-2 rounded-md text-sm font-medium w-full sm:w-28 ${
                    socialAccounts.discord.linked
                      ? "bg-[#1E2124] text-white cursor-pointer"
                      : "bg-[#00D8C8] text-black hover:shadow-[0px_0px_15px_0px_#00D8C8] cursor-pointer"
                  } transition-all duration-300`}
                  onClick={() =>
                    socialAccounts.discord.linked
                      ? handleUnlinkAccount("discord")
                      : handleLinkAccount("discord")
                  }
                  disabled={
                    socialAccounts.discord.linking ||
                    socialAccounts.discord.unlinking
                  }
                >
                  {socialAccounts.discord.linking ||
                  socialAccounts.discord.unlinking ? (
                    <span className="flex gap-2 items-center justify-center">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEnglish ? "Loading" : "جاري"}
                    </span>
                  ) : socialAccounts.discord.linked ? (
                    isEnglish ? (
                      "Unlink"
                    ) : (
                      "إلغاء الربط"
                    )
                  ) : isEnglish ? (
                    "Link"
                  ) : (
                    "ربط"
                  )}
                </button>

                <div className="flex-1 mx-0 sm:mx-4 w-full">
                  <input
                    type="text"
                    value={socialAccounts.discord.value}
                    dir={isEnglish ? "ltr" : "rtl"}
                    onChange={(e) =>
                      handleSocialMediaChange("discord", e.target.value)
                    }
                    className={`bg-[#0B0D0F] rounded-xl p-3 w-full lg:w-1/2 text-right focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] border ${
                      validationErrors.discord
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-transparent"
                    } transition-all duration-300`}
                    placeholder={
                      !socialAccounts.discord.value
                        ? isEnglish
                          ? "Your Discord account link"
                          : "رابط حسابك في ديسكورد"
                        : ""
                    }
                    style={{ textAlign: isEnglish ? "left" : "right" }}
                  />
                  {validationErrors.discord && (
                    <p className="text-red-500 text-xs mt-1 text-right">
                      {validationErrors.discord}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 items-center justify-center order-first sm:order-none">
                  <Image
                    src="/discord.png"
                    alt="discord"
                    width={30}
                    height={30}
                  />
                  <Image
                    src={
                      socialAccounts.discord.linked
                        ? "/linked.png"
                        : "/unlinked.png"
                    }
                    alt="connection status"
                    width={20}
                    height={20}
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-3">
                <button
                  className={`px-6 py-2 rounded-md text-sm font-medium w-full sm:w-28 ${
                    socialAccounts.linkedin.linked
                      ? "bg-[#1E2124] text-white cursor-pointer"
                      : "bg-[#00D8C8] text-black hover:shadow-[0px_0px_15px_0px_#00D8C8] cursor-pointer"
                  } transition-all duration-300`}
                  onClick={() =>
                    socialAccounts.linkedin.linked
                      ? handleUnlinkAccount("linkedin")
                      : handleLinkAccount("linkedin")
                  }
                  disabled={
                    socialAccounts.linkedin.linking ||
                    socialAccounts.linkedin.unlinking
                  }
                >
                  {socialAccounts.linkedin.linking ||
                  socialAccounts.linkedin.unlinking ? (
                    <span className="flex gap-2 items-center justify-center">
                      <svg
                        className="animate-spin  h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEnglish ? "Loading" : "جاري"}
                    </span>
                  ) : socialAccounts.linkedin.linked ? (
                    isEnglish ? (
                      "Unlink"
                    ) : (
                      "إلغاء الربط"
                    )
                  ) : isEnglish ? (
                    "Link"
                  ) : (
                    "ربط"
                  )}
                </button>

                <div className="flex-1 mx-0 sm:mx-4 w-full">
                  <input
                    type="text"
                    value={socialAccounts.linkedin.value}
                    onChange={(e) =>
                      handleSocialMediaChange("linkedin", e.target.value)
                    }
                    className={`bg-[#0B0D0F] rounded-xl p-3 w-full lg:w-1/2 text-right focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] border ${
                      validationErrors.linkedin
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-transparent"
                    } transition-all duration-300`}
                    placeholder={
                      isEnglish
                        ? "Your LinkedIn account link"
                        : "رابط حسابك في لينكد إن"
                    }
                    dir="ltr"
                    style={{ textAlign: isEnglish ? "left" : "right" }}
                  />
                  {validationErrors.linkedin && (
                    <p className="text-red-500 text-xs mt-1 text-right">
                      {validationErrors.linkedin}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 items-center justify-center order-first sm:order-none">
                  <Image
                    src="/linkedin.png"
                    alt="linkedin"
                    width={30}
                    height={30}
                  />
                  <Image
                    src={
                      socialAccounts.linkedin.linked
                        ? "/linked.png"
                        : "/unlinked.png"
                    }
                    alt="connection status"
                    width={20}
                    height={20}
                  />
                </div>
              </div>

              {/* Instagram */}
              <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-3">
                <button
                  className={`px-6 py-2 rounded-md text-sm font-medium w-full sm:w-28 ${
                    socialAccounts.instagram.linked
                      ? "bg-[#1E2124] text-white cursor-pointer"
                      : "bg-[#00D8C8] text-black hover:shadow-[0px_0px_15px_0px_#00D8C8] cursor-pointer"
                  } transition-all duration-300`}
                  onClick={() =>
                    socialAccounts.instagram.linked
                      ? handleUnlinkAccount("instagram")
                      : handleLinkAccount("instagram")
                  }
                  disabled={
                    socialAccounts.instagram.linking ||
                    socialAccounts.instagram.unlinking
                  }
                >
                  {socialAccounts.instagram.linking ||
                  socialAccounts.instagram.unlinking ? (
                    <span className="flex gap-2 items-center justify-center">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEnglish ? "Loading" : "جاري"}
                    </span>
                  ) : socialAccounts.instagram.linked ? (
                    isEnglish ? (
                      "Unlink"
                    ) : (
                      "إلغاء الربط"
                    )
                  ) : isEnglish ? (
                    "Link"
                  ) : (
                    "ربط"
                  )}
                </button>

                <div className="flex-1 mx-0 sm:mx-4 w-full">
                  <input
                    type="text"
                    value={socialAccounts.instagram.value}
                    onChange={(e) =>
                      handleSocialMediaChange("instagram", e.target.value)
                    }
                    className={`bg-[#0B0D0F] rounded-xl p-3 w-full lg:w-1/2 text-right focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] border ${
                      validationErrors.instagram
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-transparent"
                    } transition-all duration-300`}
                    placeholder={
                      !socialAccounts.instagram.value
                        ? isEnglish
                          ? "Your Instagram account link"
                          : "رابط حسابك في انستغرام"
                        : ""
                    }
                    dir="ltr"
                    style={{ textAlign: isEnglish ? "left" : "right" }}
                  />
                  {validationErrors.instagram && (
                    <p className="text-red-500 text-xs mt-1 text-right">
                      {validationErrors.instagram}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 items-center justify-center order-first sm:order-none">
                  <Image
                    src="/instgram-1.png"
                    alt="instagram"
                    width={30}
                    height={30}
                  />
                  <Image
                    src={
                      socialAccounts.instagram &&
                      socialAccounts.instagram.linked
                        ? "/linked.png"
                        : "/unlinked.png"
                    }
                    alt="connection status"
                    width={20}
                    height={20}
                  />
                </div>
              </div>

              {/* TikTok */}
              <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-3">
                <button
                  className={`px-6 py-2 rounded-md text-sm font-medium w-full sm:w-28 ${
                    socialAccounts.tiktok.linked
                      ? "bg-[#1E2124] text-white cursor-pointer"
                      : "bg-[#00D8C8] text-black hover:shadow-[0px_0px_15px_0px_#00D8C8] cursor-pointer"
                  } transition-all duration-300`}
                  onClick={() =>
                    socialAccounts.tiktok.linked
                      ? handleUnlinkAccount("tiktok")
                      : handleLinkAccount("tiktok")
                  }
                  disabled={
                    socialAccounts.tiktok.linking ||
                    socialAccounts.tiktok.unlinking
                  }
                >
                  {socialAccounts.tiktok.linking ||
                  socialAccounts.tiktok.unlinking ? (
                    <span className="flex gap-2 items-center justify-center">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEnglish ? "Loading" : "جاري"}
                    </span>
                  ) : socialAccounts.tiktok.linked ? (
                    isEnglish ? (
                      "Unlink"
                    ) : (
                      "إلغاء الربط"
                    )
                  ) : isEnglish ? (
                    "Link"
                  ) : (
                    "ربط"
                  )}
                </button>

                <div className="flex-1 mx-0 sm:mx-4 w-full">
                  <input
                    type="text"
                    value={socialAccounts.tiktok.value}
                    onChange={(e) =>
                      handleSocialMediaChange("tiktok", e.target.value)
                    }
                    className={`bg-[#0B0D0F] rounded-xl p-3 w-full text-right lg:w-1/2 focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] border ${
                      validationErrors.tiktok
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-transparent"
                    } transition-all duration-300`}
                    placeholder={
                      !socialAccounts.tiktok.value
                        ? isEnglish
                          ? "Your TikTok account link"
                          : "رابط حسابك في تيك توك"
                        : ""
                    }
                    dir="ltr"
                    style={{ textAlign: isEnglish ? "left" : "right" }}
                  />
                  {validationErrors.tiktok && (
                    <p className="text-red-500 text-xs mt-1 text-right">
                      {validationErrors.tiktok}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 items-center justify-center order-first sm:order-none">
                  <Image
                    src="/tiktok.png"
                    alt="tiktok"
                    width={30}
                    height={30}
                  />
                  <Image
                    src={
                      socialAccounts.tiktok.linked
                        ? "/linked.png"
                        : "/unlinked.png"
                    }
                    alt="connection status"
                    width={20}
                    height={20}
                  />
                </div>
              </div>

              {/* YouTube */}
              <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-3">
                <button
                  className={`px-6 py-2 rounded-md text-sm font-medium w-full sm:w-28 ${
                    socialAccounts.youtube.linked
                      ? "bg-[#1E2124] text-white cursor-pointer"
                      : "bg-[#00D8C8] text-black hover:shadow-[0px_0px_15px_0px_#00D8C8] cursor-pointer"
                  } transition-all duration-300`}
                  onClick={() =>
                    socialAccounts.youtube.linked
                      ? handleUnlinkAccount("youtube")
                      : handleLinkAccount("youtube")
                  }
                  disabled={
                    socialAccounts.youtube.linking ||
                    socialAccounts.youtube.unlinking
                  }
                >
                  {socialAccounts.youtube.linking ||
                  socialAccounts.youtube.unlinking ? (
                    <span className="flex gap-2 items-center justify-center">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEnglish ? "Loading" : "جاري"}
                    </span>
                  ) : socialAccounts.youtube.linked ? (
                    isEnglish ? (
                      "Unlink"
                    ) : (
                      "إلغاء الربط"
                    )
                  ) : isEnglish ? (
                    "Link"
                  ) : (
                    "ربط"
                  )}
                </button>

                <div className="flex-1 mx-0 sm:mx-4 w-full">
                  <input
                    type="text"
                    value={socialAccounts.youtube.value}
                    onChange={(e) =>
                      handleSocialMediaChange("youtube", e.target.value)
                    }
                    className={`bg-[#0B0D0F] rounded-xl p-3 w-full text-right lg:w-1/2 focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] border ${
                      validationErrors.youtube
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-transparent"
                    } transition-all duration-300`}
                    placeholder={
                      !socialAccounts.youtube.value
                        ? isEnglish
                          ? "Your YouTube account link"
                          : "رابط حسابك في يوتيوب"
                        : ""
                    }
                    dir="ltr"
                    style={{ textAlign: isEnglish ? "left" : "right" }}
                  />
                  {validationErrors.youtube && (
                    <p className="text-red-500 text-xs mt-1 text-right">
                      {validationErrors.youtube}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 items-center justify-center order-first sm:order-none">
                  <Image
                    src="/youtube.png"
                    alt="youtube"
                    width={30}
                    height={30}
                  />
                  <Image
                    src={
                      socialAccounts.youtube.linked
                        ? "/linked.png"
                        : "/unlinked.png"
                    }
                    alt="connection status"
                    width={20}
                    height={20}
                  />
                </div>
              </div>

              {/* Twitter X */}
              <div className="flex flex-col sm:flex-row-reverse items-start sm:items-center justify-between gap-3">
                <button
                  className={`px-6 py-2 rounded-md text-sm font-medium w-full sm:w-28 ${
                    socialAccounts.twitter.linked
                      ? "bg-[#1E2124] text-white cursor-pointer"
                      : "bg-[#00D8C8] text-black hover:shadow-[0px_0px_15px_0px_#00D8C8] cursor-pointer"
                  } transition-all duration-300`}
                  onClick={() =>
                    socialAccounts.twitter.linked
                      ? handleUnlinkAccount("twitter")
                      : handleLinkAccount("twitter")
                  }
                  disabled={
                    socialAccounts.twitter.linking ||
                    socialAccounts.twitter.unlinking
                  }
                >
                  {socialAccounts.twitter.linking ||
                  socialAccounts.twitter.unlinking ? (
                    <span className="flex gap-2 items-center justify-center">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEnglish ? "Loading" : "جاري"}
                    </span>
                  ) : socialAccounts.twitter.linked ? (
                    isEnglish ? (
                      "Unlink"
                    ) : (
                      "إلغاء الربط"
                    )
                  ) : isEnglish ? (
                    "Link"
                  ) : (
                    "ربط"
                  )}
                </button>

                <div className="flex-1 mx-0 sm:mx-4 w-full">
                  <input
                    type="text"
                    value={socialAccounts.twitter.value}
                    onChange={(e) =>
                      handleSocialMediaChange("twitter", e.target.value)
                    }
                    className={`bg-[#0B0D0F] rounded-xl p-3 w-full text-right lg:w-1/2 focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] border ${
                      validationErrors.twitter
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-transparent"
                    } transition-all duration-300`}
                    placeholder={
                      !socialAccounts.twitter.value
                        ? isEnglish
                          ? "Your Twitter X account link"
                          : "رابط حسابك في تويتر"
                        : ""
                    }
                    dir="ltr"
                    style={{ textAlign: isEnglish ? "left" : "right" }}
                  />
                  {validationErrors.twitter && (
                    <p className="text-red-500 text-xs mt-1 text-right">
                      {validationErrors.twitter}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 items-center justify-center order-first sm:order-none">
                  <Image
                    src="/twitter.png"
                    alt="twitter"
                    width={30}
                    height={30}
                  />
                  <Image
                    src={
                      socialAccounts.twitter.linked
                        ? "/linked.png"
                        : "/unlinked.png"
                    }
                    alt="connection status"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* OTP Verification Popup */}
          {showOtpPopup && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-[#131619] rounded-2xl p-6 sm:p-8 md:p-10 max-w-md w-full">
                <h2 className="text-white text-xl sm:text-2xl font-bold text-center mb-6">
                  {isEnglish
                    ? "Verify Email Change"
                    : "تأكيد تغيير البريد الإلكتروني"}
                </h2>

                <div className="mb-6">
                  <div
                    className="bg-[#1A2025] border border-[#38FFE5] text-center text-white px-4 py-3 rounded-xl relative"
                    role="alert"
                  >
                    <span className="block sm:inline text-center">
                      {emailOtpMessage}
                    </span>
                  </div>
                </div>

                <p className="text-white text-center mb-6">
                  {isEnglish
                    ? `Please enter the OTP sent to ${newEmail}. It expires in ${Math.floor(
                        emailOtpExpiry / 60
                      )} minutes.`
                    : `الرجاء إدخال رمز التحقق المرسل إلى ${newEmail}. ينتهي في ${Math.floor(
                        emailOtpExpiry / 60
                      )} دقائق.`}
                </p>

                <form
                  onSubmit={handleOtpSubmit}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-4">
                    <label className="text-white text-sm sm:text-base font-normal text-center">
                      {isEnglish ? "OTP Code" : "رمز التحقق"}
                    </label>

                    <div
                      dir="ltr"
                      className="flex justify-center gap-2 sm:gap-4"
                      onPaste={handlePaste}
                    >
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center bg-[#0B0D0F] text-white text-xl font-bold rounded-lg border-2 border-gray-700 focus:border-[#38FFE5] focus:outline-none"
                        />
                      ))}
                    </div>

                    <p className="text-gray-400 text-xs text-center mt-2">
                      {isEnglish
                        ? "You can paste the full 6-digit code"
                        : "يمكنك لصق الرمز المكون من 6 أرقام"}
                    </p>
                  </div>

                  {error && (
                    <p className="text-red-500 text-center text-sm">{error}</p>
                  )}

                  <div className="flex gap-4 mt-4">
                    <button
                      type="submit"
                      disabled={verifyingOtp || otp.join("").length !== 6}
                      className={`flex-1 ${
                        otp.join("").length === 6 && !verifyingOtp
                          ? "bg-[#38FFE5] hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] text-black"
                          : "bg-gray-700 text-gray-300 cursor-not-allowed"
                      } transition-all duration-300 font-bold py-2.5 sm:py-3 rounded-xl flex items-center justify-center`}
                    >
                      {verifyingOtp ? (
                        <>
                          <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>
                            {isEnglish ? "Verifying..." : "جاري التحقق..."}
                          </span>
                        </>
                      ) : (
                        <span>
                          {isEnglish ? "Verify OTP" : "تحقق من الرمز"}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpPopup(false);
                        setOtp(["", "", "", "", "", ""]);
                        setError("");
                      }}
                      className="flex-1 border-2 border-red-500 text-white hover:shadow-[0px_0px_15px_0px_red] transition-all duration-300 font-bold py-2.5 sm:py-3 rounded-xl"
                    >
                      {isEnglish ? "Cancel" : "إلغاء"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div
              className={`fixed bottom-8 ${
                isEnglish ? "left-8" : "right-8"
              } max-w-md px-4 z-50 transition-all duration-300 animate-fade-in-up`}
            >
              <div className="bg-[#1A2025] border border-[#38FFE5] text-center text-white px-4 py-3 rounded-xl shadow-lg">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Password Change Section */}
          <div className="bg-[#131619] rounded-xl p-[64px] mt-[64px]">
            <h2
              className={`text-2xl font-semibold mb-6 ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              {isEnglish ? "Change Password" : "تغيير كلمة المرور"}
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:gap-x-[238px] gap-10 ">
                {/* Current Password */}
                <div className="flex flex-col">
                  <label
                    className={` ${
                      isEnglish ? "text-left" : "text-right"
                    } mb-2`}
                  >
                    {isEnglish ? "Current Password" : "كلمة المرور الحالية"}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-[#0B0D0F] rounded-xl p-3 text-left w-full focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300"
                      placeholder={
                        isEnglish
                          ? "Enter current password"
                          : "أدخل كلمة المرور الحالية"
                      }
                      dir="ltr"
                      style={{ textAlign: "left" }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-[#00D8C8] transition-colors"
                    >
                      {showCurrentPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col">
                  <label
                    className={` ${
                      isEnglish ? "text-left" : "text-right"
                    } mb-2`}
                  >
                    {isEnglish ? "New Password" : "كلمة المرور الجديدة"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[#0B0D0F] rounded-xl p-3 text-left w-full focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300"
                      placeholder={
                        isEnglish
                          ? "Enter new password"
                          : "أدخل كلمة المرور الجديدة"
                      }
                      dir="ltr"
                      style={{ textAlign: "left" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-[#00D8C8] transition-colors"
                    >
                      {showNewPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter and Requirements */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex justify-between mt-2">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">
                          {isEnglish
                            ? "Password strength:"
                            : "قوة كلمة المرور:"}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: getPasswordStrengthColor() }}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${getPasswordStrength() * 20}%`,
                            backgroundColor: getPasswordStrengthColor(),
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <ul className="text-xs text-gray-400 mt-2 space-y-1 mr-4">
                    {newPassword.length < 8 && (
                      <li className="text-yellow-500">
                        {isEnglish
                          ? "• Password must be at least 8 characters"
                          : "• كلمة المرور يجب أن تكون على الأقل 8 أحرف"}
                      </li>
                    )}
                    {!/[A-Z]/.test(newPassword) && (
                      <li className="text-yellow-500">
                        {isEnglish
                          ? "• Include at least one uppercase letter"
                          : "• يجب أن تحتوي على حرف كبير واحد على الأقل"}
                      </li>
                    )}
                    {!/[a-z]/.test(newPassword) && (
                      <li className="text-yellow-500">
                        {isEnglish
                          ? "• Include at least one lowercase letter"
                          : "• يجب أن تحتوي على حرف صغير واحد على الأقل"}
                      </li>
                    )}
                    {!/[0-9]/.test(newPassword) && (
                      <li className="text-yellow-500">
                        {isEnglish
                          ? "• Include at least one number"
                          : "• يجب أن تحتوي على رقم واحد على الأقل"}
                      </li>
                    )}
                    {!/[^A-Za-z0-9]/.test(newPassword) && (
                      <li className="text-yellow-500">
                        {isEnglish
                          ? "• Include at least one special character"
                          : "• يجب أن تحتوي على رمز خاص واحد على الأقل"}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-end mt-[135px]  ">
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !isPasswordChangeValid()}
                  className={`${
                    isPasswordChangeValid() && !changingPassword
                      ? "bg-[#00D8C8] text-black hover:shadow-[0px_0px_15px_0px_#00D8C8] cursor-pointer"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
                  } font-bold transition-all duration-300 px-8 py-2 rounded-md`}
                >
                  {changingPassword
                    ? isEnglish
                      ? "Changing..."
                      : "جاري التغيير..."
                    : isEnglish
                    ? "Change Password"
                    : "تغيير كلمة المرور"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
