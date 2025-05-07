"use client";

import Link from "next/link";
import Logo from "@/app/components/Logo";
import LoadingPage from "@/app/components/LoadingPage";
import { useState, useEffect } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { BiLoaderAlt } from "react-icons/bi";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });
  const { isEnglish, setIsEnglish } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);

  const {
    login: authLogin,
    loading: authLoading,
    error: authError,
  } = useAuth();

  const toggleLanguage = () => {
    setIsEnglish(!isEnglish);
  };

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
  }, []);

  const validateForm = () => {
    const errors = {
      email: "",
      password: "",
    };
    let isValid = true;

    if (!email.trim()) {
      errors.email = isEnglish
        ? "Email is required"
        : "البريد الإلكتروني مطلوب";
      isValid = false;
    }

    if (!password.trim()) {
      errors.password = isEnglish
        ? "Password is required"
        : "كلمة المرور مطلوبة";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = isEnglish
        ? "Password must be at least 6 characters"
        : "يجب ألا تقل كلمة المرور عن 6 أحرف";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const login = async () => {
    setError("");
    setValidationErrors({ email: "", password: "" });

    if (!validateForm()) {
      return;
    }

    if (!recaptchaLoaded || !window.grecaptcha) {
      setError(
        isEnglish
          ? "Please wait until reCAPTCHA is fully loaded"
          : "يرجى الانتظار حتى يتم تحميل reCAPTCHA بالكامل"
      );
      return;
    }

    try {
      setLoading(true);

      const token = await window.grecaptcha
        .execute("6Ldx3eYqAAAAAGgdL0IHdBAljwDlx_NcJ28HFtqc", {
          action: "login",
        })
        .catch((error) => {
          console.error("reCAPTCHA execution error:", error);
          throw new Error(
            isEnglish
              ? "reCAPTCHA verification failed. Please try again."
              : "فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى."
          );
        });

      const result = await authLogin(email, password, token, isEnglish);

      if (!result.success) {
        if (result.error?.errors) {
          const backendErrors = result.error.errors;
          setValidationErrors((prev) => ({
            ...prev,
            ...Object.keys(backendErrors).reduce((acc, key) => {
              acc[key] = backendErrors[key][0]; // Take first error message for each field
              return acc;
            }, {}),
          }));
        } else {
          setError(
            result.error?.error ||
              result.error?.message ||
              (isEnglish
                ? "An error occurred during login"
                : "حدث خطأ أثناء تسجيل الدخول")
          );
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.message ||
          (isEnglish
            ? "An error occurred during login"
            : "حدث خطأ أثناء تسجيل الدخول")
      );
    } finally {
      setLoading(false);
    }
  };

  return isLoaded ? (
    <div className="bg-[#0B0D0F] h-screen flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 ">
        <div className="bg-[#131619] px-6 sm:px-10 md:px-14 lg:px-20 rounded-2xl flex flex-col w-full max-w-[650px] mx-auto py-20">
          <h1 className="text-white text-2xl sm:text-3xl md:text-[34px] font-extrabold font-Tajawal text-center">
            {isEnglish ? "Login to Your Account" : "تسجيل الدخول إلي حسابك"}
          </h1>
          <form
            dir={isEnglish ? "ltr" : "rtl"}
            className="flex flex-col gap-6 mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-white text-sm sm:text-base pb-2 font-normal">
                {isEnglish
                  ? "Email or Username"
                  : "البريد الإلكتروني أو اسم المستخدم"}
              </label>
              <input
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, email: "" }));
                }}
                value={email}
                className={`bg-[#0B0D0F] py-3 hover:border-2 hover:border-gray-500 ${
                  validationErrors.email
                    ? "border-red-500"
                    : "border-transparent"
                } transition-all duration-500 text-white rounded-xl px-3`}
                type="text"
              />
              {validationErrors.email && (
                <span className="text-red-500 text-xs sm:text-sm mt-1">
                  {validationErrors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-white text-sm sm:text-base pb-2 font-normal">
                {isEnglish ? "Password" : "كلمة المرور"}
              </label>
              <div className="relative">
                <input
                  dir="ltr"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  value={password}
                  className={`bg-[#0B0D0F] w-full py-3 hover:border-2 hover:border-gray-500 ${
                    validationErrors.password
                      ? "border-red-500"
                      : "border-transparent"
                  } transition-all duration-500 text-white rounded-xl px-3`}
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${
                    isEnglish ? "right-3" : "right-3"
                  } top-1/2 -translate-y-1/2 text-gray-400 hover:text-white`}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <span className="text-red-500 text-xs sm:text-sm mt-1">
                  {validationErrors.password}
                </span>
              )}
            </div>

            {error && (
              <div
                className="text-red-500 text-sm sm:text-base text-center"
                dir="rtl"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !recaptchaLoaded}
              className={`bg-[#38FFE5] py-3 w-full sm:w-2/3 rounded-xl mx-auto text-black text-lg sm:text-xl font-bold hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 ${
                loading || !recaptchaLoaded
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              } flex items-center justify-center gap-2 mt-3`}
            >
              {loading ? (
                <>
                  <BiLoaderAlt className="animate-spin text-xl" />
                  <span>
                    {isEnglish ? "Logging in..." : "جاري تسجيل الدخول..."}
                  </span>
                </>
              ) : !recaptchaLoaded ? (
                isEnglish ? (
                  "Loading..."
                ) : (
                  "جاري التحميل..."
                )
              ) : isEnglish ? (
                "Login"
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>

          <p className="text-white text-center font-bold text-lg sm:text-xl mt-7">
            {isEnglish ? "Don't have an account?" : "ليس لديك حساب؟"}{" "}
            <Link href="/signup">
              <span className="text-[#38FFE5] cursor-pointer">
                {isEnglish ? "Sign up" : "تسجيل"}
              </span>
            </Link>
          </p>
          <Link href="/forgot-password">
            <p className="text-[#38FFE5] text-center font-bold text-lg sm:text-xl cursor-pointer mt-2">
              {isEnglish ? "Forgot password" : "نسيت كلمة المرور"}
            </p>
          </Link>

          <p
            dir="rtl"
            className="text-white text-center text-xs sm:text-sm mt-6"
          >
            {isEnglish
              ? "This site is protected by reCAPTCHA and the Google"
              : " هذا الموقع محمي بواسطة reCAPTCHA "}
            <span className="text-[#38FFE5] cursor-pointer pl-1">
              {isEnglish ? "Privacy Policy " : "  سياسة الخصوصية"}
            </span>
            {isEnglish ? " and " : "و"}
            <span className="text-[#38FFE5] cursor-pointer">
              {isEnglish ? " Terms of Service" : " شروط الخدمة"}
            </span>
          </p>
        </div>
      </div>
    </div>
  ) : (
    <LoadingPage />
  );
}
