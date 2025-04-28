"use client";

import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";
import LoadingPage from "@/app/components/LoadingPage";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Home() {
  const { isEnglish } = useLanguage();
  const { userName } = useUserProfile();
  const [isLoaded, setIsLoaded] = useState(false);
  const [latestChallenges, setLatestChallenges] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");

        // Fetch challenges
        const challengesResponse = await axios.get(
          `${apiUrl}/last-Three-challenges`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (challengesResponse.data.status === "success") {
          setLatestChallenges(challengesResponse.data.data);
        }

        // Fetch user data - using the same endpoint as user-profile page
        if (userName) {
          const userResponse = await axios.get(
            `${apiUrl}/user/stats/${userName}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (userResponse.data && userResponse.data.user) {
            setUserData(userResponse.data.user);
          }
        }

        // Only set isLoaded to true after all data has been processed
        setIsLoaded(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Even in case of error, we should set isLoaded to true to prevent infinite loading
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [userName]);

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
      <div className="lg:pt-28 pt-12 lg:px-16 px-5">
        <h1
          className={`${
            isEnglish ? "text-left" : "text-right"
          } text-white text-[18px] font-semibold`}
        >
          {isEnglish ? "Advertisements" : "الاعلانات"}
        </h1>

        {/* First Image Slider */}
        <div className="bg-white/3 backdrop-blur-xl mt-8 rounded-lg p-4 lg:h-[400px] w-full relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{
              nextEl: ".swiper-button-next-1",
              prevEl: ".swiper-button-prev-1",
            }}
            pagination={{
              clickable: true,
              el: ".swiper-pagination-1",
              renderBullet: function (index, className) {
                return `<span class="${className} bg-[#38FFE5]"></span>`;
              },
            }}
            autoplay={{ delay: 3000 }}
            className="h-full"
          >
            <SwiperSlide>
              <div className="flex items-center justify-center h-full">
                <Image
                  src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070"
                  alt="Advertisement 1"
                  width={800}
                  height={400}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="flex items-center justify-center h-full">
                <Image
                  src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070"
                  alt="Advertisement 2"
                  width={800}
                  height={400}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="flex items-center justify-center h-full">
                <Image
                  src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070"
                  alt="Advertisement 3"
                  width={800}
                  height={400}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
            </SwiperSlide>
          </Swiper>
          <div className="swiper-pagination-1"></div>
          <div className="swiper-button-next-1"></div>
          <div className="swiper-button-prev-1"></div>
        </div>

        {/* Cards Slider */}
        <div className="bg-white/3 backdrop-blur-xl mt-12 rounded-lg p-4 w-full relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 1,
              },
              1024: {
                slidesPerView: 1,
              },
            }}
            navigation={{
              nextEl: ".swiper-button-next-2",
              prevEl: ".swiper-button-prev-2",
            }}
            pagination={{
              clickable: true,
              el: ".swiper-pagination-2",
              renderBullet: function (index, className) {
                return `<span class="${className} bg-[#38FFE5]"></span>`;
              },
            }}
            className="h-full"
          >
            <SwiperSlide>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Cyber Security"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Cyber Security
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        Advanced security protocols
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Network Defense"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Network Defense
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        Protect your network
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Ethical Hacking"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Ethical Hacking
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        Learn penetration testing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Data Protection"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Data Protection
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        Secure your information
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Malware Analysis"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Malware Analysis
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        Identify threats
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Incident Response"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Incident Response
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        Handle breaches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Security Audit"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Security Audit
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        System assessment
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Risk Management"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Risk Management
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        Mitigate risks
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/3 backdrop-blur-xl rounded-lg overflow-hidden h-[300px] group hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070"
                    alt="Cloud Security"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-bold">
                        Cloud Security
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        Cloud protection
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
          <div className="swiper-pagination-2"></div>
          <div className="swiper-button-next-2"></div>
          <div className="swiper-button-prev-2"></div>
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

        <div className="flex lg:flex-row flex-col lg:gap-14 gap-8 items-center justify-between pt-8">
          <div className="lg:basis-2/3 w-full bg-white/3 backdrop-blur-xl rounded-lg py-6 sm:py-10 px-3 sm:px-4 lg:px-10">
            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex items-center justify-between sm:justify-start sm:gap-5 gap-2 w-full"
            >
              {/* Render progress dots based on percentage */}
              {[...Array(7)].map((_, index) => {
                // Each dot represents ~14.3% (100/7)
                const dotThreshold = (index + 1) * (100 / 7);
                const percentageCompleted =
                  100 - (userData?.percentage_for_next_title || 0);

                // Determine the class based on the completion status
                let bgClass = "";
                if (percentageCompleted >= dotThreshold) {
                  bgClass = "bg-[#38FFE5]"; // Completed
                } else if (
                  percentageCompleted > dotThreshold - 100 / 7 &&
                  percentageCompleted < dotThreshold
                ) {
                  bgClass = "bg-gradient-to-r from-[#06373F] to-[#38FFE5]"; // In progress
                } else {
                  bgClass = "bg-[#003F49]"; // Not started
                }

                return (
                  <div
                    key={index}
                    className={`flex-1 max-w-[56px] h-[10px] sm:h-[16px] ${bgClass} rounded-full`}
                  ></div>
                );
              })}
            </div>
            <p
              dir={isEnglish ? "ltr" : "rtl"}
              className={`text-[#BCC9DB] ${
                isEnglish ? "text-left" : "text-right"
              } pt-10 text-[18px]`}
            >
              {isEnglish
                ? `${
                    userData?.percentage_for_next_title || 0
                  }% remaining to achieve ${
                    userData?.next_title || "Professional"
                  } status`
                : `متبقي ${
                    userData?.percentage_for_next_title
                      ? Math.floor(userData.percentage_for_next_title)
                      : 0
                  }% للحصول على  لقب ${userData?.next_title || ""}`}
            </p>
          </div>

          <div className="lg:basis-1/3 w-full">
            <div className="flex flex-col items-center gap-3 sm:gap-4 bg-white/3 backdrop-blur-xl rounded-lg p-3 sm:p-4">
              <Image src="/ranking.png" alt="progress" width={36} height={36} />
              <p className="text-[#BCC9DB] text-[16px] sm:text-[18px]">
                {userData?.rank > 0
                  ? userData.rank
                  : isEnglish
                  ? "No Ranking"
                  : "لا يوجد تصنيف"}
              </p>
              <p className="text-white text-[16px] sm:text-[18px]">
                {isEnglish ? "Your Ranking" : "تصنيفك"}
              </p>
            </div>
          </div>
        </div>
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

      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8  lg:px-16 pt-10 px-5"
      >
        {latestChallenges.map((challenge) => (
          <div
            key={challenge.uuid}
            className="bg-white/3 backdrop-blur-xl rounded-lg p-4 flex flex-col justify-between min-h-[300px]"
          >
            <div>
              <div className="flex items-center gap-4">
                <Image
                  src={
                    challenge.category_icon_url || `/${challenge.category_icon}`
                  }
                  alt={challenge.category?.name || "challenge"}
                  width={56}
                  height={56}
                />
                <h3 className="text-white text-[24px] font-bold">
                  {challenge.title}
                </h3>
              </div>
              <p className="text-white text-left text-[18px] pt-5">
                {challenge.description}
              </p>
            </div>

            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex lg:flex lg:flex-wrap items-center justify-between gap-4 pt-10"
            >
              <p>
                {isEnglish ? (
                  <>
                    Difficulty Level:{" "}
                    <span className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </span>
                  </>
                ) : (
                  <>
                    مستوي الصعوبة :{" "}
                    <span className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </span>
                  </>
                )}
              </p>
              <p className="text-[#38FFE5] text-[18px] font-semibold cursor-pointer hover:brightness-110">
                <Link href={`/challnge/${challenge.uuid}`}>
                  {isEnglish ? "Start Now" : "ابدأ الآن"}
                </Link>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:px-16 pt-20 ">
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
                              src="/byte.png"
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
