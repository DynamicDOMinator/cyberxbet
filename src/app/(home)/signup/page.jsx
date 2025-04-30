"use client";

import Link from "next/link";
import Logo from "@/app/components/Logo";
import axios from "axios";
import { useState, useEffect, useMemo, useRef } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { BiLoaderAlt } from "react-icons/bi";
import { BsCheckCircleFill, BsXCircleFill } from "react-icons/bs";
import CountrySelect from "@/app/components/CountrySelect";
import countryList from "react-select-country-list";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import LoadingPage from "@/app/components/LoadingPage";
export default function Signup() {
  const {
    verifyOtp,
    loading: authLoading,
    error: authError,
    setError: setAuthError,
  } = useAuth();
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
  const { isEnglish, setIsEnglish } = useLanguage();
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [registrationId, setRegistrationId] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const otpInputRefs = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const countries = useMemo(() => countryList().getData(), []);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);

      // Focus the last input
      otpInputRefs.current[5].focus();
    }
  };

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
      padding: "11px",
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
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
    ) {
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
        user_name: username,
        password: password,
        country: country.value,
        name: username,
      });

      // Handle successful registration
      if (response.data.registration_id) {
        setRegistrationId(response.data.registration_id);
        setExpiresIn(response.data.expires_in);
        setSuccessMessage(
          isEnglish
            ? response.data.message
            : "تم بدء التسجيل. يرجى التحقق من بريدك الإلكتروني باستخدام رمز التحقق المرسل."
        );
        setOtpStep(true);
      }
    } catch (error) {
      console.error("Signup error:", error);

      // Handle error response with validation errors
      if (error.response?.data?.errors) {
        // Map the server-side errors to our form fields
        const backendErrors = error.response.data.errors;
        const formattedErrors = {};

        // Process each error key
        Object.keys(backendErrors).forEach((key) => {
          // Map server field names to our form field names if needed
          let fieldName = key;
          if (key === "user_name") fieldName = "username";
          // Removed 'name' field mapping

          // Set the first error message for each field
          if (backendErrors[key] && backendErrors[key].length > 0) {
            formattedErrors[fieldName] = backendErrors[key][0];
          }
        });

        setValidationErrors((prev) => ({
          ...prev,
          ...formattedErrors,
        }));

        // If there's a general message, display it as well
        if (error.response.data.message) {
          setError(error.response.data.message);
        }
      } else {
        // Handle general errors
        setError(
          error.response?.data?.error ||
            error.response?.data?.message ||
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

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.join("").length === 6) {
      const otpString = otp.join("");

      try {
        setLoading(true);
        setError("");

        const result = await verifyOtp(
          {
            registration_id: registrationId,
            otp: otpString,
          },
          isEnglish
        );

        if (!result.success) {
          setError(
            result.error?.error ||
              (isEnglish
                ? "An error occurred during verification"
                : "حدث خطأ أثناء التحقق")
          );
        }
      } catch (error) {
        console.error("OTP verification error:", error);
        setError(
          isEnglish
            ? "An error occurred during verification"
            : "حدث خطأ أثناء التحقق"
        );
      } finally {
        setLoading(false);
      }
    } else {
      setError(
        isEnglish
          ? "Please enter a valid 6-digit OTP"
          : "الرجاء إدخال رمز تحقق صالح مكون من 6 أرقام"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    signup();
  };

  // Add password strength validation function
  const validatePasswordStrength = (password) => {
    let strength = 0;
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^\w\s]/.test(password),
    };

    if (validation.length) strength += 1;
    if (validation.uppercase) strength += 1;
    if (validation.lowercase) strength += 1;
    if (validation.number) strength += 1;
    if (validation.symbol) strength += 1;

    setPasswordValidation(validation);
    setPasswordStrength(strength);
  };

  // Update password validation when password changes
  useEffect(() => {
    validatePasswordStrength(password);
  }, [password]);

  // Password strength meter color
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-300";
    if (passwordStrength < 3) return "bg-red-500";
    if (passwordStrength < 5) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Password strength text
  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return isEnglish ? "None" : "لا شيء";
    if (passwordStrength < 3) return isEnglish ? "Weak" : "ضعيف";
    if (passwordStrength < 5) return isEnglish ? "Medium" : "متوسط";
    return isEnglish ? "Strong" : "قوي";
  };

  return isLoaded ? (
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
          <h1 className="text-white text-2xl pt-10 sm:text-3xl md:text-[36px] lg:text-[40px]  font-extrabold font-Tajawal text-center">
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

          {otpStep ? (
            <div className="flex flex-col gap-8 mt-10">
              {successMessage && (
                <div
                  className="bg-[#1A2025]  border border-[#38FFE5] text-center text-white px-4 py-3 rounded-xl relative"
                  role="alert"
                >
                  <span className="block sm:inline text-center ">
                    {successMessage}
                  </span>
                </div>
              )}

              <p className="text-white text-center">
                {isEnglish
                  ? `Please enter the OTP sent to your email. It expires in ${Math.floor(
                      expiresIn / 60
                    )} minutes.`
                  : `الرجاء إدخال رمز التحقق المرسل إلى بريدك الإلكتروني. ينتهي في ${Math.floor(
                      expiresIn / 60
                    )} دقائق.`}
              </p>

              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <label className="text-white  text-sm sm:text-base font-normal text-center">
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
                        onChange={(e) => handleOtpChange(index, e.target.value)}
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

                <button
                  disabled={loading || otp.join("").length !== 6}
                  type="submit"
                  className={`${
                    otp.join("").length === 6
                      ? "bg-[#38FFE5] hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] text-black"
                      : "bg-gray-700 text-gray-300 cursor-not-allowed"
                  } transition-all duration-300 font-bold py-2.5 sm:py-3 rounded-xl flex items-center justify-center`}
                >
                  {loading ? (
                    <>
                      <BiLoaderAlt className="animate-spin" size={24} />
                      <span className="ml-2">
                        {isEnglish ? "Verifying..." : "جاري التحقق..."}
                      </span>
                    </>
                  ) : isEnglish ? (
                    "Verify OTP"
                  ) : (
                    "تحقق من الرمز"
                  )}
                </button>

                {error && (
                  <p className="text-red-500 text-center text-sm">{error}</p>
                )}
              </form>
            </div>
          ) : (
            <form
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-1">
                <label className="text-white pb-4 text-sm sm:text-base font-normal">
                  {isEnglish ? "Email" : "البريد الإلكتروني"}
                </label>
                <input
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  value={email}
                  className={`bg-[#0B0D0F] py-2.5 sm:py-4 hover:border-2 hover:border-gray-500 ${
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
                <label className="text-white pb-4 text-sm sm:text-base font-normal">
                  {isEnglish ? "Username" : "اسم المستخدم"}
                </label>
                <input
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, username: "" }));
                  }}
                  value={username}
                  className={`bg-[#0B0D0F] py-2.5 sm:py-4 hover:border-2 hover:border-gray-500 ${
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
                <label className="text-white pb-4 text-sm sm:text-base font-normal">
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
                <label className="text-white pb-4 text-sm sm:text-base font-normal">
                  {isEnglish ? "Password" : "كلمة المرور"}
                </label>
                <div className="relative">
                  <input
                    dir="ltr"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setValidationErrors((prev) => ({
                        ...prev,
                        password: "",
                      }));
                    }}
                    value={password}
                    className={`bg-[#0B0D0F] w-full py-2.5 sm:py-4 hover:border-2 hover:border-gray-500 ${
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
                      isEnglish ? "left-3" : "right-3"
                    } top-1/2 -translate-y-1/2 text-gray-400 hover:text-white`}
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>

                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-grow h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-xs ${getPasswordStrengthColor().replace(
                          "bg-",
                          "text-"
                        )}`}
                      >
                        {getPasswordStrengthText()}
                      </span>
                    </div>

                    {/* Password validation checklist with animations */}
                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-1 transition-all duration-300 text-xs sm:text-sm ${
                        isEnglish ? "text-left" : "text-right"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {passwordValidation.length ? (
                          <BsCheckCircleFill className="text-green-500 transition-all duration-300" />
                        ) : (
                          <BsXCircleFill className="text-red-500 transition-all duration-300" />
                        )}
                        <span
                          className={
                            passwordValidation.length
                              ? "text-green-500"
                              : "text-white"
                          }
                        >
                          {isEnglish
                            ? "At least 8 characters"
                            : "٨ أحرف على الأقل"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordValidation.uppercase ? (
                          <BsCheckCircleFill className="text-green-500 transition-all duration-300" />
                        ) : (
                          <BsXCircleFill className="text-red-500 transition-all duration-300" />
                        )}
                        <span
                          className={
                            passwordValidation.uppercase
                              ? "text-green-500"
                              : "text-white"
                          }
                        >
                          {isEnglish ? "Uppercase letter" : "حرف كبير"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordValidation.lowercase ? (
                          <BsCheckCircleFill className="text-green-500 transition-all duration-300" />
                        ) : (
                          <BsXCircleFill className="text-red-500 transition-all duration-300" />
                        )}
                        <span
                          className={
                            passwordValidation.lowercase
                              ? "text-green-500"
                              : "text-white"
                          }
                        >
                          {isEnglish ? "Lowercase letter" : "حرف صغير"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordValidation.number ? (
                          <BsCheckCircleFill className="text-green-500 transition-all duration-300" />
                        ) : (
                          <BsXCircleFill className="text-red-500 transition-all duration-300" />
                        )}
                        <span
                          className={
                            passwordValidation.number
                              ? "text-green-500"
                              : "text-white"
                          }
                        >
                          {isEnglish ? "Number" : "رقم"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {passwordValidation.symbol ? (
                          <BsCheckCircleFill className="text-green-500 transition-all duration-300" />
                        ) : (
                          <BsXCircleFill className="text-red-500 transition-all duration-300" />
                        )}
                        <span
                          className={
                            passwordValidation.symbol
                              ? "text-green-500"
                              : "text-white"
                          }
                        >
                          {isEnglish ? "Symbol" : "رمز"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {validationErrors.password && (
                  <span className="text-red-500 text-xs sm:text-sm mt-1">
                    {validationErrors.password}
                  </span>
                )}
                {!password && !isEnglish && (
                  <div className="text-white text-xs sm:text-sm mt-2 p-2 rounded-md">
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
          )}

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
  ) : (
    <LoadingPage />
  );
}
