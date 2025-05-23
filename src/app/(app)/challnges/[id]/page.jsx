"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import { useParams } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import LoadingPage from "@/app/components/LoadingPage";
import Link from "next/link";
import { IoIosArrowBack } from "react-icons/io";

const ChallengesPage = () => {
  const { isEnglish } = useLanguage();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionData, setSectionData] = useState(null);
  const { id } = useParams();

  // Get the appropriate color based on difficulty level
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "سهل":
      case "Easy":
        return "text-[#00D0FF]";
      case "متوسط":
      case "Medium":
        return "text-[#9DFF00]";
      case "صعب":
      case "Hard":
        return "text-red-500";
      case "صعب جدا":
      case "Very Hard":
        return "text-red-700";
      default:
        return "text-[#00D0FF]";
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

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await axios.get(
          `${apiUrl}/challenges/category/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.status === "success") {
          setChallenges(response.data.data);
          setSectionData(response.data);
        }
      } catch (error) {
        console.error("Error fetching challenges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [id, isEnglish]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen max-w-[2000px] mx-auto lg:px-12 px-10 text-white p-6">
      {/* Header Section */}
      <div
        className={`flex justify-between items-center mb-8 pt-28 ${
          isEnglish ? "text-left" : "text-right"
        }`}
      >
        <div
          className={`${
            isEnglish ? "mr-auto" : "ml-auto"
          } flex items-center gap-2`}
        >
          <p
            dir={isEnglish ? "ltr" : "rtl"}
            className="flex items-center gap-2"
          >
            <Link href={`/labs/${sectionData?.lab?.uuid}`}>
              {" "}
              {isEnglish ? sectionData?.lab?.name : sectionData?.lab?.ar_name}
            </Link>
            <IoIosArrowBack />

            <span className="text-[#38FFE5]">
              {isEnglish
                ? sectionData?.lab_category?.title
                : sectionData?.lab_category?.ar_title}
            </span>
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div
        className="bg-white/1 rounded-lg p-10 mb-8"
        style={{ boxShadow: "0px 0px 20px 0px #38FFE5 inset" }}
      >
        <div
          className={`md:flex items-center justify-between ${
            isEnglish ? "" : "flex-row-reverse"
          }`}
        >
          <div
            className={`flex items-center gap-4 ${
              isEnglish ? "" : "flex-row-reverse"
            }`}
          >
            <div>
              <Image
                src={sectionData?.lab_category?.image}
                alt={
                  isEnglish
                    ? sectionData?.lab_category?.title
                    : sectionData?.lab_category?.ar_title
                }
                width={100}
                height={100}
              />
            </div>
            <div className={`${isEnglish ? "text-left" : "text-right"}`}>
              <div
                className={`flex flex-col gap-2 ${
                  isEnglish ? "items-start" : "items-end"
                }`}
              >
                <div className="text-xl font-bold">
                  {isEnglish
                    ? sectionData?.lab_category?.title
                    : sectionData?.lab_category?.ar_title}
                </div>
                <p dir={isEnglish ? "ltr" : "rtl"} className="">
                  {isEnglish
                    ? `${challenges.length} Challenges`
                    : `${challenges.length} تحدي`}
                </p>
              </div>
              <div className="pt-4">
                <p>
                  {isEnglish
                    ? sectionData?.lab_category?.description
                    : sectionData?.lab_category?.ar_description}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Circle */}
          <div className="relative mx-auto md:mx-0 w-36 h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-28 h-24 rounded-full">
                <div className="absolute inset-0">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background gray circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#06373F"
                      strokeWidth="6"
                    />
                    {/* Progress circle overlay */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#38FFE5"
                      strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 *
                        Math.PI *
                        40 *
                        (1 - sectionData?.stats?.solved_percentage / 100)
                      }`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl text-teal-400">
                    {Math.floor(sectionData?.stats?.solved_percentage)}%
                  </span>
                </div>
              </div>
            </div>
            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className={`absolute ${
                isEnglish ? "-right-6" : "-left-6"
              } -bottom-3 flex items-center gap-1 text-xs text-center w-full text-gray-400`}
            >
              <p>
                {isEnglish
                  ? `${sectionData?.stats?.earned_bytes} `
                  : `${sectionData?.stats?.earned_bytes}`}
              </p>

              <span>/</span>
              <p>
                {isEnglish
                  ? `${sectionData?.stats?.total_bytes} `
                  : `${sectionData?.stats?.total_bytes}`}
              </p>
              <span>{isEnglish ? "Bytes" : "بايتس"}</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p
          dir={isEnglish ? "ltr" : "rtl"}
          className="text-white text-2xl font-bold py-10"
        >
          {" "}
          {isEnglish ? "Challenges" : "التحديات"}
        </p>
      </div>
      {/* Challenges Grid */}
      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {challenges.map((challenge) => (
          <div
            key={challenge.uuid}
            className="bg-white/5 rounded-2xl p-6 lg:mt-12 hover:shadow-[0_0_15px_rgba(56,255,229,0.3)] transition-shadow"
          >
            <div
              className={`flex   ${
                isEnglish ? "" : "flex-row "
              }  items-center mb-4  gap-4`}
            >
              <div
                className={`bg-transparent ${
                  isEnglish ? "" : ""
                } rounded-none w-12 h-12 gap-2 flex items-center justify-center`}
              >
                <Image
                  src={challenge.category_icon_url}
                  alt={challenge.category.name}
                  width={48}
                  height={48}
                  className="opacity-70"
                />
              </div>
              <div
                className={`flex flex-col ${
                  isEnglish ? "items-start" : "items-end"
                }`}
              >
                <span className=" font-bold text-xl">{challenge.title}</span>
              </div>
            </div>

            <div className="justify-between text-sm mb-6">
              <div className="flex items-center mt-2 gap-1 justify-between">
                <span>{isEnglish ? "Bytes:" : " بايتس :"}</span>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{challenge.bytes}</p>
                  <Image src="/byte.png" alt="byte" width={18} height={18} />
                </div>
              </div>
              <div className="flex items-center mt-4 gap-1 justify-between">
                <span>{isEnglish ? "First Blood:" : "الاختراقات :"}</span>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{challenge.solved_count}</p>

                  <Image
                    src="/card-user.png"
                    alt="user"
                    width={18}
                    height={18}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between flex-wrap">
              <div className={`flex items-center gap-1 ${isEnglish ? "" : ""}`}>
                <span className="text-white">
                  {isEnglish ? "Difficulty:" : "مستوى الصعوبة:"}
                </span>
                <span
                  className={`font-bold ${getDifficultyColor(
                    challenge.difficulty
                  )}`}
                >
                  {isEnglish
                    ? translateDifficultyToEnglish(challenge.difficulty)
                    : challenge.difficulty}
                </span>
              </div>
              <Link
                href={`/challnge/${challenge.uuid}`}
                className="text-[#38FFE5] font-semibold   rounded  hover:bg-[#38FFE5]/10 hover:transition-all duration-300 hover:p-1 hover:brightness-110"
              >
                {isEnglish ? "Start Now" : "ابدأ الآن"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengesPage;
