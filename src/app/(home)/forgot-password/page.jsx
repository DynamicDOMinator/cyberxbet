"use client";

import Link from "next/link";
import Logo from "@/app/components/Logo";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useLanguage } from "@/app/context/LanguageContext";
import LoadingPage from "@/app/components/LoadingPage";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: New Password
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Replace with this improved approach
  const { isEnglish, setIsEnglish } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);

  // Add these new state variables for OTP inputs
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const otpRefs = Array(6)
    .fill(0)
    .map(() => useRef(null));

  const toggleLanguage = () => {
    setIsEnglish(!isEnglish);
  };

  // Add this useEffect to control rendering
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Load reCAPTCHA v3
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=6Ldx3eYqAAAAAGgdL0IHdBAljwDlx_NcJ28HFtqc`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setRecaptchaLoaded(true);
      window.grecaptcha.ready(() => {});
    };
    script.onerror = (error) => {
      console.error("Error loading reCAPTCHA:", error);
      setError(
        isEnglish
          ? "An error occurred while loading reCAPTCHA. Please refresh the page."
          : "حدث خطأ في تحميل reCAPTCHA. يرجى تحديث الصفحة."
      );
    };
    document.head.appendChild(script);

    return () => {
      const script = document.querySelector(`script[src*="recaptcha"]`);
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, [isEnglish]);

  const validateEmail = () => {
    let isValid = true;
    if (!email.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        email: isEnglish ? "Email is required" : "البريد الإلكتروني مطلوب",
      }));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationErrors((prev) => ({
        ...prev,
        email: isEnglish
          ? "Please enter a valid email address"
          : "يرجى إدخال عنوان بريد إلكتروني صالح",
      }));
      isValid = false;
    } else {
      setValidationErrors((prev) => ({ ...prev, email: "" }));
    }
    return isValid;
  };

  // Updated handleOtpChange function to support RTL when in Arabic
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Combine OTP values for the main otp state
    setOtp(newOtpValues.join(""));

    // Auto-focus next input based on language direction
    if (value) {
      if (isEnglish) {
        // LTR direction - move right
        if (index < 5) {
          otpRefs[index + 1].current.focus();
        }
      } else {
        // RTL direction - move left
        if (index > 0) {
          otpRefs[index - 1].current.focus();
        }
      }
    }
  };

  // Updated handleOtpKeyDown to support RTL when in Arabic
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index]) {
      if (isEnglish) {
        // LTR direction - move left on backspace
        if (index > 0) {
          otpRefs[index - 1].current.focus();
        }
      } else {
        // RTL direction - move right on backspace
        if (index < 5) {
          otpRefs[index + 1].current.focus();
        }
      }
    }
  };

  // Updated handleOtpPaste function to support RTL
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    // Check if pasted content is a valid number
    if (!/^\d+$/.test(pastedData)) return;

    // Get up to 6 digits from the pasted content
    const digits = pastedData.substring(0, 6).split("");

    // Create a new array with the pasted digits
    const newOtpValues = [...otpValues];

    if (isEnglish) {
      // LTR - fill from left to right
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtpValues[i] = digits[i];
      }

      // Update state
      setOtpValues(newOtpValues);
      setOtp(newOtpValues.join(""));

      // Focus the appropriate input after pasting
      if (digits.length < 6) {
        otpRefs[Math.min(digits.length, 5)].current.focus();
      } else {
        otpRefs[5].current.focus();
      }
    } else {
      // RTL - fill from right to left
      const startIndex = 5;
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtpValues[startIndex - i] = digits[i];
      }

      // Update state
      setOtpValues(newOtpValues);
      setOtp(newOtpValues.join(""));

      // Focus the appropriate input after pasting
      if (digits.length < 6) {
        otpRefs[Math.max(0, startIndex - digits.length + 1)].current.focus();
      } else {
        otpRefs[0].current.focus();
      }
    }
  };

  const validatePassword = () => {
    let isValid = true;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!newPassword.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        newPassword: isEnglish
          ? "New password is required"
          : "كلمة المرور الجديدة مطلوبة",
      }));
      isValid = false;
    } else if (newPassword.length < 8) {
      setValidationErrors((prev) => ({
        ...prev,
        newPassword: isEnglish
          ? "Password must be at least 8 characters"
          : "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
      }));
      isValid = false;
    } else if (!passwordRegex.test(newPassword)) {
      setValidationErrors((prev) => ({
        ...prev,
        newPassword: isEnglish
          ? "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
          : "يجب أن تحتوي كلمة المرور على حرف كبير واحد وحرف صغير واحد ورقم واحد وحرف خاص واحد على الأقل",
      }));
      isValid = false;
    } else {
      setValidationErrors((prev) => ({ ...prev, newPassword: "" }));
    }

    if (!confirmPassword.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        confirmPassword: isEnglish
          ? "Please confirm your password"
          : "يرجى تأكيد كلمة المرور",
      }));
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      setValidationErrors((prev) => ({
        ...prev,
        confirmPassword: isEnglish
          ? "Passwords do not match"
          : "كلمات المرور غير متطابقة",
      }));
      isValid = false;
    } else {
      setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }

    return isValid;
  };

  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await axios.post(
        `${apiUrl}/auth/password/request-reset`,
        { email: email }
      );

      // If successful, move to OTP+Password step (skip OTP verification step)

      setStep(2); // Move directly to combined OTP + password step
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Password reset request error:", error);

      // Handle different error types
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.error("Server error:", error.response.data);
        setError(
          error.response.data.message ||
            (isEnglish
              ? "An error occurred while requesting password reset"
              : "حدث خطأ أثناء طلب إعادة تعيين كلمة المرور")
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        setError(
          isEnglish
            ? "No response from server. Please try again later."
            : "لا استجابة من الخادم. يرجى المحاولة مرة أخرى لاحقًا."
        );
      } else {
        // Something happened in setting up the request
        setError(
          isEnglish
            ? "Error setting up request. Please try again."
            : "خطأ في إعداد الطلب. يرجى المحاولة مرة أخرى."
        );
      }
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  // Keep your original verifyOtp function but modify it to just validate and move to the next step
  const verifyOtp = async () => {
    setError("");

    // Combine OTP values to ensure we have the latest
    const combinedOtp = otpValues.join("");
    setOtp(combinedOtp);

    if (combinedOtp.length !== 6 || !/^\d+$/.test(combinedOtp)) {
      setValidationErrors((prev) => ({
        ...prev,
        otp: isEnglish
          ? "Please enter a valid 6-digit OTP code"
          : "يرجى إدخال رمز تحقق صالح مكون من 6 أرقام",
      }));
      return;
    }

    // Move to new password step without making API call to verify OTP
    setStep(3);
  };

  // Modify resetPassword to use all the collected data
  const resetPassword = async () => {
    setError("");

    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Reset password with backend - sending email, OTP, and password in a single request
      await axios.post(`${API_URL}/auth/password/reset`, {
        email: email,
        otp: otp, // Use the OTP that was stored from the previous step
        password: newPassword,
      });

      // Redirect to login page with success message
      window.location.href = "/login?reset=success";
    } catch (error) {
      console.error("Password reset error:", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          (isEnglish
            ? "An error occurred. Please try again."
            : "حدث خطأ. يرجى المحاولة مرة أخرى.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function to show password requirements in the UI
  const renderPasswordRequirements = () => {
    const requirements = [
      {
        met: newPassword.length >= 8,
        text: isEnglish ? "At least 8 characters" : "8 أحرف على الأقل",
      },
      {
        met: /[A-Z]/.test(newPassword),
        text: isEnglish
          ? "At least one uppercase letter"
          : "حرف كبير واحد على الأقل",
      },
      {
        met: /[a-z]/.test(newPassword),
        text: isEnglish
          ? "At least one lowercase letter"
          : "حرف صغير واحد على الأقل",
      },
      {
        met: /\d/.test(newPassword),
        text: isEnglish ? "At least one number" : "رقم واحد على الأقل",
      },
      {
        met: /[@$!%*?&]/.test(newPassword),
        text: isEnglish
          ? "At least one special character (@$!%*?&)"
          : "حرف خاص واحد على الأقل (@$!%*?&)",
      },
    ];

    return (
      <div className="mt-2">
        <p className="text-sm text-gray-400 mb-1">
          {isEnglish ? "Password requirements:" : "متطلبات كلمة المرور:"}
        </p>
        <ul className="text-xs space-y-1">
          {requirements.map((req, index) => (
            <li
              key={index}
              className={`flex items-center gap-1 ${
                req.met ? "text-green-500" : "text-gray-400"
              }`}
            >
              {req.met ? <span>✓</span> : <span>○</span>}
              {req.text}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h1 className="text-white text-2xl sm:text-3xl md:text-[36px] lg:text-[40px] pt-8 sm:pt-12 lg:pt-2 font-extrabold font-Tajawal text-center">
              {isEnglish ? "Forgot Password" : "نسيت كلمة المرور"}
            </h1>
            <p className="text-gray-400 text-center mt-4">
              {isEnglish
                ? "Enter your email address and we'll send you a verification code"
                : "أدخل عنوان بريدك الإلكتروني وسنرسل لك رمز التحقق"}
            </p>
            <form
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20"
              onSubmit={(e) => {
                e.preventDefault();
                if (validateEmail()) {
                  requestPasswordReset(email);
                }
              }}
            >
              <div className="flex flex-col gap-1">
                <label className="text-white text-sm sm:text-base font-normal">
                  {isEnglish ? "Email Address" : "البريد الإلكتروني"}
                </label>
                <input
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  value={email}
                  className={`bg-[#0B0D0F]  py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${
                    validationErrors.email
                      ? "border-red-500"
                      : "border-transparent"
                  } transition-all duration-50 text-white rounded-xl px-3`}
                  type="email"
                />
                {validationErrors.email && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1">
                    {validationErrors.email}
                  </span>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm sm:text-base text-center mt-2 sm:mt-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !recaptchaLoaded}
                className={`bg-[#38FFE5] py-3 sm:py-4 w-full sm:w-2/3 rounded-xl mx-auto text-black text-xl sm:text-2xl font-bold hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 ${
                  loading || !recaptchaLoaded
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                } flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <BiLoaderAlt className="animate-spin text-xl sm:text-2xl" />
                    <span>{isEnglish ? "Sending..." : "جاري الإرسال..."}</span>
                  </>
                ) : !recaptchaLoaded ? (
                  isEnglish ? (
                    "Loading..."
                  ) : (
                    "جاري التحميل..."
                  )
                ) : isEnglish ? (
                  "Send Verification Code"
                ) : (
                  "إرسال رمز التحقق"
                )}
              </button>
            </form>
          </>
        );
      case 2:
        return (
          <>
            <h1 className="text-white text-2xl sm:text-3xl md:text-[36px] lg:text-[40px] pt-8 sm:pt-12 lg:pt-16 font-extrabold font-Tajawal text-center">
              {isEnglish ? "Reset Password" : "إعادة تعيين كلمة المرور"}
            </h1>
            <p
              dir={isEnglish ? "ltr" : "rtl"}
              className="text-gray-400 text-center mt-4"
            >
              {isEnglish
                ? `We've sent a 6-digit verification code to ${email}. Enter the code to continue.`
                : ` لقد أرسلنا رمز تحقق مكون من 6 أرقام إلى.${email} أدخل الرمز للمتابعة`}
            </p>
            <form
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20"
              onSubmit={(e) => {
                e.preventDefault();
                verifyOtp();
              }}
            >
              {/* OTP Input */}
              <div className="flex flex-col gap-4">
                <label className="text-white text-center text-sm sm:text-base font-normal">
                  {isEnglish ? "Verification Code" : "رمز التحقق"}
                </label>

                <div className="flex justify-center gap-2 sm:gap-4">
                  {otpValues.map((value, index) => (
                    <input
                      dir="ltr"
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 bg-black text-white text-center text-xl sm:text-2xl rounded-lg border-2 border-gray-700 focus:border-[#38FFE5] focus:outline-none"
                    />
                  ))}
                </div>

                {validationErrors.otp && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1 text-center">
                    {validationErrors.otp}
                  </span>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm sm:text-base text-center mt-2 sm:mt-4">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2 items-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-[#38FFE5] py-3 sm:py-4 w-full sm:w-2/3 rounded-xl mx-auto text-black text-xl sm:text-2xl font-bold hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  } flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-xl sm:text-2xl" />
                      <span>
                        {isEnglish ? "Verifying..." : "جاري التحقق..."}
                      </span>
                    </>
                  ) : isEnglish ? (
                    "Verify OTP"
                  ) : (
                    "تحقق الرمز"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-gray-400 hover:text-white transition-colors mt-4"
                >
                  {isEnglish ? "Back to Email" : "العودة إلى البريد الإلكتروني"}
                </button>
              </div>
            </form>
          </>
        );
      case 3:
        return (
          <>
            <h1 className="text-white text-2xl sm:text-3xl md:text-[36px] lg:text-[40px] pt-8 sm:pt-12 lg:pt-16 font-extrabold font-Tajawal text-center">
              {isEnglish ? "Reset Password" : "إعادة تعيين كلمة المرور"}
            </h1>
            <p className="text-gray-400 text-center mt-4">
              {isEnglish
                ? "Enter your new password to reset your account."
                : "أدخل كلمة المرور الجديدة لإعادة تعيين حسابك."}
            </p>
            <form
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20"
              onSubmit={(e) => {
                e.preventDefault();
                resetPassword();
              }}
            >
              {/* Password Input */}
              <div className="flex flex-col gap-1">
                <label
                  className={`text-white pb-3 ${
                    isEnglish ? "text-left" : ""
                  } text-sm sm:text-base font-normal`}
                >
                  {isEnglish ? "New Password" : "كلمة المرور الجديدة"}
                </label>
                <div className="relative">
                  <input
                    dir="ltr"
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setValidationErrors((prev) => ({
                        ...prev,
                        newPassword: "",
                      }));
                    }}
                    value={newPassword}
                    className={`bg-black py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${
                      validationErrors.newPassword
                        ? "border-red-500"
                        : "border-transparent"
                    } transition-all duration-50 text-white rounded-xl px-3 w-full`}
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                {renderPasswordRequirements()}
                {validationErrors.newPassword && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1">
                    {validationErrors.newPassword}
                  </span>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col gap-1">
                <label
                  className={`text-white pb-3 ${
                    isEnglish ? "text-left" : ""
                  } text-sm sm:text-base font-normal`}
                >
                  {isEnglish ? "Confirm Password" : "تأكيد كلمة المرور"}
                </label>
                <div className="relative">
                  <input
                    dir="ltr"
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setValidationErrors((prev) => ({
                        ...prev,
                        confirmPassword: "",
                      }));
                    }}
                    value={confirmPassword}
                    className={`bg-black py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${
                      validationErrors.confirmPassword
                        ? "border-red-500"
                        : "border-transparent"
                    } transition-all duration-50 text-white rounded-xl px-3 w-full`}
                    type={showConfirmPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1">
                    {validationErrors.confirmPassword}
                  </span>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm sm:text-base text-center mt-2 sm:mt-4">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2 items-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-[#38FFE5] py-3 sm:py-4 w-full sm:w-2/3 rounded-xl mx-auto text-black text-xl sm:text-2xl font-bold hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  } flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-xl sm:text-2xl" />
                      <span>
                        {isEnglish ? "Resetting..." : "جاري إعادة التعيين..."}
                      </span>
                    </>
                  ) : isEnglish ? (
                    "Reset Password"
                  ) : (
                    "إعادة تعيين كلمة المرور"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-gray-400 hover:text-white transition-colors mt-4"
                >
                  {isEnglish ? "Back to OTP" : "العودة إلى رمز التحقق"}
                </button>
              </div>
            </form>
          </>
        );
      default:
        return null;
    }
  };
  return (
    <div className="bg-[#0B0D0F] h-screen flex flex-col">
      {isLoaded ? (
        <>
          <div className="flex items-center flex-col lg:flex-row-reverse justify-between py-4">
            <Logo />
            <div className="flex items-center mt-2 lg:mt-0 lg:ml-16 gap-8 px-6">
              <Link href="/login">
                <button className="text-white cursor-pointer hover:bg-[#38FFE5] transition-all duration-400 hover:text-black border-2 border-white font-medium py-2 px-4 rounded">
                  {isEnglish ? "Login" : "تسجيل الدخول"}
                </button>
              </Link>
              <button
                onClick={toggleLanguage}
                className="text-white cursor-pointer text-lg font-bold font-Tajawal"
              >
                {isEnglish ? "عربي" : "English"}
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8">
            <div className="bg-[#131619] px-6 sm:px-10 md:px-14 lg:px-20 rounded-2xl flex flex-col w-full max-w-[650px] mx-auto py-8">
              {renderStepContent()}

              <p className="text-gray-400 text-center mt-8 mb-4">
                {isEnglish ? "Remember your password?" : "تتذكر كلمة المرور؟"}{" "}
                <Link href="/login" className="text-[#38FFE5] hover:underline">
                  {isEnglish ? "Login" : "تسجيل الدخول"}
                </Link>
              </p>
            </div>
          </div>
        </>
      ) : (
        <LoadingPage />
      )}
    </div>
  );
}
