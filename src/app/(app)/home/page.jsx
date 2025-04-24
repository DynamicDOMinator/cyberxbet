"use client";

import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";
import Achievements from "@/app/components/Achievements";
import LoadingPage from "@/app/components/LoadingPage";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";

export default function Home() {
  const { isEnglish } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [latestChallenges, setLatestChallenges] = useState([]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(`${apiUrl}/last-Three-challenges`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.status === "success") {
          setLatestChallenges(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching challenges:", error);
      }

      setIsLoaded(true);
    };

    fetchChallenges();
  }, []);

  // Function to determine difficulty color
  const getDifficultyColor = (difficulty) => {
    if (difficulty === "صعب" || difficulty === "صعب جدا") {
      return "text-red-600";
    } else if (difficulty === "متوسط") {
      return "text-[#9DFF00]";
    } else {
      return "text-[#38FFE5]"; // Easy
    }
  };

  return isLoaded ? (
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
  ) : (
    <LoadingPage />
  );
}
