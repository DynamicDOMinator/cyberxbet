"use client";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";

export default function TrainingChallenges() {
  const { isEnglish } = useLanguage();
  return (
    <div className="pt-36 mx-auto px-4 py-8 max-w-[2000px]">
      {/* Header Section */}
      <h1
        className={`text-3xl font-bold mb-2 ${
          isEnglish ? "text-left" : "text-right"
        }`}
      >
        {isEnglish ? "Training Challenges" : "التحديات التدريبية"}
      </h1>
      <p
        className={`pt-3 text-white ${isEnglish ? "text-left" : "text-right"}`}
      >
        {isEnglish
          ? "Training challenges provided by global companies to develop trainees' skills in various technical specialties such as cloud, security, and networking"
          : "تحديات تدريبية مقدمة من شركات عالمية لتطوير مهارات المتدربين في تخصصات تقنية مختلفة مثل السحابية والأمن والشبكات"}
      </p>

      {/* Challenges Grid */}
      <div className="grid mt-20 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Qwiklabs Challenge */}
        <div className="bg-white/5 rounded-lg p-6 flex flex-col h-full">
          <div
            className={`flex ${
              isEnglish ? "flex-row" : "flex-row-reverse"
            } gap-5 items-center mb-4`}
          >
            <div className="flex items-center justify-center">
              <Image
                src="/challnge3.png"
                alt="Qwiklabs"
                width={56}
                height={56}
              />
            </div>
            <h3
              className={`text-xl font-bold ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              R$4c3rT
            </h3>
          </div>
          <p
            className={`text-white ${
              isEnglish ? "text-left" : "text-right"
            } mb-6 flex-grow`}
          >
            Test your skills on the Google Cloud console without leaving your
            browser. Answer check-ins throughout the labs to increase your score
          </p>
          <div
            className={`flex ${
              isEnglish ? "flex-row" : "flex-row-reverse"
            } justify-between`}
          >
            <div>
              <p>
                {isEnglish ? "Difficulty Level: " : "مستوي الصعوبة :"}
                <span className="text-[#9DFF00]">
                  {isEnglish ? "Medium" : "متوسط"}
                </span>
              </p>
            </div>
            <button className="text-[#38FFE5] cursor-pointer hover:shadow-lg font-bold hover:shadow-[#38FFE5] hover:bg-[#38FFE5] hover:text-black transition-all duration-300 px-4 rounded-md">
              {isEnglish ? "Start Now" : "إبدأ الآن"}
            </button>
          </div>
        </div>

        {/* AWS Challenge */}
        <div className="bg-white/5 rounded-lg p-6 flex flex-col h-full">
          <div
            className={`flex ${
              isEnglish ? "flex-row" : "flex-row-reverse"
            } gap-5 items-center mb-4`}
          >
            <div className="flex items-center justify-center">
              <Image src="/challnge2.png" alt="AWS" width={56} height={56} />
            </div>
            <h3
              className={`text-xl font-bold ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              scray
            </h3>
          </div>
          <p
            className={`text-white ${
              isEnglish ? "text-left" : "text-right"
            } mb-6 flex-grow`}
          >
            Lab activities are designed to get hands-on experience working with
            real-world scenarios. Technical badges are awarded that you can
            share with your network after completion
          </p>
          <div
            className={`flex ${
              isEnglish ? "flex-row" : "flex-row-reverse"
            } justify-between`}
          >
            <div>
              <p>
                {isEnglish ? "Difficulty Level: " : "مستوي الصعوبة :"}
                <span className="text-[#00D0FF]">
                  {isEnglish ? " Easy" : " سهل"}
                </span>
              </p>
            </div>
            <button className="text-[#38FFE5] cursor-pointer hover:shadow-lg font-bold hover:shadow-[#38FFE5] hover:bg-[#38FFE5] hover:text-black transition-all duration-300 px-4 rounded-md">
              {isEnglish ? "Start Now" : "إبدأ الآن"}
            </button>
          </div>
        </div>

        {/* Firebase Challenge */}
        <div className="bg-white/5 rounded-lg p-6 flex flex-col h-full">
          <div
            className={`flex ${
              isEnglish ? "flex-row" : "flex-row-reverse"
            } gap-5 items-center mb-4`}
          >
            <div className="flex items-center justify-center">
              <Image src="/web.png" alt="Firebase" width={56} height={56} />
            </div>
            <h3
              className={`text-xl font-bold ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              Quest
            </h3>
          </div>
          <p
            className={`text-white ${
              isEnglish ? "text-left" : "text-right"
            } mb-6 flex-grow`}
          >
            Test your skills in this dynamic web application challenge. Analyze,
            adapt, and conquer!
          </p>
          <div
            className={`flex ${
              isEnglish ? "flex-row" : "flex-row-reverse"
            } justify-between`}
          >
            <div>
              <p>
                {isEnglish ? "Difficulty Level: " : "مستوي الصعوبة :"}
                <span className="text-red-500">
                  {isEnglish ? " Very Hard" : " صعب جدا"}
                </span>
              </p>
            </div>
            <button className="text-[#38FFE5] cursor-pointer hover:shadow-lg font-bold hover:shadow-[#38FFE5] hover:bg-[#38FFE5] hover:text-black transition-all duration-300 px-4 rounded-md">
              {isEnglish ? "Start Now" : "إبدأ الآن"}
            </button>
          </div>
        </div>
      </div>

      {/* New Challenges Grid */}
      <div className="grid grid-cols-1 mt-20 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Web Applications Challenge */}
        <div
          className="bg-white/1 rounded-lg p-6 flex flex-col lg:min-h-[400px]"
          style={{ boxShadow: "0px -5px 20px 0px #38FFE5 inset" }}
        >
          <div className="flex flex-col h-full justify-center gap-4 items-center mb-4">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/icon3-1.png"
                alt="Web Applications"
                width={200}
                height={200}
              />
            </div>
            <h3 className="text-xl font-bold text-center">
              {isEnglish ? "Web Applications" : "تطبيقات الويب"}
            </h3>
            <p className="text-white text-center">
              {isEnglish ? "12 Challenges" : "12 تحدي"}
            </p>
          </div>
        </div>

        {/* Miscellaneous Challenge */}
        <div
          className="bg-white/1 rounded-lg p-6 flex flex-col lg:min-h-[400px]"
          style={{ boxShadow: "0px -5px 20px 0px #38FFE5 inset" }}
        >
          <div className="flex flex-col h-full gap-4 justify-center items-center mb-4">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/icon6-1.png"
                alt="Miscellaneous"
                width={200}
                height={200}
              />
            </div>
            <h3 className="text-xl font-bold text-center">
              {isEnglish ? "Miscellaneous" : "متنوع"}
            </h3>
            <p className="text-white text-center">
              {isEnglish ? "12 Challenges" : "12 تحدي"}
            </p>
          </div>
        </div>

        {/* Reverse Engineering Challenge */}
        <div
          className="bg-white/1 rounded-lg p-6 flex flex-col lg:min-h-[400px]"
          style={{ boxShadow: "0px -5px 20px 0px #38FFE5 inset" }}
        >
          <div className="flex flex-col h-full gap-4 justify-center items-center mb-4">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/icon2-1.png"
                alt="Reverse Engineering"
                width={200}
                height={200}
              />
            </div>
            <h3 className="text-xl font-bold text-center">
              {isEnglish ? "Reverse Engineering" : "الهندسة العكسية"}
            </h3>
            <p className="text-white text-center">
              {isEnglish ? "12 Challenges" : "12 تحدي"}
            </p>
          </div>
        </div>

        {/* Cryptography Challenge */}
        <div
          className="bg-white/1 rounded-lg p-6 flex flex-col lg:min-h-[400px]"
          style={{ boxShadow: "0px -5px 20px 0px #38FFE5 inset" }}
        >
          <div className="flex flex-col h-full gap-4 justify-center items-center mb-4">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/icon1-1.png"
                alt="Cryptography"
                width={200}
                height={200}
              />
            </div>
            <h3 className="text-xl font-bold text-center">
              {isEnglish ? "Cryptography" : "التشفير"}
            </h3>
            <p className="text-white text-center">
              {isEnglish ? "12 Challenges" : "12 تحدي"}
            </p>
          </div>
        </div>

        {/* Digital Forensics Challenge */}
        <div
          className="bg-white/1 rounded-lg p-6 flex flex-col lg:min-h-[400px]"
          style={{ boxShadow: "0px -5px 20px 0px #38FFE5 inset" }}
        >
          <div className="flex flex-col h-full gap-4 justify-center items-center mb-4">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/icon4-1.png"
                alt="Digital Forensics"
                width={200}
                height={200}
              />
            </div>
            <h3 className="text-xl font-bold text-center">
              {isEnglish ? "Digital Forensics" : "التحليل الجنائي الرقمي"}
            </h3>
            <p className="text-white text-center">
              {isEnglish ? "12 Challenges" : "12 تحدي"}
            </p>
          </div>
        </div>

        {/* CyberXplytes Challenge */}
        <div
          className="bg-white/1 rounded-lg p-6 gap-4 flex flex-col lg:min-h-[400px]"
          style={{ boxShadow: "0px -5px 20px 0px #38FFE5 inset" }}
        >
          <div className="flex flex-col h-full justify-center items-center mb-4">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/icon5-1.png"
                alt="CyberXplytes"
                width={200}
                height={200}
              />
            </div>
            <h3 className="text-xl font-bold text-center">
              {isEnglish ? (
                <>
                  Learn with <span className="text-[#38FFE5]">CyberXbytes</span>
                </>
              ) : (
                <>
                  <span className="text-[#38FFE5]">CyberXbytes</span> تعلم مع
                </>
              )}
            </h3>
            <p className="text-white text-center">
              {isEnglish ? "12 Challenges" : "12 تحدي"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
