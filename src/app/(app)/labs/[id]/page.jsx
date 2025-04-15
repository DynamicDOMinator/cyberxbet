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
    <div className="pt-36 mx-auto px-4 py-8 max-w-[2000px]">
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

      {/* Challenges Grid */}
      <div className="grid mt-20 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryData?.last_three_challenges?.map((challenge, index) => (
          <div
            key={index}
            className="bg-white/5 rounded-lg p-6 flex flex-col h-full"
          >
            <div
              className={`flex ${
                isEnglish ? "flex-row" : "flex-row-reverse"
              } gap-5 items-center mb-4`}
            >
              <div className="flex items-center justify-center">
                <Image
                  src={challenge.category_icon}
                  alt={challenge.title}
                  width={56}
                  height={56}
                />
              </div>
              <h3
                className={`text-xl font-bold ${
                  isEnglish ? "text-left" : "text-right"
                }`}
              >
                {challenge.title}
              </h3>
            </div>
            <p
              className={`text-white ${
                isEnglish ? "text-left" : "text-left"
              } mb-6 flex-grow`}
            >
              {challenge.description}
            </p>
            <div
              className={`flex ${
                isEnglish ? "flex-row" : "flex-row-reverse"
              } justify-between`}
            >
              <div>
                <p>
                  {isEnglish ? "Difficulty Level: " : "مستوي الصعوبة :"}
                  <span className={getDifficultyColor(challenge.difficulty)}>
                    {getDifficultyText(challenge.difficulty)}
                  </span>
                </p>
              </div>
              <button className="text-[#38FFE5] lg:hover:py-2 lg:hover:px-4 cursor-pointer lg:hover:shadow-lg font-bold lg:hover:shadow-[#38FFE5] lg:hover:bg-[#38FFE5] lg:hover:text-black transition-all duration-300 rounded-md">
                {isEnglish ? "Start Now" : "إبدأ الآن"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Challenges Grid */}
      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="grid grid-cols-1 mt-20 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        {categoryData?.data?.map((category, index) => (
          <Link key={index} href={`/challnges/${category.uuid}`}>
            <div
              className="bg-white/1 cursor-pointer rounded-lg p-6 flex flex-col lg:min-h-[400px]"
              style={{ boxShadow: "0px -5px 20px 0px #38FFE5 inset" }}
            >
              <div className="flex flex-col h-full justify-center gap-4 items-center mb-4">
                <div className="flex items-center justify-center mb-4">
                  <Image
                    src={category.image}
                    alt={category.title}
                    width={200}
                    height={200}
                  />
                </div>
                <h3 className="text-xl font-bold text-center">
                  {category.title}
                </h3>
                <p className="text-white text-center">
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
