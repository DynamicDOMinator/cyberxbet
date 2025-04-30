"use client";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams } from "next/navigation";
import Link from "next/link";
export default function TrainingChallenges() {
  const { isEnglish } = useLanguage();
  const [categoryData, setCategoryData] = useState(null);
  const [latestChallenges, setLatestChallenges] = useState([]);
  const params = useParams();

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(
          `${apiUrl}/labs/categories/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === "success") {
          setCategoryData(response.data);
        }
      } catch (error) {
        console.error("Error fetching category data:", error);
      }
    };

    if (params.id) {
      fetchCategoryData();
    }
  }, [params.id]);

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
    };

    fetchChallenges();
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "سهل":
        return "text-[#00D0FF]";
      case "متوسط":
        return "text-[#9DFF00]";
      case "صعب":
        return "text-red-500";
      default:
        return "text-[#00D0FF]";
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case "سهل":
        return isEnglish ? "Easy" : "سهل";
      case "متوسط":
        return isEnglish ? "Medium" : "متوسط";
      case "صعب":
        return isEnglish ? "Hard" : "صعب";
      default:
        return difficulty;
    }
  };

  return (
    <div className="pt-36 mx-auto px-[64px] py-8 max-w-[2000px]">
      {/* Header Section */}
      <h1
        className={`text-3xl font-bold mb-2 ${
          isEnglish ? "text-left" : "text-right"
        }`}
      >
        {isEnglish ? categoryData?.lab?.name : categoryData?.lab?.ar_name}
      </h1>
      <p
        dir={isEnglish ? "ltr" : "rtl"}
        className={`pt-3 text-white ${isEnglish ? "text-left" : "text-right"}`}
      >
        {isEnglish
          ? categoryData?.lab?.description
          : categoryData?.lab?.ar_description}
      </p>

      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="grid grid-cols-1 lg:grid-cols-3 gap-[56px] mt-20"
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
              <p dir={isEnglish ? "ltr" : "rtl"} className="text-white  text-[18px] pt-3">
                {challenge.description}
              </p>
            </div>

            <div className="flex lg:flex lg:flex-wrap items-center justify-between gap-4 pt-10">
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

      {/* New Challenges Grid */}
      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="grid grid-cols-1 mt-20 md:grid-cols-2 lg:grid-cols-3 gap-[56px] mb-12"
      >
        {categoryData?.data?.map((category, index) => (
          <Link key={index} href={`/challnges/${category.uuid}`}>
            <div
              className="bg-white/1 cursor-pointer rounded-lg p-6 flex items-center justify-center flex-col lg:min-h-[400px]"
              style={{ boxShadow: "0px -5px 20px 0px #38FFE5 inset" }}
            >
              <div className="flex  flex-col  justify-center gap-4 items-center mb-4">
                <div className="flex items-center justify-center mb-4 pt-[100px]">
                  <Image
                    src={category.image}
                    alt={category.title}
                    width={104}
                    height={104}
                  />
                </div>
                <h3 className="text-[24px] font-bold text-center">
                  {category.title}
                </h3>
                <p className="text-[#BCC9DB] text-[24px]  text-center">
                  {isEnglish
                    ? `${category.challenges_count} Challenges`
                    : `${category.challenges_count} تحدي`}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
