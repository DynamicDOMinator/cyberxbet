"use client";
import { useLanguage } from "@/app/context/LanguageContext";
import { FaTiktok } from "react-icons/fa6";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Achievements from "@/app/components/Achievements";
import { FaInstagram } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import ActivityChart from "@/app/components/ActivityChart";
import LoadingPage from "@/app/components/LoadingPage";
export default function Profile() {
  const [activeTab, setActiveTab] = useState(0);
  const [averageEyeLevel, setAverageEyeLevel] = useState(true);
  const [youSelected, setYouSelected] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  const { isEnglish } = useLanguage();

  return isLoaded ? (
    <div
      dir={isEnglish ? "ltr" : "rtl"}
      className="pt-40 px-4 sm:px-10 max-w-[2000px] mx-auto"
    >
      <div className="flex items-center gap-3 sm:gap-5">
        <div>
          <Image
            className="rounded-full w-16 h-16 sm:w-[88px] sm:h-[88px]"
            src="/user.png"
            alt="profile"
            width={88}
            height={88}
          />
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-semibold">Mahmoud Fatouh</h1>
          <p className="text-xl sm:text-3xl font-semibold">
            {isEnglish ? "Beginner" : "مبتدئ"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-8 sm:mt-16">
        <div
          className="bg-transparent shadow-inner shadow-[#FE2C55] rounded-full  w-[120px] flex items-center justify-center gap-2 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #FE2C55 inset" }}
        >
          <span className="text-white text-lg font-medium">TikTok</span>
          <FaTiktok
            className={`text-white  `}
          />
        </div>

        <div
          className="bg-transparent shadow-inner shadow-[#0A66C2] rounded-full w-[120px] flex items-center justify-center gap-2 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #0A66C2 inset" }}
        >
          <span className="text-white text-lg font-medium">LinkedIn</span>
          <FaLinkedin
            className={`text-white text-lg `}
          />
        </div>
        <div
          className="bg-white/10  rounded-full w-[120px] flex items-center justify-center gap-2 px-2 mb-2 sm:mb-0"
          style={{
            boxShadow:
              "0px 5px 15px 0px #BA339F inset, 2px -1px 30px 0px #E0AF47 inset",
          }}
        >
          <span className="text-white text-lg font-medium">Instagram</span>
          <FaInstagram
            className={`text-white text-lg `}
          />
        </div>
        <div
            className="bg-transparent shadow-inner shadow-[#FF0000] rounded-full w-[120px] flex items-center justify-center gap-2 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #FF0000 inset" }}
        >
          <span className="text-white text-lg font-medium">Youtube</span>
          <FaYoutube
            className={`text-white text-lg `}
          />
        </div>
        <div
          className="bg-transparent shadow-inner shadow-[#5865F2] rounded-full w-[120px] flex items-center justify-center gap-2 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #5865F2 inset" }}
        >
          <span className="text-white text-lg font-medium">Discord</span>
          <FaDiscord
            className={`text-[#5865F2] text-lg `}
          />
        </div>
        <div className="bg-black  rounded-full w-[120px] flex items-center justify-center gap-2 px-2 mb-2 sm:mb-0">
          <span className="text-white text-lg font-medium">Twitter X</span>
          <BsTwitterX
            className={`text-white text-lg `}
          />
        </div>
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
                <Achievements />
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
              {isEnglish ? "0 bytes" : "0 بايتس"}
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
              {isEnglish ? "0 bytes" : "0 بايتس"}
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
                {isEnglish ? "0 challenges" : "0 التحديات"}
              </p>
            </div>
          </div>

          <div className="px-7 pt-10 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#00D0FF] font-bold text-xl sm:text-2xl">
                {isEnglish ? "Easy" : "سهل"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#9DFF00] font-bold text-xl sm:text-2xl">
                {isEnglish ? "Medium" : "متوسط"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#FF5E00] font-bold text-xl sm:text-2xl">
                {isEnglish ? "Hard" : "صعب"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#FF1100] font-bold text-xl sm:text-2xl">
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
              <p className="text-[#00D0FF] font-bold text-xl sm:text-2xl">
                {isEnglish ? "Easy" : "سهل"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#9DFF00] font-bold text-xl sm:text-2xl">
                {isEnglish ? "Medium" : "متوسط"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#FF5E00] font-bold text-xl sm:text-2xl">
                {isEnglish ? "Hard" : "صعب"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p>0</p>
              <p className="text-[#FF1100] font-bold text-xl sm:text-2xl">
                {isEnglish ? "Very Hard" : "صعب جدا"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="my-10">
        <div className="flex flex-col py-4 sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl  font-semibold">
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
          <div className="flex items-center flex-row-reverse ">
            <div className="w-full ">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full w-3/4 bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]"
                  style={{ width: "65%" }}
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
            <div className="w-full ">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full w-3/4 bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]"
                  style={{ width: "90%" }}
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
            <div className="w-full ">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full w-3/4 bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]"
                  style={{ width: "75%" }}
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
            <div className="w-full ">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full w-3/4 bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]"
                  style={{ width: "60%" }}
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
                  className="h-full rounded-full w-3/4 bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]"
                  style={{ width: "85%" }}
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
            <div className="w-full ">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full w-3/4 bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]"
                  style={{ width: "55%" }}
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
            <div className="w-full ">
              <div className="h-8 w-full bg-[#032F38] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full w-3/4 bg-gradient-to-r from-[#00E2FF] to-[#00F5A0]"
                  style={{ width: "80%" }}
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
