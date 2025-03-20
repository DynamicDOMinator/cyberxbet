"use client";

import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";
import Achievements from "@/app/components/Achievements";
export default function Home() {
  const { isEnglish } = useLanguage();

  return (
    <div className="max-w-[2000px] mx-auto pb-10 mt-20">
      {/* ads section  */}
      <div className="lg:pt-28 pt-12 lg:px-16 px-5  ">
        <h1
          className={`${
            isEnglish ? "text-left" : "text-right"
          } text-white text-[18px] font-semibold`}
        >
          {isEnglish ? "Advertisements" : "الاعلانات"}
        </h1>

        <div className="bg-white/3 backdrop-blur-xl mt-8 rounded-lg p-4 lg:h-[400px] w-full ">
          <div className="flex flex-col  items-center justify-center lg:h-[400px] h-[200px] gap-4">
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

      <div className="lg:px-16 pt-20 px-5 ">
        <h2
          className={`text-white text-[18px] ${
            isEnglish ? "text-left" : "text-right"
          } font-semibold`}
        >
          {isEnglish ? "Progress Level" : "مستوى التقدم"}
        </h2>

        <Achievements />
      </div>

      <div className="lg:px-16 pt-20 px-5  ">
        <h2
          className={`text-white text-[18px] pb-8 ${
            isEnglish ? "text-left" : "text-right"
          } font-semibold`}
        >
          {isEnglish ? "Latest Challenges" : "آخر التحديات"}
        </h2>

        <div
          dir={isEnglish ? "ltr" : "rtl"}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="bg-white/3 backdrop-blur-xl rounded-lg p-4 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center gap-4">
                <Image src="/web.png" alt="progress" width={56} height={56} />
                <h3 className="text-white text-[24px] font-bold">Quest</h3>
              </div>
              <p className="text-white text-left text-[18px] pt-5">
                Test your skills in this dynamic web application challenge.
                Analyze, adapt, and conquer!
              </p>
            </div>

            <div className="flex  lg:flex lg:flex-wrap items-center justify-between gap-4 pt-10">
              <p>
                {isEnglish ? (
                  <>
                    Difficulty Level:{" "}
                    <span className="text-red-600">Very Hard</span>
                  </>
                ) : (
                  <>
                    مستوي الصعوبة :{" "}
                    <span className="text-red-600">صعب جدا</span>
                  </>
                )}
              </p>
              <p className="text-[#38FFE5] text-[18px] font-semibold cursor-pointer hover:brightness-110">
                {isEnglish ? "Start Now" : "ابدأ الآن"}
              </p>
            </div>
          </div>

          <div className="bg-white/3 backdrop-blur-xl rounded-lg p-4 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center gap-4">
                <Image
                  src="/challnge2.png"
                  alt="progress"
                  width={56}
                  height={56}
                />
                <h3 className="text-white text-[24px] font-bold">Scray</h3>
              </div>
              <p className="text-white text-left text-[18px] pt-5">
                Participants will encounter an audio file containing a hidden
                flag. They must carefully analyze the file to uncover the hidden
                message. Use your skills to explore this challenge!
              </p>
            </div>

            <div className="flex  lg:flex lg:flex-wrap lg:flex-row items-center justify-between gap-4 pt-10">
              <p>
                {isEnglish ? (
                  <>
                    Difficulty Level:{" "}
                    <span className="text-[#38FFE5]">Easy</span>
                  </>
                ) : (
                  <>
                    مستوي الصعوبة : <span className="text-[#38FFE5]">سهل</span>
                  </>
                )}
              </p>
              <p className="text-[#38FFE5] text-[18px] font-semibold cursor-pointer hover:brightness-110">
                {isEnglish ? "Start Now" : "ابدأ الآن"}
              </p>
            </div>
          </div>

          <div className="bg-white/3 backdrop-blur-xl rounded-lg p-4 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center gap-4">
                <Image
                  src="/challnge3.png"
                  alt="progress"
                  width={56}
                  height={56}
                />
                <h3 className="text-white text-[24px] font-bold">Quest</h3>
              </div>
              <p className="text-white text-left text-[18px] pt-5">
                Sometimes RSA certificates are breakable. Can you find the
                vulnerability?
              </p>
            </div>

            <div className="flex lg:flex lg:flex-wrap items-center justify-between gap-4 pt-10">
              <p>
                {isEnglish ? (
                  <>
                    Difficulty Level:{" "}
                    <span className="text-[#9DFF00]">Medium</span>
                  </>
                ) : (
                  <>
                    مستوي الصعوبة :{" "}
                    <span className="text-[#9DFF00]">متوسط</span>
                  </>
                )}
              </p>
              <p className="text-[#38FFE5] text-[18px] font-semibold cursor-pointer hover:brightness-110">
                {isEnglish ? "Start Now" : "ابدأ الآن"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:px-16 pt-20 px-5">
        <h2
          className={`text-white text-[18px] pb-8 ${
            isEnglish ? "text-left" : "text-right"
          } font-semibold`}
        >
          {isEnglish ? "Activity History" : "أحدث الانشطة"}
        </h2>
        <div className="px-4 lg:px-10 py-6 lg:py-10 bg-[#06373F26] rounded-lg">
          <div className="overflow-x-auto">
            <div className="min-w-[768px] w-full">
              {/* Header wrapper div */}
              <div className="rounded-lg bg-[#38FFE50D] mb-6 lg:mb-10">
                <table className={`w-full ${isEnglish ? "pl-5" : "pr-5"}`}>
                  <thead>
                    <tr
                      className={`text-white ${
                        isEnglish ? "flex-row-reverse" : "flex-row"
                      } flex items-center justify-between`}
                    >
                      <th
                        className={`py-3 lg:py-4 w-[25%] text-sm lg:text-base ${
                          isEnglish
                            ? "text-left pl-3 lg:pl-5"
                            : "text-right pr-3 lg:pr-5"
                        }`}
                      >
                        {isEnglish ? "Time" : "التوقيت"}
                      </th>
                      <th
                        className={`py-3 lg:py-4 w-[25%] text-sm lg:text-base ${
                          isEnglish ? "text-left" : "text-right"
                        }`}
                      >
                        {isEnglish ? "Bytes" : "البايتس"}
                      </th>
                      <th
                        className={`py-3 lg:py-4 w-[50%] text-sm lg:text-base ${
                          isEnglish
                            ? "text-left pl-3 lg:pl-5"
                            : "text-right pr-3 lg:pr-5"
                        }`}
                      >
                        {isEnglish ? "User" : "المستخدم"}
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Body rows */}
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className={`${
                    index % 2 === 0 ? "bg-[#06373F] rounded-lg" : ""
                  } mb-2`}
                >
                  <table className="w-full">
                    <tbody>
                      <tr
                        className={`flex items-center justify-between ${
                          isEnglish ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <td
                          dir={isEnglish ? "ltr" : "rtl"}
                          className={`py-2 lg:py-3 text-white/70 w-[25%] text-sm lg:text-base ${
                            isEnglish ? "pl-3 lg:pl-5" : "pr-3 lg:pr-5"
                          }`}
                        >
                          {isEnglish ? "52 minutes ago" : "منذ 52 دقيقة"}
                        </td>
                        <td className="py-2 lg:py-3 w-[25%]">
                          <div
                            dir={isEnglish ? "ltr" : "rtl"}
                            className={`flex items-center gap-1 lg:gap-2 ${
                              isEnglish ? "pl-0" : "pr-0"
                            }`}
                          >
                            <span className="text-white text-sm lg:text-base">
                              1000
                            </span>
                            <Image
                              src="/point.png"
                              alt="points"
                              width={20}
                              height={24}
                              className="lg:w-[25px] lg:h-[30px]"
                            />
                          </div>
                        </td>
                        <td className="py-2 lg:py-3 w-[50%]">
                          <div
                            dir={isEnglish ? "ltr" : "rtl"}
                            className={`flex items-center gap-2 lg:gap-3 ${
                              isEnglish ? "pl-2 lg:pl-3" : "pr-2 lg:pr-3"
                            }`}
                          >
                            <span className="text-sm lg:text-base">
                              {index + 1}
                            </span>
                            <Image
                              src="/user.png"
                              alt="user"
                              width={24}
                              height={24}
                              className="rounded-full lg:w-[32px] lg:h-[32px]"
                            />
                            <span className="text-white text-sm lg:text-base">
                              MahmoudFatouh
                            </span>
                            <span className="text-white text-sm lg:text-base">
                              {isEnglish
                                ? "earned bytes in Txen"
                                : "حصل على بايتس في Txen"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
