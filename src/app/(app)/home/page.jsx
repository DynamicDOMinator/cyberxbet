"use client";
import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";
export default function Home() {
  const { isEnglish } = useLanguage();

  return (
    <div>
      {/* ads section  */}
      <div className="mt-28 px-16">
        <h2 className={`${isEnglish ? "text-left" : "text-right"} text-[18px] font-semibold`}>
          {isEnglish ? "Advertisements" : "الاعلانات"}
        </h2>

        <div className="bg-gray-700/30 mt-8 rounded-lg p-4 lg:h-[400px] w-full ">
          <div className="flex flex-col  items-center justify-center h-[400px] gap-4">
            <Image
              src="/ads.png"
            
              alt="Advertisement 1"
              width={120}
              height={120}
            />
            <p className="text-center text-gray-500">
              {isEnglish
                ? "No advertisements available at the moment"
                : "لا توجد إعلانات في الوقت الحالي"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
