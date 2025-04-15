"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import { useParams } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import LoadingPage from "@/app/components/LoadingPage";
import Link from "next/link";
const ChallengesPage = () => {
  const { isEnglish } = useLanguage();
 
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState(null);
  const { id } = useParams();

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
      

         
          if (response.data.data.length > 0) {
            setCategoryData(response.data.data[0].category);
          }
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
    <div className="min-h-screen max-w-[2000px] mx-auto text-white p-6">
      {/* Header Section */}
      <div
        className={`flex justify-between items-center mb-8 pt-28 ${
          isEnglish ? "text-left" : "text-right"
        }`}
      >
        <div className="text-teal-400">
          {isEnglish
            ? `Training Challenges > ${categoryData?.name || ""}`
            : `${categoryData?.name || ""} < التحديات التدريبية`}
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
              {categoryData?.icon_url ? (
                <Image
                  src={categoryData.icon_url}
                  alt={categoryData.name}
                  width={100}
                  height={100}
                />
              ) : (
                <Image
                  src="/icon1-1.png"
                  alt="default"
                  width={100}
                  height={100}
                />
              )}
            </div>
            <div className={`${isEnglish ? "text-left" : "text-right"}`}>
              <div
                className={`flex flex-col gap-2 ${
                  isEnglish ? "items-start" : "items-end"
                }`}
              >
                <div className="text-xl text-teal-400">
                  {categoryData?.name || (isEnglish ? "Category" : "الفئة")}
                </div>
                <span className="text-gray-400">
                  {isEnglish
                    ? `${challenges.length} Challenges`
                    : `${challenges.length} تحدي`}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Circle */}
          <div className="relative mx-auto md:mx-0 w-32 h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-24 h-24 rounded-full">
                <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                <div
                  className="absolute inset-0 rounded-full border-4 border-teal-400 border-r-transparent border-b-transparent border-l-transparent"
                  
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl text-teal-400">40%</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 text-xs text-center w-full text-gray-400">
              {isEnglish
                ? `10/20 Bytes`
                : `بايتس 10/20`}
            </div>
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {challenges.map((challenge) => (
          <div
            key={challenge.uuid}
            className="bg-white/5 rounded-lg p-6 lg:mt-20 hover:shadow-[0_0_15px_rgba(56,255,229,0.3)] transition-shadow"
          >
            <div
              className={`flex ${
                isEnglish ? "flex-row pr-4" : "flex-row-reverse pr-3"
              } justify-between items-center mb-4`}
            >
              <div
                className={`flex flex-col ${
                  isEnglish ? "items-start" : "items-end"
                }`}
              >
                <span className="text-[#38FFE5] font-bold text-xl">
                  {challenge.title}
                </span>
              </div>
              <div
                className={`bg-transparent ${
                  isEnglish ? "flex-row-reverse" : ""
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
            </div>

            <div className="justify-between text-sm mb-6">
              <div className="flex items-center mt-2 gap-1 justify-between">
                <span >{isEnglish ? "Bytes:" : " بايتس :"}</span>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{challenge.bytes}</p>
                  <Image src="/byte.png" alt="byte" width={18} height={18} />
                </div>
              </div>
              <div  className="flex items-center mt-4 gap-1 justify-between">
                <span>{isEnglish ? "First Blood:" : " الدم الأول :"}</span>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">
                    {challenge.firstBloodBytes}
                  </p>
                  <Image
                    src="/card-user.png"
                    alt="user"
                    width={18}
                    height={18}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <div
                className={`flex items-center gap-1 ${
                  isEnglish ? "" : ""
                }`}
              >
                <span className="text-white">
                  {isEnglish ? "Difficulty:" : "مستوى الصعوبة:"}
                </span>
                <span className="text-red-500 font-bold">
                  {challenge.difficulty}
                </span>
              </div>
              <Link href={`/challnge/${challenge.uuid}`} className="text-[#38FFE5] hover:px-1 py-1 rounded hover:bg-[#38FFE5]/10 hover:transition-all duration-300">
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
