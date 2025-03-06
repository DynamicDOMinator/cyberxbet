"use client";

import Link from "next/link";
import Logo from "@/app/components/Logo";
import axios from "axios";
import { useState, useEffect } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

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
  const [isEnglish, setIsEnglish] = useState(false);
  
  const toggleLanguage = () => {
    setIsEnglish(!isEnglish);
  };

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
      setError(isEnglish ? "An error occurred while loading reCAPTCHA. Please refresh the page." : "حدث خطأ في تحميل reCAPTCHA. يرجى تحديث الصفحة.");
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
      setValidationErrors(prev => ({
        ...prev,
        email: isEnglish ? "Email is required" : "البريد الإلكتروني مطلوب"
      }));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationErrors(prev => ({
        ...prev,
        email: isEnglish ? "Please enter a valid email address" : "يرجى إدخال عنوان بريد إلكتروني صالح"
      }));
      isValid = false;
    } else {
      setValidationErrors(prev => ({ ...prev, email: "" }));
    }
    return isValid;
  };

  const validateOtp = () => {
    let isValid = true;
    if (!otp.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        otp: isEnglish ? "OTP code is required" : "رمز التحقق مطلوب"
      }));
      isValid = false;
    } else if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setValidationErrors(prev => ({
        ...prev,
        otp: isEnglish ? "Please enter a valid 6-digit OTP code" : "يرجى إدخال رمز تحقق صالح مكون من 6 أرقام"
      }));
      isValid = false;
    } else {
      setValidationErrors(prev => ({ ...prev, otp: "" }));
    }
    return isValid;
  };

  const validatePassword = () => {
    let isValid = true;
    if (!newPassword.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        newPassword: isEnglish ? "New password is required" : "كلمة المرور الجديدة مطلوبة"
      }));
      isValid = false;
    } else if (newPassword.length < 6) {
      setValidationErrors(prev => ({
        ...prev,
        newPassword: isEnglish ? "Password must be at least 6 characters" : "يجب ألا تقل كلمة المرور عن 6 أحرف"
      }));
      isValid = false;
    } else {
      setValidationErrors(prev => ({ ...prev, newPassword: "" }));
    }

    if (!confirmPassword.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: isEnglish ? "Please confirm your password" : "يرجى تأكيد كلمة المرور"
      }));
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: isEnglish ? "Passwords do not match" : "كلمات المرور غير متطابقة"
      }));
      isValid = false;
    } else {
      setValidationErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
    
    return isValid;
  };

  const requestPasswordReset = async () => {
    setError("");
    
    if (!validateEmail()) {
      return;
    }

    if (!recaptchaLoaded || !window.grecaptcha) {
      setError(isEnglish ? "Please wait until reCAPTCHA is fully loaded" : "يرجى الانتظار حتى يتم تحميل reCAPTCHA بالكامل");
      return;
    }

    try {
      setLoading(true);

      const token = await window.grecaptcha.execute("6Ldx3eYqAAAAAGgdL0IHdBAljwDlx_NcJ28HFtqc", { action: "forgot_password" }).catch((error) => {
        console.error("reCAPTCHA execution error:", error);
        throw new Error(isEnglish ? "reCAPTCHA verification failed. Please try again." : "فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.");
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured. Please check .env.local file.");
      }

      // Send request to backend to send OTP to email
      await axios.post(`${apiUrl}/auth/forgot-password`, { email, recaptchaToken: token });
      
      // Move to OTP verification step
      setStep(2);
    } catch (error) {
      console.error("Password reset request error:", error);
      setError(error.response?.data?.error || error.message || (isEnglish ? "An error occurred. Please try again." : "حدث خطأ. يرجى المحاولة مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    
    if (!validateOtp()) {
      return;
    }

    try {
      setLoading(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured. Please check .env.local file.");
      }

      // Verify OTP with backend
      await axios.post(`${apiUrl}/auth/verify-otp`, { email, otp });
      
      // Move to new password step
      setStep(3);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(error.response?.data?.error || error.message || (isEnglish ? "Invalid OTP code. Please try again." : "رمز التحقق غير صالح. يرجى المحاولة مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    
    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured. Please check .env.local file.");
      }

      // Reset password with backend
      await axios.post(`${apiUrl}/auth/reset-password`, { email, otp, newPassword });
      
      // Redirect to login page with success message
      window.location.href = "/login?reset=success";
    } catch (error) {
      console.error("Password reset error:", error);
      setError(error.response?.data?.error || error.message || (isEnglish ? "An error occurred. Please try again." : "حدث خطأ. يرجى المحاولة مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h1 className="text-white text-2xl sm:text-3xl md:text-[36px] lg:text-[40px] pt-8 sm:pt-12 lg:pt-16 font-extrabold font-Tajawal text-center">
              {isEnglish ? "Forgot Password" : "نسيت كلمة المرور"}
            </h1>
            <p className="text-gray-400 text-center mt-4">
              {isEnglish 
                ? "Enter your email address and we'll send you a verification code" 
                : "أدخل عنوان بريدك الإلكتروني وسنرسل لك رمز التحقق"}
            </p>
            <form dir={isEnglish ? "ltr" : "rtl"} className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20" onSubmit={(e) => {
              e.preventDefault();
              requestPasswordReset();
            }}>
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
                  className={`bg-black py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${validationErrors.email ? "border-red-500" : "border-transparent"} transition-all duration-50 text-white rounded-xl px-3`}
                  type="email"
                />
                {validationErrors.email && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1">{validationErrors.email}</span>
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
                className={`bg-[#38FFE5] py-3 sm:py-4 w-full sm:w-2/3 rounded-xl mx-auto text-black text-xl sm:text-2xl font-bold hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 ${(loading || !recaptchaLoaded) ? "opacity-70 cursor-not-allowed" : ""} flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <BiLoaderAlt className="animate-spin text-xl sm:text-2xl" />
                    <span>{isEnglish ? "Sending..." : "جاري الإرسال..."}</span>
                  </>
                ) : !recaptchaLoaded ? (
                  isEnglish ? "Loading..." : "جاري التحميل..."
                ) : (
                  isEnglish ? "Send Verification Code" : "إرسال رمز التحقق"
                )}
              </button>
            </form>
          </>
        );
      case 2:
        return (
          <>
            <h1 className="text-white text-2xl sm:text-3xl md:text-[36px] lg:text-[40px] pt-8 sm:pt-12 lg:pt-16 font-extrabold font-Tajawal text-center">
              {isEnglish ? "Enter Verification Code" : "أدخل رمز التحقق"}
            </h1>
            <p className="text-gray-400 text-center mt-4">
              {isEnglish 
                ? `We've sent a 6-digit verification code to ${email}` 
                : `لقد أرسلنا رمز تحقق مكون من 6 أرقام إلى ${email}`}
            </p>
            <form dir={isEnglish ? "ltr" : "rtl"} className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20" onSubmit={(e) => {
              e.preventDefault();
              verifyOtp();
            }}>
              <div className="flex flex-col gap-1">
                <label className="text-white text-sm sm:text-base font-normal">
                  {isEnglish ? "Verification Code" : "رمز التحقق"}
                </label>
                <input
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/[^0-9]/g, ''));
                    setValidationErrors((prev) => ({ ...prev, otp: "" }));
                  }}
                  value={otp}
                  className={`bg-black py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${validationErrors.otp ? "border-red-500" : "border-transparent"} transition-all duration-50 text-white rounded-xl px-3`}
                  type="text"
                  maxLength={6}
                />
                {validationErrors.otp && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1">{validationErrors.otp}</span>
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
                  className={`bg-[#38FFE5] py-3 sm:py-4 w-full sm:w-2/3 rounded-xl mx-auto text-black text-xl sm:text-2xl font-bold hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 ${loading ? "opacity-70 cursor-not-allowed" : ""} flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-xl sm:text-2xl" />
                      <span>{isEnglish ? "Verifying..." : "جاري التحقق..."}</span>
                    </>
                  ) : (
                    isEnglish ? "Verify Code" : "تحقق من الرمز"
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
              {isEnglish ? "Create New Password" : "إنشاء كلمة مرور جديدة"}
            </h1>
            <p className="text-gray-400 text-center mt-4">
              {isEnglish 
                ? "Your identity has been verified. Set your new password" 
                : "تم التحقق من هويتك. قم بتعيين كلمة المرور الجديدة"}
            </p>
            <form dir={isEnglish ? "ltr" : "rtl"} className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20" onSubmit={(e) => {
              e.preventDefault();
              resetPassword();
            }}>
              <div className="flex flex-col gap-1">
                <label className="text-white text-sm sm:text-base font-normal">
                  {isEnglish ? "New Password" : "كلمة المرور الجديدة"}
                </label>
                <div className="relative">
                  <input
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, newPassword: "" }));
                    }}
                    value={newPassword}
                    className={`bg-black py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${validationErrors.newPassword ? "border-red-500" : "border-transparent"} transition-all duration-50 text-white rounded-xl px-3 w-full`}
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
                {validationErrors.newPassword && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1">{validationErrors.newPassword}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-white text-sm sm:text-base font-normal">
                  {isEnglish ? "Confirm Password" : "تأكيد كلمة المرور"}
                </label>
                <div className="relative">
                  <input
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    value={confirmPassword}
                    className={`bg-black py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${validationErrors.confirmPassword ? "border-red-500" : "border-transparent"} transition-all duration-50 text-white rounded-xl px-3 w-full`}
                    type={showConfirmPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1">{validationErrors.confirmPassword}</span>
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
                  className={`bg-[#38FFE5] py-3 sm:py-4 w-full sm:w-2/3 rounded-xl mx-auto text-black text-xl sm:text-2xl font-bold hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 ${loading ? "opacity-70 cursor-not-allowed" : ""} flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <BiLoaderAlt className="animate-spin text-xl sm:text-2xl" />
                      <span>{isEnglish ? "Resetting..." : "جاري إعادة التعيين..."}</span>
                    </>
                  ) : (
                    isEnglish ? "Reset Password" : "إعادة تعيين كلمة المرور"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-gray-400 hover:text-white transition-colors mt-4"
                >
                  {isEnglish ? "Back to Verification" : "العودة إلى التحقق"}
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
    <div className="bg-black relative pb-20 min-h-screen">
      <div className="flex items-center flex-col lg:flex-row-reverse justify-between">
        <Logo />
        <div className="flex items-center mt-8 lg:ml-16 gap-8 px-4">
          <Link href="/login">
            <button className="text-white cursor-pointer hover:bg-[#38FFE5] transition-all duration-400 hover:text-black border-2 border-white font-medium py-2 px-4 rounded">
              {isEnglish ? "Login" : "تسجيل الدخول"}
            </button>
          </Link>
          <button onClick={toggleLanguage} className="text-white cursor-pointer text-lg font-bold font-Tajawal">
            {isEnglish ? "عربي" : "English"}
          </button>
        </div>
      </div>
      
      <div className="min-h-screen pt-10 flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="bg-[#131619] px-6 sm:px-12 md:px-20 lg:px-28 rounded-2xl flex flex-col gap-4 w-full max-w-[720px] mx-auto">
          {renderStepContent()}
          
          <p className="text-gray-400 text-center mt-8 mb-8">
            {isEnglish ? "Remember your password?" : "تتذكر كلمة المرور؟"}{" "}
            <Link href="/login" className="text-[#38FFE5] hover:underline">
              {isEnglish ? "Login" : "تسجيل الدخول"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}