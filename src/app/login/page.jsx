"use client";

import Logo from "@/app/components/Logo";
import axios from "axios";
import { useState, useEffect } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { BiLoaderAlt } from "react-icons/bi";

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

  useEffect(() => {
    // Load reCAPTCHA v3
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=6Ldx3eYqAAAAAGgdL0IHdBAljwDlx_NcJ28HFtqc`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setRecaptchaLoaded(true);
      window.grecaptcha.ready(() => {
      });
    };
    script.onerror = (error) => {
      console.error('Error loading reCAPTCHA:', error);
      setError('حدث خطأ في تحميل reCAPTCHA. يرجى تحديث الصفحة.');
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
      errors.email = "البريد الإلكتروني مطلوب";
      isValid = false;
    }

    if (!password.trim()) {
      errors.password = "كلمة المرور مطلوبة";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "يجب ألا تقل كلمة المرور عن 6 أحرف";
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
      setError('يرجى الانتظار حتى يتم تحميل reCAPTCHA بالكامل');
      return;
    }

    try {
      setLoading(true);

      // Execute reCAPTCHA
      const token = await window.grecaptcha.execute('6Ldx3eYqAAAAAGgdL0IHdBAljwDlx_NcJ28HFtqc', { 
        action: 'login'
      }).catch(error => {
        console.error('reCAPTCHA execution error:', error);
        throw new Error('فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.');
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured. Please check .env.local file.');
      }
      
      const response = await axios.post(
        `${apiUrl}/auth/login`,
        { 
          email, 
          password,
          recaptchaToken: token 
        }
      );
      console.log(response.data);
      // Handle successful login here
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = error.response.data.errors;
        setValidationErrors(prev => ({
          ...prev,
          ...Object.keys(backendErrors).reduce((acc, key) => {
            acc[key] = backendErrors[key][0]; // Take first error message for each field
            return acc;
          }, {})
        }));
      } else {
        setError(error.response?.data?.error || error.message || "حدث خطأ أثناء تسجيل الدخول");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black relative pb-20 min-h-screen ">
      <Logo />

      <div className="min-h-screen pt-10 flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="bg-[#131619] px-6 sm:px-12 md:px-20 lg:px-28 rounded-2xl flex flex-col gap-4 w-full max-w-[720px] mx-auto">
          <h1 className="text-white text-2xl sm:text-3xl md:text-[36px] lg:text-[40px] pt-8 sm:pt-12 lg:pt-16 font-extrabold font-Tajawal text-center">
            تسجيل الدخول إلي حسابك
          </h1>
          <form
            dir="rtl"
            className="flex flex-col gap-8 sm:gap-10 lg:gap-14 mt-10 sm:mt-14 lg:mt-20"
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-white text-sm sm:text-base font-normal">
                البريد الإلكتروني أو اسم المستخدم
              </label>
              <input
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors(prev => ({ ...prev, email: "" }));
                }}
                value={email}
                className={`bg-black py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${validationErrors.email ? 'border-red-500' : 'border-transparent'} transition-all duration-50 text-white rounded-xl px-3`}
                type="text"
              />
              {validationErrors.email && (
                <span className="text-red-500 text-xs sm:text-sm mt-1">{validationErrors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white text-sm sm:text-base font-normal">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationErrors(prev => ({ ...prev, password: "" }));
                  }}
                  value={password}
                  className={`bg-black w-full py-2.5 sm:py-3 hover:border-2 hover:border-gray-500 ${validationErrors.password ? 'border-red-500' : 'border-transparent'} transition-all duration-50 text-white rounded-xl px-3`}
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <span className="text-red-500 text-xs sm:text-sm mt-1">{validationErrors.password}</span>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm sm:text-base text-center mt-2 sm:mt-4" dir="rtl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !recaptchaLoaded}
              className={`bg-[#38FFE5] py-3 sm:py-4 w-full sm:w-2/3 rounded-xl mx-auto text-black text-xl sm:text-2xl font-bold hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 ${(loading || !recaptchaLoaded) ? 'opacity-70 cursor-not-allowed' : ''} flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <BiLoaderAlt className="animate-spin text-xl sm:text-2xl" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : !recaptchaLoaded ? (
                'جاري التحميل...'
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <p className="text-white text-center font-bold text-xl sm:text-2xl mt-8 sm:mt-12 lg:mt-16">
            ليس لديك حساب؟{" "}
            <span className="text-[#38FFE5] cursor-pointer"> تسجيل</span>
          </p>
          <p className="text-[#38FFE5] text-center font-bold text-xl sm:text-2xl">
            نسيت كلمة المرور
          </p>

          <p dir="rtl" className="text-white text-center text-sm sm:text-base mt-12 sm:mt-16 lg:mt-20 mb-4">
            هذا الموقع محمي بواسطة reCAPTCHA و Google
            <span className="text-[#38FFE5] cursor-pointer">
              {" "}
              سياسة الخصوصية{" "}
            </span>
            و
            <span className="text-[#38FFE5] cursor-pointer"> شروط الخدمة </span>
          </p>
        </div>
      </div>
    </div>
  );
}
