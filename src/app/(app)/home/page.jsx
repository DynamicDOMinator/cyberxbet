"use client";

import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";
import LoadingPage from "@/app/components/LoadingPage";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useRouter } from "next/navigation";
import { createSocket } from "@/lib/socket-client";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

export default function Home() {
  const { isEnglish } = useLanguage();
  const { userName, convertToUserTimezone } = useUserProfile();
  const [isLoaded, setIsLoaded] = useState(false);
  const [latestChallenges, setLatestChallenges] = useState([]);
  const [userData, setUserData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const router = useRouter();

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Function to fetch activities data
  const fetchActivities = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.get(
        `${apiUrl}/user/recentPlatformActivities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 8000, // 8 second timeout
        }
      );

      if (response.data && response.data.activities) {
        setActivities(response.data.activities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      // Don't modify existing activities on error
    }
  };

  // Initial data fetch
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

        // Fetch advertisements
        const adsResponse = await axios.get(`${apiUrl}/ads`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (adsResponse.data) {
          setAdvertisements(adsResponse.data);
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

        // Initial activities fetch
        await fetchActivities();

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

  // Socket connection for real-time activity updates
  useEffect(() => {
    let socket;

    // Only create socket if we have a username
    if (userName) {
      // Create or reuse socket
      socket = createSocket(userName);

      // Listen for events that should trigger activity refresh
      socket.on("newSolve", (data) => {
        fetchActivities();
      });

      socket.on("firstBlood", (data) => {
        fetchActivities();
      });

      socket.on("activityUpdate", (data) => {
        fetchActivities();
      });

      // Join activity room
      socket.emit("joinActivityRoom");
    }

    // Clean up event listeners on unmount
    return () => {
      if (socket) {
        socket.off("newSolve");
        socket.off("firstBlood");
        socket.off("activityUpdate");

        // Leave activity room
        socket.emit("leaveActivityRoom");
      }
    };
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

  // Function to translate Arabic difficulty to English
  const translateDifficultyToEnglish = (difficulty) => {
    switch (difficulty) {
      case "صعب":
        return "Hard";
      case "صعب جدا":
        return "Very Hard";
      case "متوسط":
        return "Medium";
      case "سهل":
        return "Easy";
      default:
        return "Easy";
    }
  };

  return isLoaded ? (
    <div className="max-w-[2000px] mx-auto pb-10 mt-20">
      {/* Swiper Slider with Effect Coverflow */}
      <div className="lg:pt-28 pt-12 lg:px-16 px-5">
        <h1
          className={`${
            isEnglish ? "text-left" : "text-right"
          } text-white text-[18px] font-semibold`}
        >
          {isEnglish ? "Advertisements" : "الاعلانات"}
        </h1>

        {advertisements.length > 0 ? (
          <div className="bg-white/3 backdrop-blur-xl mt-8 rounded-2xl h-[250px] sm:h-[300px] md:h-[350px] lg:h-[420px] w-full overflow-hidden p-4">
            <Swiper
              effect={"coverflow"}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={1}
              initialSlide={0}
              loop={true}
              speed={800}
              autoplay={{
                delay: 6000,
                disableOnInteraction: false,
              }}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 1.5,
                slideShadows: false,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  coverflowEffect: {
                    depth: 150,
                    modifier: 1.5,
                  },
                },
                768: {
                  slidesPerView: 2,
                  coverflowEffect: {
                    depth: 150,
                    modifier: 1.8,
                  },
                },
                1024: {
                  slidesPerView: 3,
                  coverflowEffect: {
                    depth: 200,
                    modifier: 2,
                  },
                },
              }}
              modules={[EffectCoverflow, Autoplay]}
              className="h-full w-full home-coverflow-slider"
            >
              {advertisements.map((ad) => (
                <SwiperSlide
                  key={ad.id}
                  className="h-full w-full flex items-center justify-center"
                >
                  <Link
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-[90%] h-[90%] mx-auto block"
                  >
                    <Image
                      src={ad.image}
                      alt={`Advertisement ${ad.id}`}
                      fill
                      className="object-cover rounded-2xl"
                      priority={ad.id === advertisements[0].id}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="bg-white/3 backdrop-blur-xl mt-8 rounded-lg p-4 lg:h-[400px] w-full">
            <div className="flex flex-col items-center justify-center lg:h-[400px] h-[200px] gap-4">
              <Image
                src="/ads.png"
                alt="Advertisement"
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
        )}
      </div>

      <div className="lg:px-16 pt-20 px-5 ">
        <h2
          className={`text-white text-[18px] ${
            isEnglish ? "text-left" : "text-right"
          } font-semibold`}
        >
          {isEnglish ? "Level Progress" : "مستوى التقدم"}
        </h2>

        <div className="flex lg:flex-row flex-col lg:gap-14 gap-8 items-center justify-between pt-8">
          <div className="lg:basis-2/3 w-full bg-white/3 backdrop-blur-xl rounded-2xl py-6 sm:py-10 px-3 h-[165px] sm:px-4 lg:px-10">
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
              {userData?.next_title === null &&
              userData?.next_title_arabic === null
                ? isEnglish
                  ? "Congratulations! You've reached the maximum level."
                  : "تهانيا! لقد وصلت إلى الحد الأقصى."
                : isEnglish
                ? `${
                    userData?.percentage_for_next_title
                      ? Math.floor(userData.percentage_for_next_title)
                      : 0
                  }% remaining to achieve ${
                    userData?.next_title || "Professional"
                  } status`
                : `متبقي ${
                    userData?.percentage_for_next_title
                      ? Math.floor(userData.percentage_for_next_title)
                      : 0
                  }% للحصول على لقب ${
                    userData?.next_title_arabic || userData?.next_title || ""
                  }`}
            </p>
          </div>

          <div className="lg:basis-1/3 w-full">
            <div className="flex flex-col items-center gap-3 sm:gap-4 bg-white/3 h-[165px] backdrop-blur-xl rounded-2xl p-3 sm:p-4">
              <Image src="/ranking.png" alt="progress" width={56} height={56} />
              <p className="text-[#BCC9DB] text-[16px] sm:text-[18px]">
                {userData?.rank > 0
                  ? userData.rank
                  : isEnglish
                  ? "No Ranking"
                  : "لا يوجد تصنيف"}
              </p>
              <p className="text-white text-[16px] sm:text-[18px]">
                {isEnglish ? "Rank" : "تصنيفك"}
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[56px]  lg:px-16  px-5"
      >
        {latestChallenges.map((challenge) => (
          <div
            key={challenge.uuid}
            className="bg-white/3 backdrop-blur-xl rounded-[16px] p-4 flex flex-col justify-between min-h-[242px]"
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
              <p
                dir={isEnglish ? "ltr" : "rtl"}
                className="text-white text-[18px] pt-3 pb-[32px]"
              >
                {truncateText(challenge.description, 170)}
              </p>
            </div>

            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex lg:flex lg:flex-wrap items-center justify-between "
            >
              <p>
                {isEnglish ? (
                  <>
                    Difficulty Level:{" "}
                    <span className={getDifficultyColor(challenge.difficulty)}>
                      {translateDifficultyToEnglish(challenge.difficulty)}
                    </span>
                  </>
                ) : (
                  <>
                    مستوى الصعوبة :{" "}
                    <span className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </span>
                  </>
                )}
              </p>
              <p className="text-[#38FFE5] text-[18px] font-semibold cursor-pointer hover:brightness-110 hover:bg-[#38FFE5]/10 hover:transition-all duration-300 hover:p-1 rounded-lg ">
                <Link href={`/challnge/${challenge.uuid}`}>
                  {isEnglish ? "Start Now" : "ابدأ الآن"}
                </Link>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="md:px-16 pt-20 ">
        <h2
          className={`text-white text-[18px] pb-8 ${
            isEnglish ? "text-left" : "text-right"
          } font-semibold`}
        >
          {isEnglish ? "Latest Activities" : "أحدث الانشطة"}
        </h2>
        <div className="px-4 lg:px-10 py-6 lg:py-10 bg-[#06373F26] rounded-2xl">
          <div className="overflow-x-auto">
            <div className="min-w-[768px] w-full">
              {/* Header wrapper div */}
              <div className="rounded-2xl bg-[#38FFE50D] mb-6 lg:mb-10">
                <table className={`w-full ${isEnglish ? "pl-5" : "pr-5"}`}>
                  <thead>
                    <tr
                      className={`text-white ${
                        isEnglish ? "flex-row-reverse" : "flex-row"
                      } flex items-center justify-between`}
                    >
                      <th
                        className={`py-4 lg:py-5 w-[25%] px-6 text-sm lg:text-base ${
                          isEnglish
                            ? "text-right pl-4 lg:pl-6"
                            : "text-left pr-4 lg:pr-6"
                        }`}
                      >
                        {isEnglish ? "Time" : "التوقيت"}
                      </th>
                      <th
                        className={`py-4 lg:py-5 w-[25%]  text-sm lg:text-base ${
                          isEnglish ? "text-center" : "text-center"
                        }`}
                      >
                        {isEnglish ? "Bytes" : "البايتس"}
                      </th>
                      <th
                        className={`py-4 lg:py-5 w-[50%] text-sm lg:text-base ${
                          isEnglish
                            ? "text-left pl-4 lg:pl-6"
                            : "text-right pr-4 lg:pr-6"
                        }`}
                      >
                        {isEnglish ? "User" : "المستخدم"}
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Body rows */}
              {activities.map((activity, index) => {
                const solvedDate = convertToUserTimezone(activity.solved_at);
                const now = new Date();
                const diffTime = Math.abs(now - solvedDate);
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                let timeAgo = "";
                if (diffDays > 0) {
                  timeAgo = isEnglish
                    ? `${diffDays} days ago`
                    : `منذ ${diffDays} يوم`;
                } else if (diffHours > 0) {
                  timeAgo = isEnglish
                    ? `${diffHours} hours ago`
                    : `منذ ${diffHours} ساعة`;
                } else {
                  timeAgo = isEnglish
                    ? `${diffMinutes} minutes ago`
                    : `منذ ${diffMinutes} دقيقة`;
                }

                return (
                  <div
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-[#06373F] rounded-2xl" : ""
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
                            className={`py-3 lg:py-4 text-white/70 w-[25%] px-5 text-left text-sm lg:text-base ${
                              isEnglish ? "pl-4 lg:pl-6 text-right" : "pr-4 lg:pr-6"
                            }`}
                          >
                            {timeAgo}
                          </td>
                          <td className="py-3 lg:py-4 w-[25%] ">
                            <div
                              dir={isEnglish ? "ltr" : "rtl"}
                              className={`flex  justify-center items-center gap-2 pl-20   ${
                                isEnglish ? "pr-32" : "pl-20"
                              }`}
                            >
                              <div className="flex flex-row-reverse justify-start items-center gap-1 w-[120px] ">
                                <span className="text-white text-sm lg:text-base">
                                  {activity.is_first_blood
                                    ? activity.bytes
                                    : activity.total_bytes}
                                </span>

                                <span className="text-red-500 text-sm">
                                  {activity.is_first_blood &&
                                  activity.first_blood_bytes > activity.bytes
                                    ? `${isEnglish ? "bytes" : "بايتس"} ${
                                        activity.first_blood_bytes -
                                        activity.bytes
                                      }+`
                                    : ""}
                                </span>
                              </div>

                              <Image
                                src={
                                  activity.is_first_blood
                                    ? "/blood.png"
                                    : "/byte.png"
                                }
                                alt={
                                  activity.is_first_blood
                                    ? "first blood"
                                    : "points"
                                }
                                width={25}
                                height={30}
                                className=""
                              />
                            </div>
                          </td>
                          <td className="py-3 lg:py-4 w-[50%]">
                            <div
                              dir={isEnglish ? "ltr" : "rtl"}
                              className={`flex items-center  gap-2 lg:gap-3 ${
                                isEnglish ? "pl-4 lg:pl-6" : "pr-4 lg:pr-6"
                              }`}
                            >
                              <span className="text-sm lg:text-base min-w-[20px] text-center">
                                {index + 1}
                              </span>
                              <Image
                                src={
                                  activity.user_profile_image || "/icon1.png"
                                }
                                alt="user"
                                width={24}
                                height={24}
                                className="rounded-full w-[30px] h-[30px]"
                              />
                              <span
                                onClick={() => {
                                  router.push(`/profile/${activity.user_name}`);
                                }}
                                className="text-white cursor-pointer text-sm lg:text-base"
                              >
                                {activity.user_name}
                              </span>
                              <span className="text-white text-sm lg:text-base ml-2">
                                {isEnglish
                                  ? activity.is_first_blood
                                    ? `got first bytes from ${activity.challenge_title}`
                                    : `earned bytes from ${activity.challenge_title}`
                                  : activity.is_first_blood
                                  ? `حصل على البايتس الاول في ${activity.challenge_title}`
                                  : `حصل على بايتس في ${activity.challenge_title}`}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <LoadingPage />
  );
}
