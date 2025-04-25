"use client";
import Link from "next/link";

import { useLanguage } from "./context/LanguageContext";

export default function NotFound() {
  const { isEnglish } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 sm:px-10 mx-auto">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#38FFE5]/20 rounded-full blur-3xl"></div>
          <h1 className="text-8xl md:text-9xl font-bold text-white relative z-10">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]">
              4
            </span>
            <span className="inline-block relative">
              <svg
                className="w-20 h-20 md:w-24 md:h-24 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                viewBox="0 0 128 128"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M64 104C86.0914 104 104 86.0914 104 64C104 41.9086 86.0914 24 64 24C41.9086 24 24 41.9086 24 64C24 86.0914 41.9086 104 64 104Z"
                  stroke="url(#paint0_linear)"
                  strokeWidth="6"
                />
                <path
                  d="M64 84C75.0457 84 84 75.0457 84 64C84 52.9543 75.0457 44 64 44C52.9543 44 44 52.9543 44 64C44 75.0457 52.9543 84 64 84Z"
                  stroke="url(#paint1_linear)"
                  strokeWidth="6"
                />
                <path
                  d="M114 64H104M24 64H14M64 114V104M64 24V14M98.9 98.9L91.9 91.9M36.1 36.1L29.1 29.1M98.9 29.1L91.9 36.1M36.1 91.9L29.1 98.9"
                  stroke="url(#paint2_linear)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear"
                    x1="24"
                    y1="24"
                    x2="104"
                    y2="104"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00E2FF" />
                    <stop offset="1" stopColor="#00F5A0" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear"
                    x1="44"
                    y1="44"
                    x2="84"
                    y2="84"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00E2FF" />
                    <stop offset="1" stopColor="#00F5A0" />
                  </linearGradient>
                  <linearGradient
                    id="paint2_linear"
                    x1="14"
                    y1="14"
                    x2="114"
                    y2="114"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00E2FF" />
                    <stop offset="1" stopColor="#00F5A0" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="opacity-0">0</span>
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]">
              4
            </span>
          </h1>
        </div>

        <div className="relative mb-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="relative z-10 bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-[#38FFE5]/20">
                <svg
                  className="w-32 h-32 mx-auto"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_1_2)">
                    <path
                      d="M100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180Z"
                      fill="black"
                      stroke="url(#paint0_linear)"
                      strokeWidth="2"
                    />
                    <path
                      d="M100 160C133.137 160 160 133.137 160 100C160 66.8629 133.137 40 100 40C66.8629 40 40 66.8629 40 100C40 133.137 66.8629 160 100 160Z"
                      stroke="url(#paint1_linear)"
                      strokeWidth="2"
                    />
                    <path
                      d="M100 140C122.091 140 140 122.091 140 100C140 77.9086 122.091 60 100 60C77.9086 60 60 77.9086 60 100C60 122.091 77.9086 140 100 140Z"
                      stroke="url(#paint2_linear)"
                      strokeWidth="2"
                    />
                    <path
                      d="M157 71L177 90M116 116L138 141M71 157L90 177M42 116L20 143M23 59L43 83M116 42L141 20M157 129L177 110"
                      stroke="url(#paint3_linear)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M85 80L65 120M115 80L135 120M75 120H125"
                      stroke="url(#paint4_linear)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </g>
                  <defs>
                    <linearGradient
                      id="paint0_linear"
                      x1="20"
                      y1="20"
                      x2="180"
                      y2="180"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#00E2FF" />
                      <stop offset="1" stopColor="#00F5A0" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear"
                      x1="40"
                      y1="40"
                      x2="160"
                      y2="160"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#00E2FF" />
                      <stop offset="1" stopColor="#00F5A0" />
                    </linearGradient>
                    <linearGradient
                      id="paint2_linear"
                      x1="60"
                      y1="60"
                      x2="140"
                      y2="140"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#00E2FF" />
                      <stop offset="1" stopColor="#00F5A0" />
                    </linearGradient>
                    <linearGradient
                      id="paint3_linear"
                      x1="20"
                      y1="20"
                      x2="177"
                      y2="177"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#00E2FF" />
                      <stop offset="1" stopColor="#00F5A0" />
                    </linearGradient>
                    <linearGradient
                      id="paint4_linear"
                      x1="65"
                      y1="80"
                      x2="135"
                      y2="120"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#00E2FF" />
                      <stop offset="1" stopColor="#00F5A0" />
                    </linearGradient>
                    <clipPath id="clip0_1_2">
                      <rect width="200" height="200" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl md:text-4xl font-semibold text-white mb-10">
          {isEnglish ? "User Not Found" : "لم يتم العثور على الصفحة"}
        </h2>

      
        <Link
          href="/home"
          className="inline-block bg-transparent border-2 border-[#38FFE5] hover:bg-[#38FFE5]/10 text-[#38FFE5] font-semibold py-3 px-8 rounded-full transition-all duration-300"
        >
          {isEnglish ? "Return to Homepage" : "العودة للصفحة الرئيسية"}
        </Link>
      </div>
    </div>
  );
}
