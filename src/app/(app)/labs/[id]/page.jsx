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

      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20"
      >
        {latestChallenges.length > 0 ? (
          latestChallenges.map((challenge) => (
            <div
              key={challenge.uuid}
              className="bg-white/3 backdrop-blur-xl rounded-lg p-4 flex flex-col justify-between min-h-[300px]"
            >
              <div>
                <div className="flex items-center gap-4">
                  <Image
                    src={
                      challenge.category_icon_url ||
                      `/${challenge.category_icon}`
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

              <div className="flex lg:flex lg:flex-wrap items-center justify-between gap-4 pt-10">
                <p>
                  {isEnglish ? (
                    <>
                      Difficulty Level:{" "}
                      <span
                        className={getDifficultyColor(challenge.difficulty)}
                      >
                        {challenge.difficulty}
                      </span>
                    </>
                  ) : (
                    <>
                      مستوي الصعوبة :{" "}
                      <span
                        className={getDifficultyColor(challenge.difficulty)}
                      >
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
          ))
        ) : (
          <>
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
                  <Link href="#">{isEnglish ? "Start Now" : "ابدأ الآن"}</Link>
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
                  flag. They must carefully analyze the file to uncover the
                  hidden message. Use your skills to explore this challenge!
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
                      مستوي الصعوبة :{" "}
                      <span className="text-[#38FFE5]">سهل</span>
                    </>
                  )}
                </p>
                <p className="text-[#38FFE5] text-[18px] font-semibold cursor-pointer hover:brightness-110">
                  <Link href="#">{isEnglish ? "Start Now" : "ابدأ الآن"}</Link>
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
                  <Link href="#">{isEnglish ? "Start Now" : "ابدأ الآن"}</Link>
                </p>
              </div>
            </div>
          </>
        )}
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
