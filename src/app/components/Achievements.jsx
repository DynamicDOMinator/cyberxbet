import { useLanguage } from "@/app/context/LanguageContext";
import Image from "next/image";

export default function Achievements() {
  const { isEnglish } = useLanguage();
  return(
    <div className="flex lg:flex-row flex-col lg:gap-14 gap-8 items-center justify-between pt-8">
    <div className="lg:basis-2/3 w-full bg-white/3 backdrop-blur-xl rounded-lg py-10 px-4 lg:px-10">
      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="flex items-center gap-5"
      >
        <div className="w-[56px] h-[16px] bg-[#38FFE5] rounded-full"></div>
        <div className="w-[56px] h-[16px] bg-[#38FFE5] rounded-full"></div>
        <div className="w-[56px] h-[16px] bg-gradient-to-r from-[#06373F] to-[#38FFE5] rounded-full"></div>
        <div className="w-[56px] h-[16px] bg-[#003F49] rounded-full"></div>
        <div className="w-[56px] h-[16px] bg-[#003F49] rounded-full"></div>
        <div className="w-[56px] h-[16px] bg-[#003F49] rounded-full"></div>
        <div className="w-[56px] h-[16px] bg-[#003F49] rounded-full"></div>
      </div>
      <p
        className={`text-[#BCC9DB] ${
          isEnglish ? "text-left" : "text-right"
        } pt-10 text-[18px]`}
      >
        {isEnglish
          ? "60% remaining to achieve Professional status"
          : "متبقي 60% للحصول على  لقب محترف"}
      </p>
    </div>

    <div className="lg:basis-1/3 w-full">
      <div className="flex flex-col items-center gap-4 bg-white/3 backdrop-blur-xl rounded-lg p-4">
        <Image src="/ranking.png" alt="progress" width={36} height={36} />
        <p className="text-[#BCC9DB] text-[18px]">
          {isEnglish ? "No Ranking" : "لا يوجد تصنيف"}
        </p>
        <p className="text-white text-[18px]">
          {isEnglish ? "Your Ranking" : "تصنيفك"}
        </p>
      </div>
    </div>
  </div>
  )
}

