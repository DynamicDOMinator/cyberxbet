"use client";
import { useLanguage } from "@/app/context/LanguageContext";
import { FaTiktok } from "react-icons/fa6";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

import { FaInstagram } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import ActivityChart from "@/app/components/ActivityChart";
import LoadingPage from "@/app/components/LoadingPage";
import { Inter } from "next/font/google";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";

const inter = Inter({ subsets: ["latin"] });

// Function to format date strings
const formatDate = (dateString, isEnglish) => {
  const date = new Date(dateString);

  if (isEnglish) {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  } else {
    // Arabic format: ١ مايو ٢٠٢٥ في ٠٧:٤٢ م
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Convert to Arabic digits
    const toArabicDigits = (num) => {
      const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      return String(num)
        .split("")
        .map((digit) => arabicDigits[parseInt(digit)])
        .join("");
    };

    // Arabic month names
    const arabicMonths = [
      "يناير",
      "فبراير",
      "مارس",
      "إبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];

    // Format time as 12-hour with am/pm
    const isPM = hours >= 12;
    const hour12 = hours % 12 || 12;
    const ampm = isPM ? "م" : "ص";

    return `${toArabicDigits(day)} ${arabicMonths[month]} ${toArabicDigits(
      year
    )} في ${toArabicDigits(
      hour12.toString().padStart(2, "0")
    )}:${toArabicDigits(minutes.toString().padStart(2, "0"))} ${ampm}`;
  }
};

export default function Profile() {
  const { isEnglish } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [averageEyeLevel, setAverageEyeLevel] = useState(false);
  const [youSelected, setYouSelected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [skillsVisible, setSkillsVisible] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState({
    discord: { linked: false },
    instagram: { linked: false },
    linkedin: { linked: false },
    tiktok: { linked: false },
    youtube: { linked: false },
    twitter: { linked: false },
  });

  const [userData, setUserData] = useState({});
  const [challangesStats, setChallangesStats] = useState("");
  const [streak, setStreak] = useState(0);
  const [totalApprovedChallenges, setTotalApprovedChallenges] = useState(0);
  const [solvedByDifficulty, setSolvedByDifficulty] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
    very_hard: 0,
  });
  const [bytesByMonth, setBytesByMonth] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allUsersMedian, setAllUsersMedian] = useState([]);
  const [lab3Data, setLab3Data] = useState({
    total_challenges: 0,
    solved_challenges: 0,
    percentage_solved: 0,
    solved_by_difficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
      very_hard: 0,
    },
    total_bytes: 0,
    total_firstblood_bytes: 0,
  });
  const [userEvents, setUserEvents] = useState([]);
  const skillsSectionRef = useRef(null);
  const [activity, setActivity] = useState([]);
  const params = useParams();
  const router = useRouter();

  // Function to format time-ago from a timestamp
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return isEnglish
        ? `${diffInSeconds} seconds ago`
        : `منذ ${diffInSeconds} ثانية`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return isEnglish
        ? `${diffInMinutes} minutes ago`
        : `منذ ${diffInMinutes} دقيقة`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return isEnglish ? `${diffInHours} hours ago` : `منذ ${diffInHours} ساعة`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return isEnglish ? `${diffInDays} days ago` : `منذ ${diffInDays} يوم`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return isEnglish ? `${diffInMonths} months ago` : `منذ ${diffInMonths} شهر`;
  };

  const fetchSocialMediaLinks = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.get(`${apiUrl}/user/stats/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response data is valid
      if (
        !response.data ||
        !response.data.user ||
        Object.keys(response.data.user).length === 0
      ) {
        console.error("User data not found");
        router.push("/not-found");
        return;
      }

      // Set user data if valid
      setUserData(response.data.user);
      setChallangesStats(response.data.challenges || {});
      setSolvedByDifficulty(
        response.data.challenges?.solved_by_difficulty || {
          easy: 0,
          medium: 0,
          hard: 0,
          very_hard: 0,
        }
      );
      setBytesByMonth(response.data.bytes_by_month || null);

      // Set social media links
      if (response.data.user.social_media) {
        setSocialAccounts({
          discord: { linked: !!response.data.user.social_media.discord },
          instagram: { linked: !!response.data.user.social_media.instagram },
          linkedin: { linked: !!response.data.user.social_media.linkedIn },
          tiktok: { linked: !!response.data.user.social_media.tiktok },
          youtube: { linked: !!response.data.user.social_media.youtube },
          twitter: { linked: !!response.data.user.social_media.twitter },
        });
      }

      // Set categories if available in the response
      if (response.data.categories) {
        setCategories(response.data.categories);
      }

      // Set median data if available
      if (response.data.all_users_median) {
        setAllUsersMedian(response.data.all_users_median);
      }

      // Set lab3 data if available
      if (response.data.lab3) {
        setLab3Data(response.data.lab3);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);

      // Detect various error types that indicate user not found
      const isNotFoundError =
        (error.response && error.response.status === 404) ||
        (error.response &&
          error.response.data?.message?.includes(
            "No query results for model"
          )) ||
        error.message?.includes("No query results for model");

      if (isNotFoundError) {
        router.push("/not-found");
        return;
      }

      // For other types of errors, ensure data is set to defaults
      setUserData({});
      setChallangesStats({});
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserEvents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.get(`${apiUrl}/user-events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserEvents(response.data.events);
    } catch (error) {
      console.error("Error fetching user events:", error);
    }
  };

  const fetchUserActivities = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.get(
        `${apiUrl}/user/activities/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setActivity(response.data.activities || []);
    } catch (error) {
      console.error("Error fetching user activities:", error);
    }
  };

  const fetchUserStreak = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.get(`${apiUrl}/user-challenges/streak`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success") {
        setStreak(response.data.data.current_streak);
        setTotalApprovedChallenges(
          response.data.data.total_approved_challenges
        );
      }
    } catch (error) {
      console.error("Error fetching user streak:", error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchSocialMediaLinks();
    fetchUserEvents();
    fetchUserActivities();
    fetchUserStreak();
  }, [params.id]);

  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSkillsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (skillsSectionRef.current) {
      observer.observe(skillsSectionRef.current);
    }

    return () => {
      if (skillsSectionRef.current) {
        observer.disconnect();
      }
    };
  }, [isLoading]);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  const handleYouSelected = () => {
    setYouSelected(true);
    setAverageEyeLevel(false);
  };

  const handleAverageEyeLevel = () => {
    setAverageEyeLevel(true);
    setYouSelected(false);
  };

  return isLoading ? (
    <LoadingPage />
  ) : (
    <div
      dir={isEnglish ? "ltr" : "rtl"}
      className="pt-40 px-4 sm:px-10 max-w-[2000px] mx-auto"
    >
      <div className="flex items-center gap-3 sm:gap-5">
        <div>
          <Image
            className="rounded-full  w-16 h-16 sm:w-[88px] sm:h-[88px]"
            src={userData.user_profile_image || "/icon1.png"}
            alt="profile"
            width={88}
            height={88}
          />
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-semibold flex items-center gap-2">
            {userData.user_name}
            {streak > 0 && (
              <span className="flex items-center gap-1">
                {[...Array(streak)].map((_, index) => (
                  <Image
                    key={index}
                    src={`/fire ${index + 1}.png`}
                    alt="verified"
                    width={32}
                    height={32}
                  />
                ))}
              </span>
            )}
          </h1>
          <p className="text-xl sm:text-3xl font-semibold">
            {isEnglish ? "Beginner" : userData.ar_title || userData.title}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-8 sm:mt-16">
        {socialAccounts.tiktok.linked && (
          <a
            href={userData.social_media?.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-transparent shadow-inner shadow-[#FE2C55] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #FE2C55 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              TikTok
            </span>
            <FaTiktok className={`text-white`} />
          </a>
        )}

        {socialAccounts.linkedin.linked && (
          <a
            href={userData.social_media?.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-transparent shadow-inner shadow-[#0A66C2] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #0A66C2 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              LinkedIn
            </span>
            <FaLinkedin className={`text-white text-lg`} />
          </a>
        )}

        {socialAccounts.instagram.linked && (
          <a
            href={userData.social_media?.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{
              boxShadow:
                "0px 5px 15px 0px #BA339F inset, 2px -1px 30px 0px #E0AF47 inset",
            }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              Instagram
            </span>
            <FaInstagram className={`text-white text-lg`} />
          </a>
        )}

        {socialAccounts.youtube.linked && (
          <a
            href={userData.social_media?.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-transparent shadow-inner shadow-[#FF0000] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #FF0000 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              Youtube
            </span>
            <FaYoutube className={`text-white text-lg`} />
          </a>
        )}

        {socialAccounts.discord.linked && (
          <a
            href={userData.social_media?.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-transparent shadow-inner shadow-[#5865F2] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #5865F2 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              Discord
            </span>
            <FaDiscord className={`text-[#5865F2] text-lg`} />
          </a>
        )}

        {socialAccounts.twitter.linked && (
          <a
            href={userData.social_media?.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-transparent shadow-inner shadow-[#000000] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #000000 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              Twitter X
            </span>
            <BsTwitterX className={`text-white text-lg`} />
          </a>
        )}
      </div>

      {/* tabs  */}
      <div className="mt-10 sm:mt-20">
        <div className="w-full">
          <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
            <TabList className="flex gap-4 sm:gap-10 overflow-x-auto pb-2">
              <Tab
                className={({ selected }) =>
                  `focus:outline-none pb-4 px-3 sm:px-6 cursor-pointer text-lg sm:text-2xl font-semibold transition-all duration-300 relative whitespace-nowrap
                  ${
                    selected
                      ? "text-[#38FFE5]"
                      : "text-gray-400 hover:text-gray-600"
                  }`
                }
              >
                <span>{isEnglish ? "Bio" : "النبذة"}</span>
                {activeTab === 0 && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-[#38FFE5] rounded-t-md"></span>
                )}
              </Tab>
              <Tab
                className={({ selected }) =>
                  `focus:outline-none pb-4 px-3 sm:px-6 cursor-pointer text-lg sm:text-2xl font-semibold transition-all duration-300 relative whitespace-nowrap
                  ${
                    selected
                      ? "text-[#38FFE5]"
                      : "text-gray-400 hover:text-gray-600"
                  }`
                }
              >
                <span>{isEnglish ? "Events" : "الفعاليات"}</span>
                {activeTab === 1 && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-[#38FFE5] rounded-t-md"></span>
                )}
              </Tab>
              <Tab
                className={({ selected }) =>
                  `focus:outline-none pb-4 px-3 sm:px-6 cursor-pointer text-lg sm:text-2xl font-semibold transition-all duration-300 relative whitespace-nowrap
                  ${
                    selected
                      ? "text-[#38FFE5]"
                      : "text-gray-400 hover:text-gray-600"
                  }`
                }
              >
                <span>{isEnglish ? "Activities" : "الأنشطة"}</span>
                {activeTab === 2 && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-[#38FFE5] rounded-t-md"></span>
                )}
              </Tab>
            </TabList>

            <TabPanels className="mt-6 w-full">
              <TabPanel
                dir={isEnglish ? "ltr" : "ltr"}
                className="w-full pb-10"
              >
                <div
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="flex items-center gap-4 bg-white/3 py-10 my-[80px] px-4 rounded-2xl "
                >
                  <Image src="/fire 6.png" alt="byte" width={52} height={52} />
                  <div>
                    <h2 className="text-[#FFFFFF]">
                      {isEnglish ? "Total Contribution" : "مجموع المساهمة"}
                    </h2>
                    <p className="text-[#FFFFFF] flex items-center gap-2 text-[24px] font-semibold">
                      {isEnglish ? "Challenges" : "التحديات"}
                      <span>{totalApprovedChallenges}</span>
                    </p>
                  </div>
                </div>
                <div
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="flex lg:flex-row flex-col  lg:gap-14 gap-8 items-center  "
                >
                  <div className="lg:basis-1/3 w-full">
                    <div className="flex flex-col items-center gap-3 sm:gap-4 bg-white/3 backdrop-blur-xl rounded-2xl p-3 sm:p-4 h-[165px] ">
                      <Image
                        src="/ranking.png"
                        alt="progress"
                        width={56}
                        height={56}
                      />
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
                  <div className="lg:basis-2/3 w-full bg-white/3 backdrop-blur-xl rounded-2xl py-6 sm:py-10 px-3 sm:px-4 lg:px-10 h-[165px]">
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
                          bgClass =
                            "bg-gradient-to-r from-[#06373F] to-[#38FFE5]"; // In progress
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
                            userData?.next_title_arabic ||
                            userData?.next_title ||
                            ""
                          }`}
                    </p>
                  </div>
                </div>

                <div dir={isEnglish ? "ltr" : "rtl"}>
                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-10 items-center my-10 ">
                    <div className="w-full sm:basis-1/2 bg-[#FFFFFF0D] rounded-2xl p-4 flex gap-4 items-center">
                      <div>
                        <Image
                          src="/blood.png"
                          alt="profile"
                          width={36}
                          height={36}
                        />
                      </div>
                      <div className="w-full">
                        <h1>{isEnglish ? "First Bytes" : "البايتس الاولي"}</h1>
                        <p className="font-bold pt-2 min-w-[80px]">
                          {isEnglish
                            ? `${userData?.total_firstblood_bytes || 0} bytes`
                            : `${userData?.total_firstblood_bytes || 0} بايتس`}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:basis-1/2 bg-[#FFFFFF0D] rounded-2xl p-4 flex gap-4 items-center">
                      <div>
                        <Image
                          src="/byte.png"
                          alt="profile"
                          width={36}
                          height={36}
                        />
                      </div>
                      <div className="w-full">
                        <h1>{isEnglish ? "Total Bytes" : "مجموع البايتس"}</h1>
                        <p className="font-bold pt-2 min-w-[80px]">
                          {isEnglish
                            ? `${userData?.total_bytes || 0} bytes`
                            : `${userData?.total_bytes || 0} بايتس`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-10 items-center my-[80px]">
                    {lab3Data.solved_by_difficulty.easy > 0 ||
                    lab3Data.solved_by_difficulty.medium > 0 ||
                    lab3Data.solved_by_difficulty.hard > 0 ||
                    lab3Data.solved_by_difficulty.very_hard > 0 ? (
                      <>
                        <div className="w-full sm:basis-1/2 bg-[#FFFFFF0D] rounded-2xl p-4 ">
                          <div className="flex gap-4 items-center">
                            <div>
                              <Image
                                src="/icon-challnge.png"
                                alt="challenges"
                                width={56}
                                height={56}
                              />
                            </div>
                            <div>
                              <h1>
                                {isEnglish
                                  ? "Challenges Hacked"
                                  : "التحديات المخترقة"}
                              </h1>
                              <p className="font-bold pt-2">
                                {isEnglish
                                  ? `${challangesStats?.solved} challenges`
                                  : `${challangesStats?.solved} التحديات`}
                              </p>
                            </div>
                          </div>

                          <div className="px-7 pt-10 flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                              <p className="min-w-[40px] text-right">
                                {solvedByDifficulty.easy || 0}
                              </p>
                              <p className="text-[#00D0FF] font-bold text-base sm:text-lg">
                                {isEnglish ? "Easy" : "سهل"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="min-w-[40px] text-right">
                                {solvedByDifficulty.medium || 0}
                              </p>
                              <p className="text-[#9DFF00] font-bold text-base sm:text-lg">
                                {isEnglish ? "Medium" : "متوسط"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="min-w-[40px] text-right">
                                {solvedByDifficulty.hard || 0}
                              </p>
                              <p className="text-[#FF5E00] font-bold text-base sm:text-lg">
                                {isEnglish ? "Hard" : "صعب"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="min-w-[40px] text-right">
                                {solvedByDifficulty.very_hard || 0}
                              </p>
                              <p className="text-[#FF1100] font-bold text-base sm:text-lg">
                                {isEnglish ? "Very Hard" : "صعب جدا"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full sm:basis-1/2 bg-[#FFFFFF0D] rounded-2xl p-4">
                          <div className="flex gap-4 items-center">
                            <div>
                              <Image
                                src="/server.png"
                                alt="lab3"
                                width={56}
                                height={56}
                              />
                            </div>
                            <div>
                              <h1>
                                {isEnglish
                                  ? "Hacked Servers"
                                  : "الخوادم المخترقة"}
                              </h1>
                              <p className="font-bold pt-2">
                                {isEnglish
                                  ? `${lab3Data?.solved_challenges || 0}
                      servers`
                                  : `${
                                      lab3Data?.solved_challenges || 0
                                    } الخوادم`}
                              </p>
                            </div>
                          </div>

                          <div className="px-7 pt-10 flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                              <p className="min-w-[40px] text-right">
                                {lab3Data.solved_by_difficulty.easy || 0}
                              </p>
                              <p className="text-[#00D0FF] font-bold text-base sm:text-lg">
                                {isEnglish ? "Easy" : "سهل"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="min-w-[40px] text-right">
                                {lab3Data.solved_by_difficulty.medium || 0}
                              </p>
                              <p className="text-[#9DFF00] font-bold text-base sm:text-lg">
                                {isEnglish ? "Medium" : "متوسط"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="min-w-[40px] text-right">
                                {lab3Data.solved_by_difficulty.hard || 0}
                              </p>
                              <p className="text-[#FF5E00] font-bold text-base sm:text-lg">
                                {isEnglish ? "Hard" : "صعب"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="min-w-[40px] text-right">
                                {lab3Data.solved_by_difficulty.very_hard || 0}
                              </p>
                              <p className="text-[#FF1100] font-bold text-base sm:text-lg">
                                {isEnglish ? "Very Hard" : "صعب جدا"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full bg-[#FFFFFF0D] rounded-2xl p-4">
                        <div className="flex gap-4 items-center">
                          <div>
                            <Image
                              src="/icon-challnge.png"
                              alt="challenges"
                              width={56}
                              height={56}
                            />
                          </div>
                          <div>
                            <h1>
                              {isEnglish
                                ? "Challenges Hacked"
                                : "التحديات المخترقة"}
                            </h1>
                            <p className="font-bold pt-2">
                              {isEnglish
                                ? `${challangesStats?.solved} challenges`
                                : `${challangesStats?.solved} التحديات`}
                            </p>
                          </div>
                        </div>

                        <div className="px-7 pt-10 flex flex-col gap-8">
                          <div className="flex items-center justify-between">
                            <p className="min-w-[40px] text-right">
                              {solvedByDifficulty.easy || 0}
                            </p>
                            <p className="text-[#00D0FF] font-bold text-base sm:text-lg">
                              {isEnglish ? "Easy" : "سهل"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="min-w-[40px] text-right">
                              {solvedByDifficulty.medium || 0}
                            </p>
                            <p className="text-[#9DFF00] font-bold text-base sm:text-lg">
                              {isEnglish ? "Medium" : "متوسط"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="min-w-[40px] text-right">
                              {solvedByDifficulty.hard || 0}
                            </p>
                            <p className="text-[#FF5E00] font-bold text-base sm:text-lg">
                              {isEnglish ? "Hard" : "صعب"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="min-w-[40px] text-right">
                              {solvedByDifficulty.very_hard || 0}
                            </p>
                            <p className="text-[#FF1100] font-bold text-base sm:text-lg">
                              {isEnglish ? "Very Hard" : "صعب جدا"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="my-10" ref={skillsSectionRef}>
                    <div className="flex flex-col py-4 sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                      <h2 className="text-2xl font-semibold">
                        {isEnglish ? "Skills Proficiency" : "ملخص المهارات"}
                      </h2>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm">
                            {isEnglish ? "You" : "أنت"}
                          </p>
                          <div
                            className={`h-5 w-5 border ${
                              youSelected
                                ? "border-[#38FFE5] bg-transparent"
                                : "border-white bg-transparent"
                            } flex items-center justify-center cursor-pointer`}
                            onClick={handleYouSelected}
                          >
                            {youSelected && (
                              <span className="text-[#38FFE5]">✓</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm">
                            {isEnglish ? "Average Eye Level" : "متوسط اللاعبون"}
                          </p>
                          <div
                            className={`h-5 w-5 border ${
                              averageEyeLevel
                                ? "border-[#38FFE5] bg-transparent"
                                : "border-white bg-transparent"
                            } flex items-center justify-center cursor-pointer`}
                            onClick={handleAverageEyeLevel}
                          >
                            {averageEyeLevel && (
                              <span className="text-[#38FFE5]">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {categories.map((category, index) => (
                        <div
                          className="flex items-center flex-row-reverse"
                          key={category.name}
                        >
                          <div className="w-full">
                            <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#00E2FF] to-[#00F5A0] transition-all duration-1000 ease-out"
                                style={{
                                  width: skillsVisible
                                    ? youSelected
                                      ? `${category.percentage || 0}%`
                                      : `${
                                          allUsersMedian.find(
                                            (m) => m.name === category.name
                                          )?.median_percentage || 0
                                        }%`
                                    : "0%",
                                  transitionDelay: `${index * 150}ms`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <div
                            className={`min-w-[170px] ${
                              isEnglish ? "text-left" : "text-right"
                            }`}
                          >
                            <span className="font-medium text-white">
                              {category.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="my-10">
                    <ActivityChart
                      isEnglish={isEnglish}
                      bytesData={bytesByMonth}
                    />
                  </div>
                </div>
              </TabPanel>
              <TabPanel className="w-full">
                {userEvents.length > 0 ? (
                  <div
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="grid mt-20 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 md:mt-16 gap-4 md:gap-[56px] pb-10"
                  >
                    {userEvents.map((event) => (
                      <div
                        onClick={() => router.push(`/events/${event.uuid}`)}
                        key={event.uuid}
                        className="bg-white/1 cursor-pointer min-h-[320px] relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative h-1/2 w-full">
                          <Image
                            className="object-cover rounded-t-2xl"
                            src={event.image}
                            alt={event.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority
                          />
                        </div>
                        <div className="px-4 pt-[27px]">
                          <h3 className="text-lg md:text-[27px] text-center font-semibold">
                            {event.title}
                          </h3>
                          <hr className="text-[#38FFE5]/20 mt-[27px]" />
                          <div
                            className={`flex items-center pt-[20px] ${
                              isEnglish ? "justify-center" : "justify-center"
                            }`}
                          >
                            <span
                              className={`${
                                isEnglish ? "mr-2" : "ml-2"
                              } text-teal-400`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="3"
                                  y="4"
                                  width="18"
                                  height="18"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                            </span>
                            <span
                              className={`text-sm md:text-base text-gray-400 ${
                                isEnglish ? "text-left" : "text-right"
                              }`}
                            >
                              {formatDate(event.start_date, isEnglish)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10">
                    <Image
                      className="mx-auto"
                      src="/notfound.png"
                      alt="activity"
                      width={150}
                      height={150}
                    />
                    <p className="text-center pt-5">
                      {isEnglish ? "No events yet" : "لاتوجد فعاليات حتي الآن"}
                    </p>
                  </div>
                )}
              </TabPanel>
              <TabPanel className="w-full">
                <div
                  className={`px-4 lg:px-10 py-6 lg:py-10 ${
                    activity.length > 0 ? "bg-[#06373F26]" : "bg-transparent"
                  } rounded-2xl`}
                >
                  {activity.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="min-w-[768px] w-full">
                        {/* Body rows */}
                        {activity.map((item, index) => (
                          <div
                            key={index}
                            className={`${
                              index % 2 === 0 ? "bg-[#06373F] rounded-2xl" : ""
                            } mb-2`}
                          >
                            <table
                              dir={isEnglish ? "ltr" : "rtl"}
                              className="w-full"
                            >
                              <tbody dir={isEnglish ? "ltr" : "rtl"}>
                                <tr
                                  className={`flex items-center justify-between ${
                                    isEnglish
                                      ? "flex-row-reverse"
                                      : "flex-row-reverse"
                                  }`}
                                >
                                  <td
                                    dir={isEnglish ? "ltr" : "rtl"}
                                    className={`py-2 lg:py-3 text-white/70 w-[25%] text-sm lg:text-base ${
                                      isEnglish
                                        ? "pl-3 lg:pl-5"
                                        : "pr-3 lg:pr-5"
                                    }`}
                                  >
                                    {formatTimeAgo(item.solved_at)}
                                  </td>
                                  <td className="py-2 lg:py-3 w-[25%]">
                                    <div
                                      dir={isEnglish ? "ltr" : "rtl"}
                                      className={`flex items-center gap-1 lg:gap-2 ${
                                        isEnglish ? "pl-0" : "pr-0"
                                      }`}
                                    >
                                      <span className="text-white text-sm lg:text-base min-w-[40px] text-left">
                                        {item.is_first_blood
                                          ? item.first_blood_bytes
                                          : item.total_bytes}
                                      </span>
                                      <Image
                                        src={
                                          item.is_first_blood
                                            ? "/blood.png"
                                            : "/byte.png"
                                        }
                                        alt={
                                          item.is_first_blood
                                            ? "first blood"
                                            : "points"
                                        }
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
                                        isEnglish
                                          ? "pl-2 lg:pl-3"
                                          : "pr-2 lg:pr-3"
                                      }`}
                                    >
                                      <span className="text-sm lg:text-base min-w-[25px] text-right">
                                        {index + 1}
                                      </span>
                                      <Image
                                        src={item.category_icon_url}
                                        alt="user"
                                        width={24}
                                        height={24}
                                        className="lg:w-[32px] lg:h-[32px]"
                                      />
                                      <span className="text-white text-sm lg:text-base">
                                        {userData.username || params.id}
                                      </span>
                                      <span className="text-white text-sm lg:text-base">
                                        {isEnglish
                                          ? item.is_first_blood
                                            ? `got first bytes in ${item.challenge_title}`
                                            : `got bytes in ${item.challenge_title}`
                                          : item.is_first_blood
                                          ? `حصلت على البايتس الأولي في ${item.challenge_title}`
                                          : `حصلت على بايتس في ${item.challenge_title}`}
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
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Image
                        src="/notfound.png"
                        alt="activity"
                        width={150}
                        height={150}
                      />
                      <p className="text-center pt-5 text-lg">
                        {isEnglish
                          ? "No activities yet"
                          : "لاتوجد أنشطة حتي الآن"}
                      </p>
                    </div>
                  )}
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
