"use client";

import Link from "next/link";
import Logo from "@/app/components/Logo";
import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { BiLoaderAlt } from "react-icons/bi";
import CountrySelect from "@/app/components/CountrySelect";
import countryList from "react-select-country-list";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    username: "",
    password: "",
    country: "",
  });
  const [isEnglish, setIsEnglish] = useState(false);

  const countries = useMemo(() => countryList().getData(), []);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "#0B0D0F",
      borderColor: validationErrors.country ? "#ef4444" : "transparent",
      "&:hover": {
        borderColor: "#6b7280",
        borderWidth: "2px",
        transition: "all 500ms",
      },
      padding: "2px",
      borderRadius: "0.75rem",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#38FFE5"
        : state.isFocused
        ? "#374151"
        : "black",
      color: state.isSelected ? "black" : "white",
      "&:hover": {
        backgroundColor: "#374151",
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "black",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "white",
    }),
    input: (provided) => ({
      ...provided,
      color: "white",
    }),
  };

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
      username: "",
      password: "",
      country: "",
    };
    let isValid = true;

    if (!email.trim()) {
      errors.email = isEnglish
        ? "Email is required"
        : "البريد الإلكتروني مطلوب";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = isEnglish
        ? "Invalid email format"
        : "صيغة البريد الإلكتروني غير صحيحة";
      isValid = false;
    }

    if (!username.trim()) {
      errors.username = isEnglish
        ? "Username is required"
        : "اسم المستخدم مطلوب";
      isValid = false;
    }

    if (!password.trim()) {
      errors.password = isEnglish
        ? "Password is required"
        : "كلمة مرور غير مطابقة للشروط";
      isValid = false;
    } else if (
      password.length < 8 ||
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/.test(password)
    ) {
      errors.password = isEnglish
        ? "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol"
        : "كلمة مرور غير مطابقة للشروط";
      isValid = false;
    }

    if (!country) {
      errors.country = isEnglish ? "Country is required" : "البلد مطلوب";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const signup = async () => {
    setError("");
    setValidationErrors({ email: "", username: "", password: "", country: "" });

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
          action: "signup",
        })
        .catch((error) => {
          console.error("reCAPTCHA execution error:", error);
          throw new Error(
            isEnglish
              ? "reCAPTCHA verification failed. Please try again."
              : "فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى."
          );
        });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error(
          "API URL not configured. Please check .env.local file."
        );
      }

      const response = await axios.post(`${apiUrl}/auth/register`, {
        email: email,
        name: username,
        password: password,
        country: country.value,
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        setValidationErrors((prev) => ({
          ...prev,
          ...Object.keys(backendErrors).reduce((acc, key) => {
            acc[key] = backendErrors[key][0];
            return acc;
          }, {}),
        }));
      } else {
        setError(
          error.response?.data?.error ||
            error.message ||
            (isEnglish
              ? "An error occurred during signup"
              : "حدث خطأ أثناء التسجيل")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    signup();
  };

  return (
    <div className="bg-[#0B0D0F] relative pb-20 min-h-screen">
      <div className="flex items-center flex-col lg:flex-row-reverse justify-between">
        <Logo />
        <div className="flex items-center mt-8 lg:ml-16 gap-8 px-4">
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

      <div className="min-h-screen pt-10 flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="bg-[#131619] px-6 sm:px-12 md:px-20 lg:px-28 rounded-2xl flex flex-col gap-4 w-full max-w-[720px] mx-auto">
          <h1 className="text-white text-2xl pt-10 sm:text-3xl md:text-[36px] lg:text-[40px] pt-1 font-extrabold font-Tajawal text-center">
            {isEnglish ? (
              <>
                Join <span className="text-[#38FFE5]">CyberXbytes</span>
              </>
            ) : (
              <>
                <span className="text-[#38FFE5]">CyberXbytes</span> أنضم إلي
              </>
            )}
          </h1>
          <form
            dir={isEnglish ? "ltr" : "rtl"}
            className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-1">
              <label className="text-white text-sm sm:text-base font-normal">
                {isEnglish ? "Email" : "البريد الإلكتروني"}
              </label>
              <input
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, email: "" }));
                }}
                value={email}
                className={`bg-[#0B0D0F] py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${
                  validationErrors.email
                    ? "border-red-500"
                    : "border-transparent"
                } transition-all duration-500 text-white rounded-xl px-3`}
                type="email"
              />
              {validationErrors.email && (
                <span className="text-red-500 text-xs sm:text-sm mt-1">
                  {validationErrors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white text-sm sm:text-base font-normal">
                {isEnglish ? "Username" : "اسم المستخدم"}
              </label>
              <input
                onChange={(e) => {
                  setUsername(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, username: "" }));
                }}
                value={username}
                className={`bg-[#0B0D0F] py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${
                  validationErrors.username
                    ? "border-red-500"
                    : "border-transparent"
                } transition-all duration-500 text-white rounded-xl px-3`}
                type="text"
              />
              {validationErrors.username && (
                <span className="text-red-500 text-xs sm:text-sm mt-1">
                  {validationErrors.username}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white text-sm sm:text-base font-normal">
                {isEnglish ? "Country" : "البلد"}
              </label>
              <CountrySelect
                countries={countries}
                value={country}
                onChange={(value) => {
                  setCountry(value);
                  setValidationErrors((prev) => ({ ...prev, country: "" }));
                }}
                customStyles={customStyles}
                isEnglish={isEnglish}
              />
              {validationErrors.country && (
                <span className="text-red-500 text-xs sm:text-sm mt-1">
                  {validationErrors.country}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white text-sm sm:text-base font-normal">
                {isEnglish ? "Password" : "كلمة المرور"}
              </label>
              <div className="relative">
                <input
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  value={password}
                  className={`bg-[#0B0D0F] w-full py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${
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
                    isEnglish ? "right-3" : "left-3"
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
              {!isEnglish && (
                <div className="text-white text-xs sm:text-sm mt-2  p-2 rounded-md">
                  يجب أن تحتوي كلمة المرور على الأقل على{" "}
                  <span className="text-red-500">8 أحرف</span> وتتضمن
                  <span className="text-red-500"> أحرفا كبيرة </span>,{" "}
                  <span className="text-red-500">وصغيرة</span>,{" "}
                  <span className="text-[#8BEFCB]">رقم واحد</span> و{" "}
                  <span className="text-red-500">رمز</span>.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <button
                disabled={loading}
                type="submit"
                className="bg-[#38FFE5] hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 text-black font-bold py-2.5 sm:py-3 rounded-xl flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <BiLoaderAlt className="animate-spin" size={24} />
                    <span>
                      {isEnglish
                        ? "Creating account..."
                        : "جاري إنشاء الحساب..."}
                    </span>
                  </>
                ) : isEnglish ? (
                  "Create Account"
                ) : (
                  "إنشاء حساب"
                )}
              </button>
              {error && (
                <p className="text-red-500 text-center text-sm">{error}</p>
              )}
            </div>
          </form>

          <p className="text-white text-center font-bold text-xl sm:text-2xl mt-8 sm:mt-12 lg:mt-16">
            {isEnglish ? "Already have an account?" : "لديك حساب بالفعل؟"}{" "}
            <Link href="/login">
              <span className="text-[#38FFE5] cursor-pointer">
                {isEnglish ? "Login" : "تسجيل الدخول"}
              </span>
            </Link>
          </p>

          <p
            dir="rtl"
            className="text-white text-center text-sm sm:text-base mt-12 sm:mt-16 lg:mt-20 mb-4"
          >
            {isEnglish
              ? "This site is protected by reCAPTCHA "
              : "هذا الموقع محمي بواسطة reCAPTCHA "}{" "}
            <span className="text-[#38FFE5] cursor-pointer">
              {isEnglish ? "Privacy Policy" : "سياسة الخصوصية"}
            </span>
            {isEnglish ? " and " : " و"}{" "}
            <span className="text-[#38FFE5] cursor-pointer">
              {isEnglish ? "Terms of Service" : "شروط الخدمة"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
