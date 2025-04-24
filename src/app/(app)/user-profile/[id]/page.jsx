"use client";
import { useLanguage } from "@/app/context/LanguageContext";
import { FaTiktok } from "react-icons/fa6";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Achievements from "@/app/components/Achievements";
import { FaInstagram } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import ActivityChart from "@/app/components/ActivityChart";
import LoadingPage from "@/app/components/LoadingPage";
import { Inter } from "next/font/google";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";

const inter = Inter({ subsets: ["latin"] });

export default function Profile() {
  const { isEnglish } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [averageEyeLevel, setAverageEyeLevel] = useState(true);
  const [youSelected, setYouSelected] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [skillsVisible, setSkillsVisible] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState({
    discord: { linked: false },
    instagram: { linked: false },
    linkedin: { linked: false },
    tiktok: { linked: false },
    youtube: { linked: false },
    twitter: { linked: false },
  });

  const [userData, setUserData] = useState("");
  const [challangesStats, setChallangesStats] = useState("");
  const [solvedByDifficulty, setSolvedByDifficulty] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
    very_hard: 0,
  });
  const skillsSectionRef = useRef(null);
  const params = useParams();
  const fetchSocialMediaLinks = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.get(`${apiUrl}/user/stats/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUserData(response.data.user);
      setChallangesStats(response.data.challenges);
      setSolvedByDifficulty(
        response.data.challenges.solved_by_difficulty || {
          easy: 0,
          medium: 0,
          hard: 0,
          very_hard: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching social media links:", error);
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    fetchSocialMediaLinks();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

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
  }, [isLoaded]);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  return isLoaded ? (
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
          <h1 className="text-2xl sm:text-4xl font-semibold">ahmed</h1>
          <p className="text-xl sm:text-3xl font-semibold">
            {isEnglish ? "Beginner" : userData.title}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-8 sm:mt-16">
        {socialAccounts.tiktok.linked && (
          <div
            className="bg-transparent shadow-inner shadow-[#FE2C55] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #FE2C55 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              TikTok
            </span>
            <FaTiktok className={`text-white`} />
          </div>
        )}

        {socialAccounts.linkedin.linked && (
          <div
            className="bg-transparent shadow-inner shadow-[#0A66C2] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #0A66C2 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              LinkedIn
            </span>
            <FaLinkedin className={`text-white text-lg`} />
          </div>
        )}

        {socialAccounts.instagram.linked && (
          <div
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
          </div>
        )}

        {socialAccounts.youtube.linked && (
          <div
            className="bg-transparent shadow-inner shadow-[#FF0000] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #FF0000 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              Youtube
            </span>
            <FaYoutube className={`text-white text-lg`} />
          </div>
        )}

        {socialAccounts.discord.linked && (
          <div
            className="bg-transparent shadow-inner shadow-[#5865F2] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #5865F2 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              Discord
            </span>
            <FaDiscord className={`text-[#5865F2] text-lg`} />
          </div>
        )}

        {socialAccounts.twitter.linked && (
          <div
            className="bg-transparent shadow-inner shadow-[#000000] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
            style={{ boxShadow: "0px -1.5px 20px 0px #000000 inset" }}
          >
            <span className={`text-white font-medium ${inter.className}`}>
              Twitter X
            </span>
            <BsTwitterX className={`text-white text-lg`} />
          </div>
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
                      dir={isEnglish ? "ltr" : "rtl"}
                      className={`text-[#BCC9DB] ${
                        isEnglish ? "text-left" : "text-right"
                      } pt-10 text-[18px]`}
                    >
                      {isEnglish
                        ? `60% remaining to achieve Professional status`
                        : `متبقي ${
                            userData?.percentage_for_next_title
                              ? Math.floor(userData.percentage_for_next_title)
                              : 0
                          }% للحصول على  لقب ${userData?.next_title || ""}`}
                    </p>
                  </div>

                  <div className="lg:basis-1/3 w-full">
                    <div className="flex flex-col items-center gap-4 bg-white/3 backdrop-blur-xl rounded-lg p-4">
                      <Image
                        src="/ranking.png"
                        alt="progress"
                        width={36}
                        height={36}
                      />
                      <p className="text-[#BCC9DB] text-[18px]">
                        {userData?.rank > 0
                          ? userData.rank
                          : isEnglish
                          ? "No Ranking"
                          : "لا يوجد تصنيف"}
                      </p>
                      <p className="text-white text-[18px]">
                        {isEnglish ? "Your Ranking" : "تصنيفك"}
                      </p>
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel className="w-full">
                <div className="py-10">
                  <Image
                    className="mx-auto"
                    src="/notfound.png"
                    alt="activity"
                    width={200}
                    height={200}
                  />
                  <p className="text-center pt-5">
                    {isEnglish ? "No events yet" : "لاتوجد فعاليات حتي الآن"}
                  </p>
                </div>
              </TabPanel>
              <TabPanel className="w-full">
                <div className="py-10">
                  <Image
                    className="mx-auto"
                    src="/notfound.png"
                    alt="activity"
                    width={200}
                    height={200}
                  />
                  <p className="text-center pt-4">
                    {isEnglish ? "No activities yet" : "لاتوجد أنشطة حتي الآن"}
                  </p>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-10 items-center my-10">
        <div className="w-full sm:basis-1/2 bg-[#FFFFFF0D] rounded-lg p-4 flex gap-4 items-center">
          <div>
            <Image src="/blood.png" alt="profile" width={36} height={36} />
          </div>
          <div>
            <h1>{isEnglish ? "First Bytes" : "البايتس الاولي"}</h1>
            <p className="font-bold pt-2">
              {isEnglish
                ? `${userData?.total_firstblood_bytes || 0} bytes`
                : `${userData?.total_firstblood_bytes || 0} بايتس`}
            </p>
          </div>
        </div>

        <div className="w-full sm:basis-1/2 bg-[#FFFFFF0D] rounded-lg p-4 flex gap-4 items-center">
          <div>
            <Image src="/byte.png" alt="profile" width={36} height={36} />
          </div>
          <div>
            <h1>{isEnglish ? "Total Bytes" : "مجموع البايتس"}</h1>
            <p className="font-bold pt-2">
              {isEnglish
                ? `${userData?.total_bytes || 0} bytes`
                : `${userData?.total_bytes || 0} بايتس`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-10 items-center my-10">
        <div className="w-full sm:basis-1/2 bg-[#FFFFFF0D] rounded-lg p-4">
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
              <h1>{isEnglish ? "Challenges Hacked" : "التحديات المخترقة"}</h1>
              <p className="font-bold pt-2">
                {isEnglish
                  ? `${challangesStats?.solved} challenges`
                  : `${challangesStats?.solved} التحديات`}
              </p>
            </div>
          </div>

          <div className="px-7 pt-10 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <p>{solvedByDifficulty.easy || 0}</p>
              <p className="text-[#00D0FF] font-bold text-base sm:text-lg">
                {isEnglish ? "Easy" : "سهل"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>{solvedByDifficulty.medium || 0}</p>
              <p className="text-[#9DFF00] font-bold text-base sm:text-lg">
                {isEnglish ? "Medium" : "متوسط"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>{solvedByDifficulty.hard || 0}</p>
              <p className="text-[#FF5E00] font-bold text-base sm:text-lg">
                {isEnglish ? "Hard" : "صعب"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>{solvedByDifficulty.very_hard || 0}</p>
              <p className="text-[#FF1100] font-bold text-base sm:text-lg">
                {isEnglish ? "Very Hard" : "صعب جدا"}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full sm:basis-1/2 bg-[#FFFFFF0D] rounded-lg p-4">
          <div className="flex gap-4 items-center">
            <div>
              <Image src="/server.png" alt="servers" width={56} height={56} />
            </div>
            <div>
              <h1>{isEnglish ? "Servers Hacked" : "الخوادم المخترقة"}</h1>
              <p className="font-bold pt-2">
                {isEnglish ? "0 servers" : "0 الخوادم"}
              </p>
            </div>
          </div>

          <div className="px-7 pt-10 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#00D0FF] font-bold text-base sm:text-lg">
                {isEnglish ? "Easy" : "سهل"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#9DFF00] font-bold text-base sm:text-lg">
                {isEnglish ? "Medium" : "متوسط"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#FF5E00] font-bold text-base sm:text-lg">
                {isEnglish ? "Hard" : "صعب"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#FF1100] font-bold text-base sm:text-lg">
                {isEnglish ? "Very Hard" : "صعب جدا"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="my-10" ref={skillsSectionRef}>
        <div className="flex flex-col py-4 sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl font-semibold">
            {isEnglish ? "Skills Proficiency" : "ملخص المهارات"}
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="text-white text-sm">{isEnglish ? "You" : "أنت"}</p>
              <div
                className={`h-5 w-5 border ${
                  youSelected
                    ? "border-[#38FFE5] bg-transparent"
                    : "border-white bg-transparent"
                } flex items-center justify-center cursor-pointer`}
                onClick={() => setYouSelected(!youSelected)}
              >
                {youSelected && <span className="text-[#38FFE5]">✓</span>}
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
                onClick={() => setAverageEyeLevel(!averageEyeLevel)}
              >
                {averageEyeLevel && <span className="text-[#38FFE5]">✓</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Reversing Skill */}
          <div className="flex items-center flex-row-reverse">
            <div className="w-full">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#00E2FF] to-[#00F5A0] transition-all duration-1000 ease-out ${
                    skillsVisible ? "w-[65%]" : "w-0"
                  }`}
                ></div>
              </div>
            </div>
            <div
              className={`min-w-[130px] ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              <span className="font-medium text-white">Reverse</span>
            </div>
          </div>

          {/* Mobile Skill */}
          <div className="flex items-center flex-row-reverse">
            <div className="w-full">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#00E2FF] to-[#00F5A0] transition-all duration-1000 ease-out delay-150 ${
                    skillsVisible ? "w-[90%]" : "w-0"
                  }`}
                ></div>
              </div>
            </div>
            <div
              className={`min-w-[130px] ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              <span className="font-medium text-white">Web</span>
            </div>
          </div>

          {/* PWM Skill */}
          <div className="flex items-center flex-row-reverse">
            <div className="w-full">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#00E2FF] to-[#00F5A0] transition-all duration-1000 ease-out delay-300 ${
                    skillsVisible ? "w-[75%]" : "w-0"
                  }`}
                ></div>
              </div>
            </div>
            <div
              className={`min-w-[130px] ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              <span className="font-medium text-white">Misc</span>
            </div>
          </div>

          {/* MISC Skill */}
          <div className="flex items-center flex-row-reverse">
            <div className="w-full">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#00E2FF] to-[#00F5A0] transition-all duration-1000 ease-out delay-450 ${
                    skillsVisible ? "w-[60%]" : "w-0"
                  }`}
                ></div>
              </div>
            </div>
            <div
              className={`min-w-[130px] ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              <span className="font-medium text-white">Crypto</span>
            </div>
          </div>

          {/* Hardware Skill */}
          <div className="flex items-center flex-row-reverse">
            <div className="w-full">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#00E2FF] to-[#00F5A0] transition-all duration-1000 ease-out delay-600 ${
                    skillsVisible ? "w-[85%]" : "w-0"
                  }`}
                ></div>
              </div>
            </div>
            <div
              className={`min-w-[130px] ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              <span className="font-medium text-white">
                CyberXbytes Learning
              </span>
            </div>
          </div>

          {/* Forensics Skill */}
          <div className="flex items-center flex-row-reverse">
            <div className="w-full">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#00E2FF] to-[#00F5A0] transition-all duration-1000 ease-out delay-750 ${
                    skillsVisible ? "w-[55%]" : "w-0"
                  }`}
                ></div>
              </div>
            </div>
            <div
              className={`min-w-[130px] ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              <span className="font-medium text-white">Forensic</span>
            </div>
          </div>

          {/* Web Skill */}
          <div className="flex items-center flex-row-reverse">
            <div className="w-full">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#00E2FF] to-[#00F5A0] transition-all duration-1000 ease-out delay-900 ${
                    skillsVisible ? "w-[80%]" : "w-0"
                  }`}
                ></div>
              </div>
            </div>
            <div
              className={`min-w-[130px] ${
                isEnglish ? "text-left" : "text-right"
              }`}
            >
              <span className="font-medium text-white">Web</span>
            </div>
          </div>
        </div>
      </div>
      <div className="my-10">
        <ActivityChart isEnglish={isEnglish} />
      </div>
    </div>
  ) : (
    <LoadingPage />
  );
}
