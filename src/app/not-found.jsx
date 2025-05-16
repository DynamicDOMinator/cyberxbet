"use client";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "./context/LanguageContext";

export default function NotFound() {
  const { isEnglish } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0D0F] px-4 sm:px-10 mx-auto">
      <div className="text-center">
        <div className="relative  ">
          <Image
            src="/404.png"
            alt="Not Found"
            width={1000}
            height={1000}
            className="w-[475px] h-[350px]"
          />
        </div>

        <div className="relative mb-8">
          <div className="flex justify-center">
            <div className="relative">
            
            </div>
          </div>
        </div>

        <h2 className="text-2xl md:text-4xl font-semibold text-white mb-10">
          {isEnglish ? "Page Not Found" : "لم يتم العثور على الصفحة"}
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
